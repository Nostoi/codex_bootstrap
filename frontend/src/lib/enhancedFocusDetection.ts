import React from 'react';
import { CalendarEvent } from '../hooks/useApi';

export interface FocusSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  activityType: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL' | 'BREAK';
  energyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  source: 'manual' | 'calendar' | 'automatic';
  calendarEvent?: CalendarEvent;
  interruptions: number;
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface FocusDetectionOptions {
  enableCalendarIntegration: boolean;
  enableAutomaticDetection: boolean;
  minimumFocusMinutes: number;
  breakDurationMinutes: number;
  hyperfocusThresholdMinutes: number;
}

/**
 * Enhanced Focus Detection Service
 *
 * Integrates with calendar events and provides intelligent focus session detection
 * for ADHD-optimized notification management.
 */
export class EnhancedFocusDetection {
  private currentSession: FocusSession | null = null;
  private sessions: FocusSession[] = [];
  private options: FocusDetectionOptions;
  private lastActivityTime: Date = new Date();
  private calendarEvents: CalendarEvent[] = [];
  private listeners: Set<(session: FocusSession | null) => void> = new Set();

  constructor(options: Partial<FocusDetectionOptions> = {}) {
    this.options = {
      enableCalendarIntegration: true,
      enableAutomaticDetection: true,
      minimumFocusMinutes: 15,
      breakDurationMinutes: 5,
      hyperfocusThresholdMinutes: 90,
      ...options,
    };

    this.initializeActivityDetection();
  }

  /**
   * Start a manual focus session
   */
  startFocusSession(
    activityType: FocusSession['activityType'],
    energyLevel: FocusSession['energyLevel'],
    calendarEvent?: CalendarEvent
  ): FocusSession {
    this.endCurrentSession();

    const session: FocusSession = {
      id: this.generateSessionId(),
      startTime: new Date(),
      activityType,
      energyLevel,
      source: calendarEvent ? 'calendar' : 'manual',
      calendarEvent,
      interruptions: 0,
    };

    this.currentSession = session;
    this.notifyListeners();

    return session;
  }

  /**
   * End the current focus session
   */
  endCurrentSession(quality?: FocusSession['quality']): FocusSession | null {
    if (!this.currentSession) return null;

    const session = {
      ...this.currentSession,
      endTime: new Date(),
      quality: quality || this.calculateSessionQuality(this.currentSession),
    };

    this.sessions.push(session);
    this.currentSession = null;
    this.notifyListeners();

    return session;
  }

  /**
   * Update calendar events for focus detection
   */
  updateCalendarEvents(events: CalendarEvent[]): void {
    this.calendarEvents = events;

    if (this.options.enableCalendarIntegration) {
      this.detectCalendarBasedFocus();
    }
  }

  /**
   * Detect focus sessions based on calendar events
   */
  private detectCalendarBasedFocus(): void {
    const now = new Date();
    const currentEvent = this.calendarEvents.find(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return start <= now && now <= end;
    });

