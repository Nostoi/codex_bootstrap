import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GraphService } from '../../graph.service';
import { GraphAuthService } from '../../auth/graph-auth.service';
import { getErrorMessage } from '../../../../common/utils/error.utils';
import {
  SyncResult,
  SyncOptions,
  SyncDirection,
  CalendarEventData,
  GraphCalendarEvent,
  LocalCalendarEvent,
  DeltaSyncOptions,
  SyncJob,
  SyncStatistics,
  NullableString,
  GraphDeltaEvent,
  isRemovedEvent,
  isActiveEvent,
  isRemovedGraphCalendarEvent,
  isActiveGraphCalendarEvent,
} from '../types/calendar-sync.types';
import { CalendarSyncStatus, CalendarConflictType } from '@prisma/client';
import { DeltaSyncManager } from './delta-sync.manager';
import { ConflictResolver } from './conflict-resolver.service';

/**
 * Calendar Synchronization Service
 * Orchestrates synchronization between Microsoft Graph calendars and local database
 */
@Injectable()
export class CalendarSyncService {
  private readonly logger = new Logger(CalendarSyncService.name);
  private readonly activeSyncJobs = new Map<string, SyncJob>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly graphService: GraphService,
    private readonly graphAuthService: GraphAuthService,
    private readonly deltaSyncManager: DeltaSyncManager,
    private readonly conflictResolver: ConflictResolver
  ) {}

  /**
   * Start a synchronization job
   */
  async startSync(userId: string, options: SyncOptions): Promise<SyncJob> {
    this.logger.log(`Starting sync for user ${userId} with options:`, options);

    // Check if user has active sync job
    const existingJob = Array.from(this.activeSyncJobs.values()).find(
      job => job.userId === userId && job.status === 'RUNNING'
    );

    if (existingJob) {
      throw new BadRequestException('Sync already in progress for this user');
    }

    // Verify authentication
    const isAuthenticated = await this.graphAuthService.isUserAuthenticated(userId);
    if (!isAuthenticated) {
      throw new BadRequestException('User not authenticated with Microsoft Graph');
    }

    // Create sync job
    const job: SyncJob = {
      id: `sync_${userId}_${Date.now()}`,
      userId,
      options,
      status: 'PENDING',
      progress: 0,
      startTime: new Date(),
    };

    this.activeSyncJobs.set(job.id, job);

    // Start sync process asynchronously
    this.executeSyncJob(job).catch(error => {
      this.logger.error(`Sync job ${job.id} failed:`, error);
      job.status = 'FAILED';
      job.error = error.message;
      job.endTime = new Date();
    });

    return job;
  }

  /**
   * Get sync status for a user
   */
  async getSyncStatus(userId: string): Promise<any> {
    const syncState = await this.prisma.calendarSyncState.findFirst({
      where: { userId },
    });

    if (!syncState) {
      return null;
    }

    const activeJob = Array.from(this.activeSyncJobs.values()).find(
      job => job.userId === userId && job.status === 'RUNNING'
    );

    return {
      jobId: syncState.id,
      status: syncState.status,
      direction: syncState.direction,
      progress: {
        total: syncState.totalEvents || 0,
        processed: syncState.processedEvents || 0,
      },
    };
  }

  /**
   * Get sync job by ID
   */
  getSyncJob(jobId: string): SyncJob | undefined {
    return this.activeSyncJobs.get(jobId);
  }

  /**
   * Cancel a running sync job
   */
  async cancelSync(userId: string, jobId: string): Promise<boolean> {
    const job = this.activeSyncJobs.get(jobId);
    if (!job || job.userId !== userId) {
      return false;
    }

    if (job.status === 'RUNNING') {
      job.status = 'FAILED';
      job.error = 'Cancelled by user';
      job.endTime = new Date();

      // Update sync state
      await this.updateSyncState(userId, {
        syncInProgress: false,
        lastSyncStatus: CalendarSyncStatus.FAILED,
        lastSyncError: 'Cancelled by user',
      });

      this.logger.log(`Sync job ${jobId} cancelled by user ${userId}`);
      return true;
    }

    return false;
  }

  /**
   * Execute a sync job
   */
  private async executeSyncJob(job: SyncJob): Promise<void> {
    try {
      job.status = 'RUNNING';
      this.logger.log(`Executing sync job ${job.id}`);

      // Update sync state to indicate sync in progress
      await this.updateSyncState(job.userId, {
        syncInProgress: true,
        lastSyncStatus: CalendarSyncStatus.IN_PROGRESS,
        lastSyncError: null,
      });

      let result: SyncResult;

      switch (job.options.direction) {
        case SyncDirection.PULL_FROM_GRAPH:
          result = await this.pullFromGraph(job);
          break;
        case SyncDirection.PUSH_TO_GRAPH:
          result = await this.pushToGraph(job);
          break;
        case SyncDirection.BIDIRECTIONAL:
          result = await this.bidirectionalSync(job);
          break;
        default:
          throw new Error(`Unsupported sync direction: ${job.options.direction}`);
      }

      job.status = 'COMPLETED';
      job.result = result;
      job.progress = 100;

      // Update sync state
      await this.updateSyncState(job.userId, {
        syncInProgress: false,
        lastSyncStatus: result.success ? CalendarSyncStatus.COMPLETED : CalendarSyncStatus.FAILED,
        lastDeltaSync: new Date(),
        syncedEvents: result.syncedCount,
        conflictedEvents: result.conflictCount,
        failedEvents: result.errorCount,
      });

      this.logger.log(`Sync job ${job.id} completed successfully:`, result);
    } catch (error) {
      job.status = 'FAILED';
      job.error = getErrorMessage(error);
      job.progress = 0;

      // Update sync state
      await this.updateSyncState(job.userId, {
        syncInProgress: false,
        lastSyncStatus: CalendarSyncStatus.FAILED,
        lastSyncError: getErrorMessage(error),
      });

      this.logger.error(`Sync job ${job.id} failed:`, error);
      throw error;
    } finally {
      job.endTime = new Date();
      // Clean up completed jobs after 1 hour
      setTimeout(
        () => {
          this.activeSyncJobs.delete(job.id);
        },
        60 * 60 * 1000
      );
    }
  }

  /**
   * Pull events from Microsoft Graph to local database
   */
  private async pullFromGraph(job: SyncJob): Promise<SyncResult> {
    this.logger.log(`Pulling events from Graph for user ${job.userId}`);

    const syncState = await this.getSyncState(job.userId);
    const options: DeltaSyncOptions = {
      calendarId: job.calendarId,
      maxResults: 1000,
    };

    let syncedCount = 0;
    let conflictCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const conflicts: any[] = [];

    try {
      // Determine if we need full sync or delta sync
      const needsFullSync =
        job.options.fullSync || !syncState?.deltaToken || !syncState?.lastDeltaSync;

      let events: (GraphCalendarEvent | GraphDeltaEvent)[];

      if (needsFullSync) {
        this.logger.log('Performing full sync');
        const eventsResponse = await this.graphService.getCalendarEvents(job.userId);
        events = eventsResponse.value || [];
        job.progress = 30;
      } else {
        this.logger.log('Performing delta sync');
        const deltaResult = await this.deltaSyncManager.getDeltaChanges(
          job.userId,
          syncState.deltaToken!,
          options
        );
        events = deltaResult.events;

        // Update delta token
        if (deltaResult.deltaToken) {
          await this.updateSyncState(job.userId, {
            deltaToken: deltaResult.deltaToken,
          });
        }
        job.progress = 30;
      }

      this.logger.log(`Retrieved ${events.length} events from Graph`);

      // Process each event
      for (let i = 0; i < events.length; i++) {
        try {
          const graphEvent = events[i];

          // Handle removed events separately
          if (isRemovedGraphCalendarEvent(graphEvent)) {
            // Delete the local event if it exists
            const localEvent = await this.findLocalEvent(job.userId, graphEvent.id);
            if (localEvent) {
              await this.deleteLocalEvent(localEvent.id);
              syncedCount++;
            }
            continue;
          }

          // Handle active events - graphEvent is now guaranteed to be an active event
          if (!isActiveGraphCalendarEvent(graphEvent)) {
            continue; // Skip unknown event types
          }

          // Cast to GraphCalendarEvent since we know it's active
          const activeEvent = graphEvent as GraphCalendarEvent;

          const localEvent = await this.findLocalEvent(job.userId, activeEvent.id);

          if (localEvent) {
            // Update existing event
            const conflictResult = await this.conflictResolver.detectConflicts(
              localEvent,
              activeEvent,
              syncState?.lastDeltaSync || new Date(0)
            );

            if (conflictResult) {
              await this.createConflictRecord(localEvent.id, conflictResult);
              conflictCount++;
              conflicts.push({
                eventId: localEvent.id,
                conflictType: conflictResult.conflictType,
                autoResolvable: conflictResult.autoResolvable,
              });
            } else {
              await this.updateLocalEvent(localEvent.id, activeEvent);
              syncedCount++;
            }
          } else {
            // Create new event
            await this.createLocalEvent(job.userId, activeEvent);
            syncedCount++;
          }

          job.progress = 30 + (60 * (i + 1)) / events.length;
        } catch (error) {
          this.logger.error(`Error processing event ${events[i]?.id}:`, error);
          errorCount++;
          errors.push(`Event ${events[i]?.id}: ${getErrorMessage(error)}`);
        }
      }

      job.progress = 90;

      // Update sync statistics
      await this.updateSyncState(job.userId, {
        totalEvents: await this.countUserEvents(job.userId),
        lastFullSync: needsFullSync ? new Date() : syncState?.lastFullSync,
      });

      return {
        success: errorCount === 0,
        syncedCount,
        conflictCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      };
    } catch (error) {
      this.logger.error('Pull sync failed:', error);
      throw error;
    }
  }

  /**
   * Push local events to Microsoft Graph
   */
  private async pushToGraph(job: SyncJob): Promise<SyncResult> {
    this.logger.log(`Pushing events to Graph for user ${job.userId}`);

    // Get locally modified events
    const localEvents = await this.prisma.calendarEvent.findMany({
      where: {
        userId: job.userId,
        locallyModified: true,
      },
    });

    let syncedCount = 0;
    let conflictCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < localEvents.length; i++) {
      try {
        const localEvent = localEvents[i];

        if (localEvent.graphId) {
          // Update existing Graph event
          await this.graphService.updateCalendarEvent(
            job.userId,
            localEvent.graphId,
            this.convertLocalEventToGraph(localEvent)
          );
        } else {
          // Create new Graph event
          const createdEvent = await this.graphService.createCalendarEvent(
            job.userId,
            this.convertLocalEventToGraph(localEvent)
          );

          // Update local event with Graph ID
          await this.prisma.calendarEvent.update({
            where: { id: localEvent.id },
            data: {
              graphId: createdEvent.id,
              graphEtag: createdEvent['@odata.etag'],
            },
          });
        }

        // Mark as synced
        await this.prisma.calendarEvent.update({
          where: { id: localEvent.id },
          data: {
            locallyModified: false,
            lastSyncedAt: new Date(),
            syncStatus: CalendarSyncStatus.COMPLETED,
          },
        });

        syncedCount++;
        job.progress = (80 * (i + 1)) / localEvents.length;
      } catch (error) {
        this.logger.error(`Error pushing event ${localEvents[i].id}:`, error);
        errorCount++;
        errors.push(`Event ${localEvents[i].id}: ${getErrorMessage(error)}`);
      }
    }

    return {
      success: errorCount === 0,
      syncedCount,
      conflictCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Bidirectional synchronization
   */
  private async bidirectionalSync(job: SyncJob): Promise<SyncResult> {
    this.logger.log(`Performing bidirectional sync for user ${job.userId}`);

    // First pull from Graph
    const pullResult = await this.pullFromGraph({
      ...job,
      options: { ...job.options, direction: SyncDirection.PULL_FROM_GRAPH },
    });

    job.progress = 50;

    // Then push to Graph
    const pushResult = await this.pushToGraph({
      ...job,
      options: { ...job.options, direction: SyncDirection.PUSH_TO_GRAPH },
    });

    return {
      success: pullResult.success && pushResult.success,
      syncedCount: pullResult.syncedCount + pushResult.syncedCount,
      conflictCount: pullResult.conflictCount + pushResult.conflictCount,
      errorCount: pullResult.errorCount + pushResult.errorCount,
      errors: [...(pullResult.errors || []), ...(pushResult.errors || [])],
      conflicts: pullResult.conflicts,
    };
  }

  // Helper methods

  /**
   * Get synchronization state with null-safe calendarId handling
   */
  private async getSyncState(userId: string) {
    return await this.prisma.calendarSyncState.findFirst({
      where: {
        userId,
        calendarId: null, // Direct null for default calendar
      },
    });
  }

  /**
   * Update synchronization state with null-safe calendarId handling
   */
  private async updateSyncState(userId: string, updates: any) {
    await this.prisma.calendarSyncState.upsert({
      where: {
        userId_calendarId: {
          userId,
          calendarId: undefined as any, // Workaround for Prisma unique constraint typing
        },
      },
      update: updates,
      create: {
        userId,
        calendarId: null, // Direct null for default calendar
        ...updates,
      },
    });
  }

  /**
   * Find local calendar event by user ID and Graph ID (returns null-safe LocalCalendarEvent)
   */
  private async findLocalEvent(
    userId: string,
    graphId: string
  ): Promise<LocalCalendarEvent | null> {
    const prismaEvent = await this.prisma.calendarEvent.findUnique({
      where: {
        userId_graphId: {
          userId,
          graphId,
        },
      },
    });

    if (!prismaEvent) {
      return null;
    }

    return this.convertPrismaToLocal(prismaEvent);
  }

  private async countUserEvents(userId: string): Promise<number> {
    return await this.prisma.calendarEvent.count({
      where: { userId },
    });
  }

  /**
   * Convert Graph calendar event to LocalCalendarEvent (null-safe)
   */
  private convertGraphEventToLocal(graphEvent: GraphCalendarEvent): CalendarEventData {
    return {
      subject: graphEvent.subject,
      description: graphEvent.body?.content ?? null,
      location: graphEvent.location?.displayName ?? null,
      startTime: new Date(graphEvent.start.dateTime),
      endTime: new Date(graphEvent.end.dateTime),
      timeZone: graphEvent.start.timeZone ?? null,
      isAllDay: graphEvent.isAllDay ?? false,
      isRecurring: !!graphEvent.recurrence,
      recurrencePattern: graphEvent.recurrence ? JSON.stringify(graphEvent.recurrence) : null,
    };
  }

  /**
   * Convert Prisma CalendarEvent to LocalCalendarEvent (null-safe)
   */
  private convertPrismaToLocal(prismaEvent: any): LocalCalendarEvent {
    return {
      id: prismaEvent.id,
      userId: prismaEvent.userId,
      graphId: prismaEvent.graphId ?? null, // Convert undefined to null for consistency
      subject: prismaEvent.subject,
      description: prismaEvent.description ?? null,
      location: prismaEvent.location ?? null,
      startTime: prismaEvent.startTime,
      endTime: prismaEvent.endTime,
      timeZone: prismaEvent.timeZone ?? null,
      isAllDay: prismaEvent.isAllDay ?? false,
      isRecurring: prismaEvent.isRecurring ?? false,
      recurrencePattern: prismaEvent.recurrencePattern ?? null,
      createdAt: prismaEvent.createdAt,
      updatedAt: prismaEvent.updatedAt,
      syncStatus: prismaEvent.syncStatus,
    };
  }

  private convertLocalEventToGraph(localEvent: any): any {
    return {
      subject: localEvent.subject,
      body: localEvent.description
        ? {
            content: localEvent.description,
            contentType: 'text',
          }
        : undefined,
      location: localEvent.location
        ? {
            displayName: localEvent.location,
          }
        : undefined,
      start: {
        dateTime: localEvent.startTime.toISOString(),
        timeZone: localEvent.timeZone || 'UTC',
      },
      end: {
        dateTime: localEvent.endTime.toISOString(),
        timeZone: localEvent.timeZone || 'UTC',
      },
      isAllDay: localEvent.isAllDay,
      recurrence: localEvent.recurrencePattern
        ? JSON.parse(localEvent.recurrencePattern)
        : undefined,
    };
  }

  private async createLocalEvent(userId: string, graphEvent: GraphCalendarEvent) {
    const eventData = this.convertGraphEventToLocal(graphEvent);

    return await this.prisma.calendarEvent.create({
      data: {
        graphId: graphEvent.id,
        subject: eventData.subject,
        body: eventData.description,
        start: eventData.startTime,
        end: eventData.endTime,
        location: eventData.location,
        isAllDay: eventData.isAllDay,
        rawData: graphEvent as any,
        lastModified: new Date(),
        user: {
          connect: { id: userId },
        },
        graphEtag: graphEvent['@odata.etag'],
        graphCalendarId: 'default', // TODO: Get actual calendar ID
        description: eventData.description,
        lastSyncedAt: new Date(),
        syncStatus: 'COMPLETED',
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        timeZone: eventData.timeZone,
        isRecurring: eventData.isRecurring,
        recurrencePattern: eventData.recurrencePattern,
        locallyModified: false,
        remotelyModified: false,
      },
    });
  }

  private async updateLocalEvent(localEventId: string, graphEvent: GraphCalendarEvent) {
    const eventData = this.convertGraphEventToLocal(graphEvent);

    return await this.prisma.calendarEvent.update({
      where: { id: localEventId },
      data: {
        graphEtag: graphEvent['@odata.etag'],
        subject: eventData.subject,
        description: eventData.description,
        location: eventData.location,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        timeZone: eventData.timeZone,
        isAllDay: eventData.isAllDay,
        isRecurring: eventData.isRecurring,
        recurrencePattern: eventData.recurrencePattern,
        lastSyncedAt: new Date(),
        remotelyModified: false,
        syncStatus: 'COMPLETED',
      },
    });
  }

  private async deleteLocalEvent(localEventId: string) {
    this.logger.log(`Deleting local event ${localEventId} due to remote deletion`);

    return await this.prisma.calendarEvent.delete({
      where: { id: localEventId },
    });
  }

  private async createConflictRecord(localEventId: string, conflictResult: any) {
    return await this.prisma.calendarSyncConflict.create({
      data: {
        conflictType: conflictResult.conflictType,
        description: 'Calendar sync conflict detected',
        localData: conflictResult.localVersion,
        remoteData: conflictResult.remoteVersion,
        autoResolved: conflictResult.autoResolvable,
        localVersion: JSON.stringify(conflictResult.localVersion),
        remoteVersion: JSON.stringify(conflictResult.remoteVersion),
        event: {
          connect: { id: localEventId },
        },
      },
    });
  }

  /**
   * Get sync history for a user with pagination
   */
  async getSyncHistory(userId: string, limit: number = 10, offset: number = 0) {
    return await this.prisma.calendarSyncState.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Test sync capabilities for a user
   */
  async testSyncCapabilities(userId: string) {
    try {
      // Check authentication
      const isTokenValid = await this.graphAuthService.isUserAuthenticated(userId);
      if (!isTokenValid) {
        return {
          canSync: false,
          deltaSupported: false,
          calendars: [],
        };
      }

      // Check delta sync support
      const deltaSupported = await this.deltaSyncManager.isDeltaSyncSupported(userId);

      // Get available calendars
      let calendars = [];
      try {
        const calendarData = await this.graphService.getCalendars(userId);
        calendars = calendarData || [];
      } catch (error) {
        this.logger.warn(`Could not fetch calendars for user ${userId}:`, getErrorMessage(error));
        calendars = [];
      }

      return {
        canSync: true,
        deltaSupported,
        calendars,
      };
    } catch (error) {
      this.logger.error(`Error testing sync capabilities for user ${userId}:`, error);
      return {
        canSync: false,
        deltaSupported: false,
        calendars: [],
      };
    }
  }

  /**
   * Get sync metrics for a user over a specified period
   */
  async getSyncMetrics(userId: string, daysPeriod: number = 7) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysPeriod);

    const syncHistory = await this.prisma.calendarSyncState.findMany({
      where: {
        userId,
        createdAt: {
          gte: fromDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalSyncs = syncHistory.length;
    const successfulSyncs = syncHistory.filter(
      sync => sync.status === CalendarSyncStatus.COMPLETED
    ).length;
    const failedSyncs = syncHistory.filter(
      sync => sync.status === CalendarSyncStatus.FAILED
    ).length;

    const totalEvents = syncHistory.reduce((sum, sync) => sum + (sync.totalEvents || 0), 0);
    const syncedEvents = syncHistory.reduce((sum, sync) => sum + (sync.syncedEvents || 0), 0);
    const conflictedEvents = syncHistory.reduce(
      (sum, sync) => sum + (sync.conflictedEvents || 0),
      0
    );
    const failedEvents = syncHistory.reduce((sum, sync) => sum + (sync.failedEvents || 0), 0);

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      totalEvents,
      syncedEvents,
      conflictedEvents,
      failedEvents,
      period: daysPeriod,
      lastSyncTime: syncHistory[0]?.lastDeltaSync || syncHistory[0]?.lastFullSync,
    };
  }
}
