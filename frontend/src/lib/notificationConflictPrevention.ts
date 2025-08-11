import React from 'react';
import { CalendarEvent } from '../hooks/useApi';
import { FocusSession } from './enhancedFocusDetection';

export interface NotificationConflict {
  id: string;
  type: 'calendar_event' | 'focus_session' | 'energy_mismatch' | 'hyperfocus_protection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  conflictTime: Date;
  description: string;
  recommendation: string;
  autoResolve?: boolean;
}

export interface ConflictResolution {
  delay: number; // milliseconds
  alternative: 'defer' | 'reschedule' | 'suppress' | 'batch';
  reason: string;
}

export interface ConflictPreventionOptions {
  enableCalendarConflictDetection: boolean;
  enableFocusSessionProtection: boolean;
  enableEnergyMismatchPrevention: boolean;
  enableHyperfocusProtection: boolean;
  bufferMinutes: number;
  maxDeferralHours: number;
  batchingIntervalMinutes: number;
}

/**
 * Notification Conflict Prevention System
 *
 * Prevents notifications from interrupting important activities like calendar events,
 * focus sessions, and protects hyperfocus states while respecting energy levels.
 */
export class NotificationConflictPrevention {
  private conflicts: NotificationConflict[] = [];
  private options: ConflictPreventionOptions;
  private calendarEvents: CalendarEvent[] = [];
  private currentFocusSession: FocusSession | null = null;
  private listeners: Set<(conflicts: NotificationConflict[]) => void> = new Set();

  constructor(options: Partial<ConflictPreventionOptions> = {}) {
    this.options = {
      enableCalendarConflictDetection: true,
      enableFocusSessionProtection: true,
      enableEnergyMismatchPrevention: true,
      enableHyperfocusProtection: true,
      bufferMinutes: 5,
      maxDeferralHours: 4,
      batchingIntervalMinutes: 30,
      ...options,
    };
  }

  /**
   * Check if a notification should be delivered or deferred
   */
  checkNotificationConflict(
    scheduledTime: Date,
    energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): ConflictResolution | null {
    const conflicts = this.detectConflicts(scheduledTime, energyLevel, priority);

    if (conflicts.length === 0) {
      return null; // No conflicts, deliver immediately
    }

    // Sort conflicts by severity
    conflicts.sort(
      (a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity)
    );
    const primaryConflict = conflicts[0];

    // Add to conflicts list for tracking
    this.conflicts = [...this.conflicts.filter(c => c.id !== primaryConflict.id), primaryConflict];
    this.notifyListeners();

    return this.calculateResolution(primaryConflict, priority);
  }

  /**
   * Update calendar events for conflict detection
   */
  updateCalendarEvents(events: CalendarEvent[]): void {
    this.calendarEvents = events;
    this.reevaluateConflicts();
  }

  /**
   * Update current focus session for conflict detection
   */
  updateFocusSession(session: FocusSession | null): void {
    this.currentFocusSession = session;
    this.reevaluateConflicts();
  }

  /**
   * Get all current conflicts
   */
  getCurrentConflicts(): NotificationConflict[] {
    return [...this.conflicts];
  }

  /**
   * Resolve a conflict manually
   */
  resolveConflict(conflictId: string, resolution: 'accept' | 'defer' | 'suppress'): void {
    this.conflicts = this.conflicts.filter(c => c.id !== conflictId);
    this.notifyListeners();
  }

  /**
   * Get recommended notification delivery time avoiding conflicts
   */
  getOptimalDeliveryTime(
    currentTime: Date,
    energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH',
    maxDelay: number = this.options.maxDeferralHours * 60 * 60 * 1000
  ): Date {
    const maxTime = new Date(currentTime.getTime() + maxDelay);
    let testTime = new Date(currentTime);

    // Try every 15 minutes until we find a clear slot
    while (testTime <= maxTime) {
      const conflict = this.checkNotificationConflict(testTime, energyLevel, 'medium');

      if (!conflict) {
        return testTime;
      }

      // Skip ahead based on conflict type
      const skipMinutes = this.getConflictSkipDuration(conflict);
      testTime = new Date(testTime.getTime() + skipMinutes * 60 * 1000);
    }

    // If no optimal time found, return original time with warning
    console.warn('No optimal delivery time found within maximum delay');
    return currentTime;
  }

