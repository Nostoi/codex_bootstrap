import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  ConflictInfo,
  GraphCalendarEvent,
  CalendarEventData,
  LocalCalendarEvent,
} from '../types/calendar-sync.types';
import { CalendarConflictType, CalendarConflictResolution } from '@prisma/client';

/**
 * Conflict Resolver
 * Handles calendar synchronization conflicts between local and Graph events
 */
@Injectable()
export class ConflictResolver {
  private readonly logger = new Logger(ConflictResolver.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Convert local calendar event to CalendarEventData format (null-safe)
   */
  private convertLocalEventToData(localEvent: LocalCalendarEvent): CalendarEventData {
    return {
      subject: localEvent.subject,
      description: localEvent.description ?? null,
      location: localEvent.location ?? null,
      startTime: localEvent.startTime,
      endTime: localEvent.endTime,
      timeZone: localEvent.timeZone ?? null,
      isAllDay: localEvent.isAllDay ?? false,
      isRecurring: localEvent.isRecurring ?? false,
      recurrencePattern: localEvent.recurrencePattern ?? null,
    };
  }

  /**
   * Convert Graph calendar event to CalendarEventData format (null-safe)
   */
  private convertGraphEventToData(graphEvent: GraphCalendarEvent): CalendarEventData {
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
   * Determine if conflicts can be automatically resolved
   */
  private isAutoResolvable(conflicts: CalendarConflictType[]): boolean {
    // Only simple conflicts can be auto-resolved
    const autoResolvableTypes: CalendarConflictType[] = [
      CalendarConflictType.TITLE,
      CalendarConflictType.DESCRIPTION_MISMATCH,
      CalendarConflictType.LOCATION_MISMATCH,
    ];

    return conflicts.length === 1 && autoResolvableTypes.includes(conflicts[0]);
  }

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

    try {
      // Subject/Title conflict
      if (localEvent.subject !== graphEvent.subject) {
        conflicts.push(CalendarConflictType.TITLE);
      }

      // Description/Body conflict
      const localDescription = localEvent.description || '';
      const graphDescription = graphEvent.body?.content || '';
      if (localDescription !== graphDescription) {
        conflicts.push(CalendarConflictType.DESCRIPTION_MISMATCH);
      }

      // Start time conflict
      const localStart = localEvent.startTime;
      const graphStart = new Date(graphEvent.start.dateTime);
      if (localStart.getTime() !== graphStart.getTime()) {
        conflicts.push(CalendarConflictType.START_TIME);
      }

      // End time conflict
      const localEnd = localEvent.endTime;
      const graphEnd = new Date(graphEvent.end.dateTime);
      if (localEnd.getTime() !== graphEnd.getTime()) {
        conflicts.push(CalendarConflictType.TIME_MISMATCH);
      }

      // Location conflict
      const localLocation = localEvent.location || '';
      const graphLocation = graphEvent.location?.displayName || '';
      if (localLocation !== graphLocation) {
        conflicts.push(CalendarConflictType.LOCATION_MISMATCH);
      }

      // All-day flag conflict
      if (localEvent.isAllDay !== graphEvent.isAllDay) {
        conflicts.push(CalendarConflictType.BOTH_MODIFIED);
      }

      // Recurrence conflict (simplified check)
      const localHasRecurrence = localEvent.isRecurring || false;
      const graphHasRecurrence = !!graphEvent.recurrence;
      if (localHasRecurrence !== graphHasRecurrence) {
        conflicts.push(CalendarConflictType.BOTH_MODIFIED);
      }

      if (conflicts.length === 0) {
        return null;
      }

      return {
        eventId: localEvent.id,
        conflictType: conflicts[0].toString(), // Convert enum to string
        localVersion: this.convertLocalEventToData(localEvent),
        remoteVersion: this.convertGraphEventToData(graphEvent),
        autoResolvable: this.isAutoResolvable(conflicts),
      };
    } catch (error) {
      this.logger.error('Error detecting conflicts:', error);
      return null;
    }
  }

  /**
   * Resolve conflicts and update database
   */
  async resolveConflict(
    conflictId: string,
    resolution: CalendarConflictResolution,
    resolvedEvent: CalendarEventData
  ): Promise<void> {
    try {
      const resolvedData = JSON.stringify(resolvedEvent);

      await this.prisma.calendarSyncConflict.update({
        where: { id: conflictId },
        data: {
          resolution,
          resolvedAt: new Date(),
          conflictData: resolvedData,
        },
      });

      this.logger.log(`Conflict ${conflictId} resolved with ${resolution}`);
    } catch (error) {
      this.logger.error('Error resolving conflict:', error);
      throw error;
    }
  }

  /**
   * Store conflict information in database
   */
  async storeConflict(syncStateId: string, conflict: ConflictInfo): Promise<string> {
    try {
      const conflictData = JSON.stringify({
        localVersion: conflict.localVersion,
        remoteVersion: conflict.remoteVersion,
      });

      const storedConflict = await this.prisma.calendarSyncConflict.create({
        data: {
          conflictType: conflict.conflictType as CalendarConflictType,
          description: 'Calendar sync conflict detected',
          localData: conflict.localVersion as any,
          remoteData: conflict.remoteVersion as any,
          localVersion: JSON.stringify(conflict.localVersion),
          remoteVersion: JSON.stringify(conflict.remoteVersion),
          autoResolved: false,
          event: {
            connect: { id: conflict.eventId },
          },
        },
      });

      return storedConflict.id;
    } catch (error) {
      this.logger.error('Error storing conflict:', error);
      throw error;
    }
  }

  /**
   * Get all pending conflicts for a sync state
   */
  async getPendingConflicts(syncStateId: string) {
    return this.prisma.calendarSyncConflict.findMany({
      where: {
        syncStateId,
        resolution: CalendarConflictResolution.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
