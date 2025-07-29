import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { 
  ConflictInfo, 
  ConflictResolutionStrategy,
  GraphCalendarEvent,
  LocalCalendarEvent 
} from '../types/calendar-sync.types';
import { CalendarConflictType, CalendarConflictResolution } from '@prisma/client';

/**
 * Conflict Resolver
 * Handles calendar synchronization conflicts between local and Graph events
 */
@Injectable()
export class ConflictResolver {
  private readonly logger = new Logger(ConflictResolver.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Detect conflicts between local and Graph events
   */
  async detectConflicts(
    localEvent: LocalCalendarEvent,
    graphEvent: GraphCalendarEvent,
    lastSyncTime: Date
  ): Promise<ConflictInfo | null> {
    this.logger.debug(`Detecting conflicts for event ${localEvent.id}`);

    const conflicts: CalendarConflictType[] = [];
    const details: Record<string, any> = {};

    // Check if both events were modified after last sync
    const localModified = new Date(localEvent.lastModifiedDateTime);
    const graphModified = new Date(graphEvent.lastModifiedDateTime);

    if (localModified > lastSyncTime && graphModified > lastSyncTime) {
      // Both modified - check specific fields for conflicts
      
      // Subject/Title conflict
      if (localEvent.subject !== graphEvent.subject) {
        conflicts.push(CalendarConflictType.TITLE);
        details.title = {
          local: localEvent.subject,
          remote: graphEvent.subject,
        };
      }

      // Description/Body conflict
      const localBody = localEvent.body?.content || '';
      const graphBody = graphEvent.body?.content || '';
      if (localBody !== graphBody) {
        conflicts.push(CalendarConflictType.DESCRIPTION);
        details.description = {
          local: localBody,
          remote: graphBody,
        };
      }

      // Start time conflict
      const localStart = new Date(localEvent.start.dateTime);
      const graphStart = new Date(graphEvent.start.dateTime);
      if (localStart.getTime() !== graphStart.getTime()) {
        conflicts.push(CalendarConflictType.START_TIME);
        details.startTime = {
          local: localEvent.start.dateTime,
          remote: graphEvent.start.dateTime,
        };
      }

      // End time conflict
      const localEnd = new Date(localEvent.end.dateTime);
      const graphEnd = new Date(graphEvent.end.dateTime);
      if (localEnd.getTime() !== graphEnd.getTime()) {
        conflicts.push(CalendarConflictType.END_TIME);
        details.endTime = {
          local: localEvent.end.dateTime,
          remote: graphEvent.end.dateTime,
        };
      }

      // Location conflict
      const localLocation = localEvent.location?.displayName || '';
      const graphLocation = graphEvent.location?.displayName || '';
      if (localLocation !== graphLocation) {
        conflicts.push(CalendarConflictType.LOCATION);
        details.location = {
          local: localLocation,
          remote: graphLocation,
        };
      }

      // All-day flag conflict
      if (localEvent.isAllDay !== graphEvent.isAllDay) {
        conflicts.push(CalendarConflictType.ALL_DAY);
        details.allDay = {
          local: localEvent.isAllDay,
          remote: graphEvent.isAllDay,
        };
      }

      // Recurrence conflict (simplified check)
      const localHasRecurrence = !!localEvent.recurrence;
      const graphHasRecurrence = !!graphEvent.recurrence;
      if (localHasRecurrence !== graphHasRecurrence) {
        conflicts.push(CalendarConflictType.RECURRENCE);
        details.recurrence = {
          local: localHasRecurrence,
          remote: graphHasRecurrence,
        };
      }
    }

    if (conflicts.length === 0) {
      return null;
    }

    return {
      eventId: localEvent.id,
      conflictTypes: conflicts,
      localModified,
      remoteModified: graphModified,
      details,
      suggestedResolution: this.suggestResolution(conflicts, localModified, graphModified),
    };
  }

  /**
   * Automatically resolve conflicts based on strategy
   */
  async autoResolveConflict(
    conflict: ConflictInfo,
    strategy: ConflictResolutionStrategy,
    localEvent: LocalCalendarEvent,
    graphEvent: GraphCalendarEvent
  ): Promise<{
    resolvedEvent: LocalCalendarEvent | GraphCalendarEvent;
    resolution: CalendarConflictResolution;
    details: Record<string, any>;
  }> {
    this.logger.log(`Auto-resolving conflict for event ${conflict.eventId} with strategy: ${strategy}`);

    let resolvedEvent: LocalCalendarEvent | GraphCalendarEvent;
    let resolution: CalendarConflictResolution;
    const resolutionDetails: Record<string, any> = {};

    switch (strategy) {
      case 'prefer_local':
        resolvedEvent = localEvent;
        resolution = CalendarConflictResolution.PREFER_LOCAL;
        resolutionDetails.reason = 'User preference: prefer local changes';
        break;

      case 'prefer_remote':
        resolvedEvent = graphEvent;
        resolution = CalendarConflictResolution.PREFER_REMOTE;
        resolutionDetails.reason = 'User preference: prefer remote changes';
        break;

      case 'prefer_latest':
        if (conflict.localModified > conflict.remoteModified) {
          resolvedEvent = localEvent;
          resolution = CalendarConflictResolution.PREFER_LOCAL;
          resolutionDetails.reason = 'Local event modified more recently';
        } else {
          resolvedEvent = graphEvent;
          resolution = CalendarConflictResolution.PREFER_REMOTE;
          resolutionDetails.reason = 'Remote event modified more recently';
        }
        break;

      case 'merge':
        resolvedEvent = this.mergeEvents(localEvent, graphEvent, conflict);
        resolution = CalendarConflictResolution.MERGED;
        resolutionDetails.reason = 'Merged compatible changes from both versions';
        resolutionDetails.mergeStrategy = 'intelligent_merge';
        break;

      case 'manual':
      default:
        throw new Error('Manual resolution required - cannot auto-resolve');
    }

    return {
      resolvedEvent,
      resolution,
      details: resolutionDetails,
    };
  }

  /**
   * Record conflict in database
   */
  async recordConflict(
    userId: string,
    syncStateId: string,
    conflict: ConflictInfo
  ): Promise<string> {
    this.logger.log(`Recording conflict for event ${conflict.eventId}`);

    const conflictRecord = await this.prisma.calendarSyncConflict.create({
      data: {
        syncStateId,
        eventId: conflict.eventId,
        conflictType: conflict.conflictTypes[0], // Primary conflict type
        conflictData: {
          conflictTypes: conflict.conflictTypes,
          localModified: conflict.localModified,
          remoteModified: conflict.remoteModified,
          details: conflict.details,
          suggestedResolution: conflict.suggestedResolution,
        },
        resolution: CalendarConflictResolution.PENDING,
      },
    });

    return conflictRecord.id;
  }

  /**
   * Resolve conflict manually
   */
  async resolveConflictManually(
    conflictId: string,
    resolution: CalendarConflictResolution,
    resolvedData: Record<string, any>
  ): Promise<void> {
    this.logger.log(`Manually resolving conflict ${conflictId} with resolution: ${resolution}`);

    await this.prisma.calendarSyncConflict.update({
      where: { id: conflictId },
      data: {
        resolution,
        resolvedAt: new Date(),
        resolutionData: resolvedData,
      },
    });
  }

  /**
   * Get pending conflicts for a user
   */
  async getPendingConflicts(userId: string): Promise<any[]> {
    const conflicts = await this.prisma.calendarSyncConflict.findMany({
      where: {
        syncState: {
          userId,
        },
        resolution: CalendarConflictResolution.PENDING,
      },
      include: {
        syncState: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return conflicts;
  }

  /**
   * Suggest resolution strategy based on conflict types and timing
   */
  private suggestResolution(
    conflictTypes: CalendarConflictType[],
    localModified: Date,
    remoteModified: Date
  ): ConflictResolutionStrategy {
    // If only time-based conflicts, suggest merge
    const timeConflicts = [
      CalendarConflictType.START_TIME,
      CalendarConflictType.END_TIME,
    ];
    
    if (conflictTypes.every(type => timeConflicts.includes(type))) {
      return 'merge';
    }

    // If content conflicts (title, description), prefer latest
    const contentConflicts = [
      CalendarConflictType.TITLE,
      CalendarConflictType.DESCRIPTION,
    ];
    
    if (conflictTypes.some(type => contentConflicts.includes(type))) {
      return 'prefer_latest';
    }

    // For complex conflicts, suggest manual resolution
    if (conflictTypes.length > 2) {
      return 'manual';
    }

    // Default to prefer latest
    return 'prefer_latest';
  }

  /**
   * Intelligently merge two events
   */
  private mergeEvents(
    localEvent: LocalCalendarEvent,
    graphEvent: GraphCalendarEvent,
    conflict: ConflictInfo
  ): LocalCalendarEvent {
    const merged: LocalCalendarEvent = { ...localEvent };

    // Use latest modification time for each field
    for (const conflictType of conflict.conflictTypes) {
      const localNewer = conflict.localModified > conflict.remoteModified;

      switch (conflictType) {
        case CalendarConflictType.TITLE:
          merged.subject = localNewer ? localEvent.subject : graphEvent.subject;
          break;

        case CalendarConflictType.DESCRIPTION:
          merged.body = localNewer ? localEvent.body : graphEvent.body;
          break;

        case CalendarConflictType.START_TIME:
          merged.start = localNewer ? localEvent.start : graphEvent.start;
          break;

        case CalendarConflictType.END_TIME:
          merged.end = localNewer ? localEvent.end : graphEvent.end;
          break;

        case CalendarConflictType.LOCATION:
          merged.location = localNewer ? localEvent.location : graphEvent.location;
          break;

        case CalendarConflictType.ALL_DAY:
          merged.isAllDay = localNewer ? localEvent.isAllDay : graphEvent.isAllDay;
          break;

        case CalendarConflictType.RECURRENCE:
          merged.recurrence = localNewer ? localEvent.recurrence : graphEvent.recurrence;
          break;
      }
    }

    // Update modification time
    merged.lastModifiedDateTime = new Date().toISOString();

    return merged;
  }

  /**
   * Check if events are functionally equivalent (ignoring minor differences)
   */
  areEventsEquivalent(
    event1: LocalCalendarEvent | GraphCalendarEvent,
    event2: LocalCalendarEvent | GraphCalendarEvent,
    tolerance: { time: number; content: boolean } = { time: 60000, content: true }
  ): boolean {
    // Check core properties
    if (event1.subject !== event2.subject) {
      return false;
    }

    // Check times with tolerance (default 1 minute)
    const start1 = new Date(event1.start.dateTime).getTime();
    const start2 = new Date(event2.start.dateTime).getTime();
    if (Math.abs(start1 - start2) > tolerance.time) {
      return false;
    }

    const end1 = new Date(event1.end.dateTime).getTime();
    const end2 = new Date(event2.end.dateTime).getTime();
    if (Math.abs(end1 - end2) > tolerance.time) {
      return false;
    }

    // Check all-day flag
    if (event1.isAllDay !== event2.isAllDay) {
      return false;
    }

    // Optional content check
    if (tolerance.content) {
      const body1 = event1.body?.content || '';
      const body2 = event2.body?.content || '';
      if (body1 !== body2) {
        return false;
      }

      const loc1 = event1.location?.displayName || '';
      const loc2 = event2.location?.displayName || '';
      if (loc1 !== loc2) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get conflict statistics for a user
   */
  async getConflictStats(userId: string, timeRange?: { start: Date; end: Date }) {
    const where: any = {
      syncState: {
        userId,
      },
    };

    if (timeRange) {
      where.createdAt = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    const [total, pending, resolved] = await Promise.all([
      this.prisma.calendarSyncConflict.count({ where }),
      this.prisma.calendarSyncConflict.count({
        where: { ...where, resolution: CalendarConflictResolution.PENDING },
      }),
      this.prisma.calendarSyncConflict.count({
        where: { ...where, resolution: { not: CalendarConflictResolution.PENDING } },
      }),
    ]);

    const resolutionBreakdown = await this.prisma.calendarSyncConflict.groupBy({
      by: ['resolution'],
      where,
      _count: true,
    });

    return {
      total,
      pending,
      resolved,
      resolutionBreakdown: resolutionBreakdown.reduce((acc, item) => {
        acc[item.resolution] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
