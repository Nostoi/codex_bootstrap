import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GraphService } from '../../graph.service';
import { GraphAuthService } from '../../auth/graph-auth.service';
import { 
  SyncResult, 
  SyncOptions, 
  SyncDirection, 
  CalendarEventData,
  GraphCalendarEvent,
  DeltaSyncOptions,
  SyncJob,
  SyncStatistics
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
    private readonly conflictResolver: ConflictResolver,
  ) {}

  /**
   * Start a synchronization job
   */
  async startSync(userId: string, options: SyncOptions): Promise<SyncJob> {
    this.logger.log(`Starting sync for user ${userId} with options:`, options);

    // Check if user has active sync job
    const existingJob = Array.from(this.activeSyncJobs.values())
      .find(job => job.userId === userId && job.status === 'RUNNING');
    
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

    const activeJob = Array.from(this.activeSyncJobs.values())
      .find(job => job.userId === userId && job.status === 'RUNNING');

    return {
      syncInProgress: !!activeJob,
      jobId: activeJob?.id,
      progress: activeJob?.progress || 0,
      lastSyncTime: syncState?.lastDeltaSync || syncState?.lastFullSync,
      totalEvents: syncState?.totalEvents || 0,
      syncedEvents: syncState?.syncedEvents || 0,
      conflictedEvents: syncState?.conflictedEvents || 0,
      failedEvents: syncState?.failedEvents || 0,
      lastSyncStatus: syncState?.lastSyncStatus,
      lastSyncError: syncState?.lastSyncError,
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
      job.error = error.message;
      job.progress = 0;

      // Update sync state
      await this.updateSyncState(job.userId, {
        syncInProgress: false,
        lastSyncStatus: CalendarSyncStatus.FAILED,
        lastSyncError: error.message,
      });

      this.logger.error(`Sync job ${job.id} failed:`, error);
      throw error;
    } finally {
      job.endTime = new Date();
      // Clean up completed jobs after 1 hour
      setTimeout(() => {
        this.activeSyncJobs.delete(job.id);
      }, 60 * 60 * 1000);
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
      const needsFullSync = job.options.fullSync || 
                           !syncState?.deltaToken || 
                           !syncState?.lastDeltaSync;

      let events: GraphCalendarEvent[];

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
          const localEvent = await this.findLocalEvent(job.userId, graphEvent.id);

          if (localEvent) {
            // Update existing event
            const conflictResult = await this.conflictResolver.detectConflicts(
              localEvent,
              this.convertGraphEventToLocal(graphEvent)
            );

            if (conflictResult.hasConflict) {
              await this.createConflictRecord(localEvent.id, conflictResult);
              conflictCount++;
              conflicts.push({
                eventId: localEvent.id,
                conflictType: conflictResult.conflictType,
                autoResolvable: conflictResult.autoResolvable,
              });
            } else {
              await this.updateLocalEvent(localEvent.id, graphEvent);
              syncedCount++;
            }
          } else {
            // Create new event
            await this.createLocalEvent(job.userId, graphEvent);
            syncedCount++;
          }

          job.progress = 30 + (60 * (i + 1) / events.length);
        } catch (error) {
          this.logger.error(`Error processing event ${events[i]?.id}:`, error);
          errorCount++;
          errors.push(`Event ${events[i]?.id}: ${error.message}`);
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
        job.progress = (80 * (i + 1) / localEvents.length);

      } catch (error) {
        this.logger.error(`Error pushing event ${localEvents[i].id}:`, error);
        errorCount++;
        errors.push(`Event ${localEvents[i].id}: ${error.message}`);
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
      options: { ...job.options, direction: SyncDirection.PULL_FROM_GRAPH }
    });

    job.progress = 50;

    // Then push to Graph
    const pushResult = await this.pushToGraph({
      ...job,
      options: { ...job.options, direction: SyncDirection.PUSH_TO_GRAPH }
    });

    return {
      success: pullResult.success && pushResult.success,
      syncedCount: pullResult.syncedCount + pushResult.syncedCount,
      conflictCount: pullResult.conflictCount + pushResult.conflictCount,
      errorCount: pullResult.errorCount + pushResult.errorCount,
      errors: [
        ...(pullResult.errors || []),
        ...(pushResult.errors || [])
      ],
      conflicts: pullResult.conflicts,
    };
  }

  // Helper methods

  private async getSyncState(userId: string) {
    return await this.prisma.calendarSyncState.findFirst({
      where: { userId, calendarId: null }, // Default calendar
    });
  }

  private async updateSyncState(userId: string, updates: any) {
    await this.prisma.calendarSyncState.upsert({
      where: {
        userId_calendarId: {
          userId,
          calendarId: null,
        },
      },
      update: updates,
      create: {
        userId,
        calendarId: null,
        ...updates,
      },
    });
  }

  private async findLocalEvent(userId: string, graphId: string) {
    return await this.prisma.calendarEvent.findUnique({
      where: {
        userId_graphId: {
          userId,
          graphId,
        },
      },
    });
  }

  private async countUserEvents(userId: string): Promise<number> {
    return await this.prisma.calendarEvent.count({
      where: { userId },
    });
  }

  private convertGraphEventToLocal(graphEvent: GraphCalendarEvent): CalendarEventData {
    return {
      subject: graphEvent.subject,
      description: graphEvent.body?.content,
      location: graphEvent.location?.displayName,
      startTime: new Date(graphEvent.start.dateTime),
      endTime: new Date(graphEvent.end.dateTime),
      timeZone: graphEvent.start.timeZone,
      isAllDay: graphEvent.isAllDay,
      isRecurring: !!graphEvent.recurrence,
      recurrencePattern: graphEvent.recurrence ? JSON.stringify(graphEvent.recurrence) : undefined,
    };
  }

  private convertLocalEventToGraph(localEvent: any): any {
    return {
      subject: localEvent.subject,
      body: localEvent.description ? {
        content: localEvent.description,
        contentType: 'text',
      } : undefined,
      location: localEvent.location ? {
        displayName: localEvent.location,
      } : undefined,
      start: {
        dateTime: localEvent.startTime.toISOString(),
        timeZone: localEvent.timeZone || 'UTC',
      },
      end: {
        dateTime: localEvent.endTime.toISOString(),
        timeZone: localEvent.timeZone || 'UTC',
      },
      isAllDay: localEvent.isAllDay,
      recurrence: localEvent.recurrencePattern ? 
        JSON.parse(localEvent.recurrencePattern) : undefined,
    };
  }

  private async createLocalEvent(userId: string, graphEvent: GraphCalendarEvent) {
    const eventData = this.convertGraphEventToLocal(graphEvent);
    
    return await this.prisma.calendarEvent.create({
      data: {
        userId,
        graphId: graphEvent.id,
        graphCalendarId: 'default', // TODO: Get actual calendar ID
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
        syncStatus: CalendarSyncStatus.COMPLETED,
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
        syncStatus: CalendarSyncStatus.COMPLETED,
      },
    });
  }

  private async createConflictRecord(localEventId: string, conflictResult: any) {
    return await this.prisma.calendarSyncConflict.create({
      data: {
        calendarEventId: localEventId,
        conflictType: conflictResult.conflictType,
        localVersion: JSON.stringify(conflictResult.localVersion),
        remoteVersion: JSON.stringify(conflictResult.remoteVersion),
        autoResolvable: conflictResult.autoResolvable,
      },
    });
  }
}