    if (currentEvent && !this.currentSession) {
      // Start automatic session from calendar event
      const activityType = this.mapFocusTypeToActivity(currentEvent.focusType);
      const energyLevel = currentEvent.energyLevel || 'MEDIUM';

      this.startAutomaticSession(activityType, energyLevel, currentEvent);
    } else if (!currentEvent && this.currentSession?.source === 'calendar') {
      // End calendar-based session
      this.endCurrentSession();
    }
  }

  /**
   * Start an automatic focus session
   */
  private startAutomaticSession(
    activityType: FocusSession['activityType'],
    energyLevel: FocusSession['energyLevel'],
    calendarEvent?: CalendarEvent
  ): void {
    const session: FocusSession = {
      id: this.generateSessionId(),
      startTime: new Date(),
      activityType,
      energyLevel,
      source: calendarEvent ? 'calendar' : 'automatic',
      calendarEvent,
      interruptions: 0,
    };

    this.currentSession = session;
    this.notifyListeners();
  }

  /**
   * Record an interruption in the current session
   */
  recordInterruption(): void {
    if (this.currentSession) {
      this.currentSession.interruptions++;
    }
  }

  /**
   * Get current focus session
   */
  getCurrentSession(): FocusSession | null {
    return this.currentSession;
  }

  /**
   * Get session history
   */
  getSessionHistory(limit?: number): FocusSession[] {
    const sessions = [...this.sessions].reverse();
    return limit ? sessions.slice(0, limit) : sessions;
  }

  /**
   * Check if currently in hyperfocus
   */
  isInHyperfocus(): boolean {
    if (!this.currentSession) return false;

    const sessionDuration = new Date().getTime() - this.currentSession.startTime.getTime();
    const durationMinutes = sessionDuration / (1000 * 60);

    return durationMinutes >= this.options.hyperfocusThresholdMinutes;
  }

  /**
   * Get ADHD-optimized focus insights
   */
  getFocusInsights(): {
    currentStreak: number;
    averageSessionLength: number;
    bestFocusTime: string;
    hyperfocusRisk: boolean;
    recommendedBreak: boolean;
  } {
    const recentSessions = this.getSessionHistory(10);

    const averageLength =
      recentSessions.length > 0
        ? recentSessions.reduce((acc, session) => {
            if (!session.endTime) return acc;
            const duration = session.endTime.getTime() - session.startTime.getTime();
            return acc + duration / (1000 * 60);
          }, 0) / recentSessions.length
        : 0;

    const currentStreak = this.calculateCurrentStreak();
    const bestFocusTime = this.determineBestFocusTime();
    const hyperfocusRisk = this.isInHyperfocus();

    const recommendedBreak = this.currentSession
      ? new Date().getTime() - this.currentSession.startTime.getTime() >
        this.options.hyperfocusThresholdMinutes * 60 * 1000
      : false;

    return {
      currentStreak,
      averageSessionLength: averageLength,
      bestFocusTime,
      hyperfocusRisk,
      recommendedBreak,
    };
  }

  /**
   * Subscribe to focus session changes
   */
  subscribe(listener: (session: FocusSession | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Initialize activity detection for automatic focus sessions
   */
  private initializeActivityDetection(): void {
    if (!this.options.enableAutomaticDetection) return;

    // Detect user activity patterns
    const events = ['keydown', 'mousemove', 'click', 'scroll'];

    const updateActivity = () => {
      this.lastActivityTime = new Date();
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check for focus sessions every minute
    setInterval(() => {
      this.checkForAutomaticSessions();
    }, 60000);
  }

  /**
   * Check for automatic focus session detection
   */
  private checkForAutomaticSessions(): void {
    const now = new Date();
    const inactiveMinutes = (now.getTime() - this.lastActivityTime.getTime()) / (1000 * 60);

    // Detect if user has been consistently active (potential focus session)
    if (inactiveMinutes < 2 && !this.currentSession) {
      // Check if this could be a focus session
      const timeOfDay = this.getTimeOfDay();
      const energyLevel = this.inferEnergyLevel(timeOfDay);

      if (this.shouldStartAutomaticSession()) {
        this.startAutomaticSession('TECHNICAL', energyLevel);
      }
    }

    // Auto-end sessions after prolonged inactivity
    if (
      inactiveMinutes > this.options.breakDurationMinutes &&
      this.currentSession?.source === 'automatic'
    ) {
      this.endCurrentSession();
    }
  }

  /**
   * Calculate session quality based on interruptions and duration
   */
  private calculateSessionQuality(session: FocusSession): FocusSession['quality'] {
    if (!session.endTime) return 'fair';

    const durationMinutes = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60);
    const interruptionRate = session.interruptions / Math.max(1, durationMinutes / 15); // Per 15-minute block

    if (durationMinutes < this.options.minimumFocusMinutes) return 'poor';
    if (interruptionRate > 3) return 'poor';
    if (interruptionRate > 1.5) return 'fair';
    if (durationMinutes > 60 && interruptionRate < 0.5) return 'excellent';
    return 'good';
  }

  /**
   * Map calendar focus type to activity type
   */
  private mapFocusTypeToActivity(focusType?: string): FocusSession['activityType'] {
    switch (focusType) {
      case 'CREATIVE':
        return 'CREATIVE';
      case 'TECHNICAL':
        return 'TECHNICAL';
      case 'ADMINISTRATIVE':
        return 'ADMINISTRATIVE';
      case 'SOCIAL':
        return 'SOCIAL';
      default:
        return 'TECHNICAL';
    }
  }

  /**
   * Determine if automatic session should start
   */
  private shouldStartAutomaticSession(): boolean {
    // Don't start if recently ended a session
    const lastSession = this.sessions[this.sessions.length - 1];
    if (lastSession && lastSession.endTime) {
      const timeSinceLastSession = new Date().getTime() - lastSession.endTime.getTime();
      if (timeSinceLastSession < this.options.breakDurationMinutes * 60 * 1000) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate current productivity streak
   */
  private calculateCurrentStreak(): number {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = this.sessions.length - 1; i >= 0; i--) {
      const session = this.sessions[i];
      if (session.startTime >= today && session.quality && session.quality !== 'poor') {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Determine best focus time based on session history
   */
  private determineBestFocusTime(): string {
    const hourCounts = new Array(24).fill(0);

    this.sessions.forEach(session => {
      if (session.quality === 'good' || session.quality === 'excellent') {
        const hour = session.startTime.getHours();
        hourCounts[hour]++;
      }
    });

    const bestHour = hourCounts.indexOf(Math.max(...hourCounts));
    return `${bestHour}:00`;
  }

  /**
   * Infer energy level based on time of day
   */
  private inferEnergyLevel(timeOfDay: string): FocusSession['energyLevel'] {
    const hour = new Date().getHours();

    // Typical ADHD energy patterns
    if ((hour >= 9 && hour <= 11) || (hour >= 20 && hour <= 22)) {
      return 'HIGH';
    } else if (hour >= 14 && hour <= 16) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Get current time of day
   */
  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `focus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify all listeners of session changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentSession));
  }
}

// Singleton instance for global use
export const enhancedFocusDetection = new EnhancedFocusDetection();

// React hook for easy integration
export function useEnhancedFocusDetection() {
  const [currentSession, setCurrentSession] = React.useState<FocusSession | null>(null);

  React.useEffect(() => {
    const unsubscribe = enhancedFocusDetection.subscribe(setCurrentSession);
    setCurrentSession(enhancedFocusDetection.getCurrentSession());
    return unsubscribe;
  }, []);

  const startSession = (
    activityType: FocusSession['activityType'],
    energyLevel: FocusSession['energyLevel'],
    calendarEvent?: CalendarEvent
  ) => {
    return enhancedFocusDetection.startFocusSession(activityType, energyLevel, calendarEvent);
  };

  const endSession = (quality?: FocusSession['quality']) => {
    return enhancedFocusDetection.endCurrentSession(quality);
  };

  const updateCalendarEvents = (events: CalendarEvent[]) => {
    enhancedFocusDetection.updateCalendarEvents(events);
  };

  const recordInterruption = () => {
    enhancedFocusDetection.recordInterruption();
  };

  const getInsights = () => {
    return enhancedFocusDetection.getFocusInsights();
  };

  const getHistory = (limit?: number) => {
    return enhancedFocusDetection.getSessionHistory(limit);
  };

  const isInHyperfocus = () => {
    return enhancedFocusDetection.isInHyperfocus();
  };

  return {
    currentSession,
    startSession,
    endSession,
    updateCalendarEvents,
    recordInterruption,
    getInsights,
    getHistory,
    isInHyperfocus,
  };
}