  /**
   * Subscribe to conflict updates
   */
  subscribe(listener: (conflicts: NotificationConflict[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Detect all potential conflicts for a notification time
   */
  private detectConflicts(
    scheduledTime: Date,
    energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): NotificationConflict[] {
    const conflicts: NotificationConflict[] = [];

    // Calendar event conflicts
    if (this.options.enableCalendarConflictDetection) {
      const calendarConflict = this.detectCalendarConflict(scheduledTime);
      if (calendarConflict) conflicts.push(calendarConflict);
    }

    // Focus session conflicts
    if (this.options.enableFocusSessionProtection) {
      const focusConflict = this.detectFocusSessionConflict(scheduledTime);
      if (focusConflict) conflicts.push(focusConflict);
    }

    // Energy level mismatches
    if (this.options.enableEnergyMismatchPrevention && energyLevel) {
      const energyConflict = this.detectEnergyMismatch(scheduledTime, energyLevel);
      if (energyConflict) conflicts.push(energyConflict);
    }

    // Hyperfocus protection
    if (this.options.enableHyperfocusProtection) {
      const hyperfocusConflict = this.detectHyperfocusConflict(scheduledTime, priority);
      if (hyperfocusConflict) conflicts.push(hyperfocusConflict);
    }

    return conflicts;
  }

  /**
   * Detect calendar event conflicts
   */
  private detectCalendarConflict(scheduledTime: Date): NotificationConflict | null {
    const bufferMs = this.options.bufferMinutes * 60 * 1000;

    const conflictingEvent = this.calendarEvents.find(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const bufferedStart = new Date(start.getTime() - bufferMs);
      const bufferedEnd = new Date(end.getTime() + bufferMs);

      return scheduledTime >= bufferedStart && scheduledTime <= bufferedEnd;
    });

    if (!conflictingEvent) return null;

    return {
      id: `calendar-${conflictingEvent.id}-${scheduledTime.getTime()}`,
      type: 'calendar_event',
      severity: this.getCalendarEventSeverity(conflictingEvent),
      conflictTime: scheduledTime,
      description: `Conflicts with calendar event: ${conflictingEvent.title}`,
      recommendation: `Defer until after event ends at ${new Date(conflictingEvent.endTime).toLocaleTimeString()}`,
      autoResolve: true,
    };
  }

  /**
   * Detect focus session conflicts
   */
  private detectFocusSessionConflict(scheduledTime: Date): NotificationConflict | null {
    if (!this.currentFocusSession) return null;

    const sessionStart = this.currentFocusSession.startTime;
    const now = new Date();
    const sessionDuration = now.getTime() - sessionStart.getTime();
    const bufferMs = this.options.bufferMinutes * 60 * 1000;

    // Only protect if session is active and recent
    if (sessionDuration > 4 * 60 * 60 * 1000) return null; // Max 4 hours

    const severity = this.getFocusSessionSeverity(this.currentFocusSession, sessionDuration);

    return {
      id: `focus-${this.currentFocusSession.id}-${scheduledTime.getTime()}`,
      type: 'focus_session',
      severity,
      conflictTime: scheduledTime,
      description: `Would interrupt ${this.currentFocusSession.activityType} focus session`,
      recommendation: `Defer to respect current focus session (${Math.floor(sessionDuration / 60000)} minutes active)`,
      autoResolve: severity !== 'critical',
    };
  }

  /**
   * Detect energy level mismatches
   */
  private detectEnergyMismatch(
    scheduledTime: Date,
    requiredEnergyLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  ): NotificationConflict | null {
    const currentEnergyLevel = this.inferCurrentEnergyLevel(scheduledTime);

    // Only flag if notification requires more energy than available
    const energyLevels = { LOW: 1, MEDIUM: 2, HIGH: 3 };

    if (energyLevels[requiredEnergyLevel] <= energyLevels[currentEnergyLevel]) {
      return null;
    }

    return {
      id: `energy-${scheduledTime.getTime()}`,
      type: 'energy_mismatch',
      severity: 'medium',
      conflictTime: scheduledTime,
      description: `Notification requires ${requiredEnergyLevel} energy but current level is ${currentEnergyLevel}`,
      recommendation: `Defer to a time when energy level matches requirement`,
      autoResolve: true,
    };
  }

  /**
   * Detect hyperfocus protection needs
   */
  private detectHyperfocusConflict(
    scheduledTime: Date,
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): NotificationConflict | null {
    if (!this.currentFocusSession) return null;

    const sessionDuration = scheduledTime.getTime() - this.currentFocusSession.startTime.getTime();
    const hyperfocusThreshold = 90 * 60 * 1000; // 90 minutes

    if (sessionDuration < hyperfocusThreshold || priority === 'urgent') {
      return null;
    }

    return {
      id: `hyperfocus-${this.currentFocusSession.id}-${scheduledTime.getTime()}`,
      type: 'hyperfocus_protection',
      severity: 'high',
      conflictTime: scheduledTime,
      description: 'User appears to be in hyperfocus state',
      recommendation: 'Protect hyperfocus flow - defer non-urgent notifications',
      autoResolve: false, // Require manual decision
    };
  }

  /**
   * Calculate appropriate resolution for a conflict
   */
  private calculateResolution(
    conflict: NotificationConflict,
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): ConflictResolution {
    // Urgent notifications override most conflicts
    if (priority === 'urgent' && conflict.severity !== 'critical') {
      return {
        delay: 0,
        alternative: 'defer',
        reason: 'Urgent notification overrides conflict',
      };
    }

    switch (conflict.type) {
      case 'calendar_event':
        return {
          delay: this.getCalendarDeferralTime(conflict),
          alternative: 'reschedule',
          reason: 'Rescheduled to avoid calendar conflict',
        };

      case 'focus_session':
        return {
          delay: this.options.batchingIntervalMinutes * 60 * 1000,
          alternative: 'batch',
          reason: 'Batched to protect focus session',
        };

      case 'energy_mismatch':
        return {
          delay: this.getEnergyMatchingDelay(),
          alternative: 'defer',
          reason: 'Deferred to match energy requirements',
        };

      case 'hyperfocus_protection':
        return {
          delay: 2 * 60 * 60 * 1000, // 2 hours
          alternative: 'defer',
          reason: 'Protected hyperfocus state',
        };

      default:
        return {
          delay: 15 * 60 * 1000, // 15 minutes
          alternative: 'defer',
          reason: 'General conflict avoidance',
        };
    }
  }

  /**
   * Get severity weight for sorting
   */
  private getSeverityWeight(severity: NotificationConflict['severity']): number {
    const weights = { low: 1, medium: 2, high: 3, critical: 4 };
    return weights[severity];
  }

  /**
   * Get calendar event severity based on event type
   */
  private getCalendarEventSeverity(event: CalendarEvent): NotificationConflict['severity'] {
    // Check for meeting keywords
    const meetingKeywords = ['meeting', 'call', 'interview', 'presentation', 'demo'];
    const title = event.title.toLowerCase();

    if (meetingKeywords.some(keyword => title.includes(keyword))) {
      return 'high';
    }

    if (event.energyLevel === 'HIGH') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get focus session severity based on duration and type
   */
  private getFocusSessionSeverity(
    session: FocusSession,
    duration: number
  ): NotificationConflict['severity'] {
    const durationMinutes = duration / (1000 * 60);

    // High-value activities get stronger protection
    if (session.activityType === 'CREATIVE' || session.activityType === 'TECHNICAL') {
      if (durationMinutes > 90) return 'critical'; // Hyperfocus protection
      if (durationMinutes > 30) return 'high';
      return 'medium';
    }

    if (durationMinutes > 60) return 'medium';
    return 'low';
  }

  /**
   * Infer current energy level based on time and patterns
   */
  private inferCurrentEnergyLevel(time: Date): 'LOW' | 'MEDIUM' | 'HIGH' {
    const hour = time.getHours();

    // Typical ADHD energy patterns
    if ((hour >= 9 && hour <= 11) || (hour >= 20 && hour <= 22)) {
      return 'HIGH';
    } else if ((hour >= 14 && hour <= 16) || (hour >= 18 && hour <= 19)) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Get deferral time for calendar conflicts
   */
  private getCalendarDeferralTime(conflict: NotificationConflict): number {
    // Extract end time from recommendation
    const recommendation = conflict.recommendation;
    const timeMatch = recommendation.match(/(\d{1,2}:\d{2})/);

    if (timeMatch) {
      const endTime = new Date();
      const [hours, minutes] = timeMatch[1].split(':');
      endTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const bufferMs = this.options.bufferMinutes * 60 * 1000;
      return Math.max(0, endTime.getTime() + bufferMs - conflict.conflictTime.getTime());
    }

    return 30 * 60 * 1000; // Default 30 minutes
  }

  /**
   * Get delay for energy level matching
   */
  private getEnergyMatchingDelay(): number {
    // Wait for next energy peak (typically 2-4 hours)
    return 2 * 60 * 60 * 1000;
  }

  /**
   * Get skip duration based on conflict type
   */
  private getConflictSkipDuration(conflict: ConflictResolution): number {
    switch (conflict.alternative) {
      case 'defer':
        return 30; // 30 minutes
      case 'reschedule':
        return 60; // 1 hour
      case 'batch':
        return 15; // 15 minutes
      case 'suppress':
        return 120; // 2 hours
      default:
        return 30;
    }
  }

  /**
   * Re-evaluate all conflicts when context changes
   */
  private reevaluateConflicts(): void {
    // Remove resolved conflicts
    const now = new Date();
    this.conflicts = this.conflicts.filter(conflict => {
      return conflict.conflictTime > now;
    });

    this.notifyListeners();
  }

  /**
   * Notify all listeners of conflict changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.conflicts));
  }
}

// Singleton instance for global use
export const notificationConflictPrevention = new NotificationConflictPrevention();

// React hook for conflict management
export function useNotificationConflictPrevention() {
  const [conflicts, setConflicts] = React.useState<NotificationConflict[]>([]);

  React.useEffect(() => {
    const unsubscribe = notificationConflictPrevention.subscribe(setConflicts);
    setConflicts(notificationConflictPrevention.getCurrentConflicts());
    return unsubscribe;
  }, []);

  const checkConflict = (
    scheduledTime: Date,
    energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH',
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ) => {
    return notificationConflictPrevention.checkNotificationConflict(
      scheduledTime,
      energyLevel,
      priority
    );
  };

  const getOptimalTime = (
    currentTime: Date,
    energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH',
    maxDelay?: number
  ) => {
    return notificationConflictPrevention.getOptimalDeliveryTime(
      currentTime,
      energyLevel,
      maxDelay
    );
  };

  const resolveConflict = (conflictId: string, resolution: 'accept' | 'defer' | 'suppress') => {
    notificationConflictPrevention.resolveConflict(conflictId, resolution);
  };

  const updateCalendarEvents = (events: CalendarEvent[]) => {
    notificationConflictPrevention.updateCalendarEvents(events);
  };

  const updateFocusSession = (session: FocusSession | null) => {
    notificationConflictPrevention.updateFocusSession(session);
  };

  return {
    conflicts,
    checkConflict,
    getOptimalTime,
    resolveConflict,
    updateCalendarEvents,
    updateFocusSession,
  };
}
