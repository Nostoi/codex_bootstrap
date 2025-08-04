/**
 * TypeScript interface definitions for Google Calendar integration
 * These interfaces define the contracts between DailyPlannerService and GoogleService
 */

import { EnergyLevel, FocusType } from '@prisma/client';

// TimeSlot interface for calendar integration
export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  energyLevel: EnergyLevel;
  preferredFocusTypes: FocusType[];
  isAvailable: boolean;
  source?: 'google' | 'outlook' | 'manual';
  eventId?: string;
  title?: string;
  description?: string;
  isAllDay?: boolean;
}

// Google Calendar API response types
export interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  start?: GoogleCalendarDateTime;
  end?: GoogleCalendarDateTime;
  attendees?: GoogleCalendarAttendee[];
  status?: 'confirmed' | 'tentative' | 'cancelled';
  visibility?: 'default' | 'public' | 'private' | 'confidential';
  transparency?: 'opaque' | 'transparent';
  eventType?: 'default' | 'outOfOffice' | 'focusTime' | 'workingLocation';
  location?: string;
  organizer?: GoogleCalendarOrganizer;
  recurringEventId?: string;
  originalStartTime?: GoogleCalendarDateTime;
}

export interface GoogleCalendarDateTime {
  date?: string; // For all-day events (YYYY-MM-DD)
  dateTime?: string; // For timed events (RFC3339 timestamp)
  timeZone?: string;
}

export interface GoogleCalendarAttendee {
  email?: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
  organizer?: boolean;
}

export interface GoogleCalendarOrganizer {
  email?: string;
  displayName?: string;
  self?: boolean;
}

export interface GoogleCalendarListResponse {
  kind: 'calendar#events';
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

// Calendar integration interfaces
export interface CalendarIntegration {
  /**
   * Fetch existing calendar commitments for a specific date
   */
  getExistingCommitments(userId: string, date: Date): Promise<TimeSlot[]>;

  /**
   * Parse a Google Calendar event into a TimeSlot
   */
  parseCalendarEvent(event: GoogleCalendarEvent, userTimezone?: string): TimeSlot;

  /**
   * Infer energy level required for a calendar event
   */
  inferEnergyLevel(event: GoogleCalendarEvent): EnergyLevel;

  /**
   * Determine preferred focus types for a calendar event
   */
  inferPreferredFocusTypes(event: GoogleCalendarEvent): FocusType[];

  /**
   * Handle calendar API failures with appropriate fallback
   */
  handleApiFailure(error: CalendarError): Promise<TimeSlot[]>;

  /**
   * Validate if a calendar event should be included in planning
   */
  isValidEvent(event: GoogleCalendarEvent): boolean;
}

// Error handling types
export enum CalendarErrorType {
  API_UNAVAILABLE = 'api_unavailable',
  AUTH_EXPIRED = 'auth_expired',
  RATE_LIMITED = 'rate_limited',
  NETWORK_ERROR = 'network_error',
  PERMISSION_DENIED = 'permission_denied',
  INVALID_EVENT_DATA = 'invalid_event_data',
  QUOTA_EXCEEDED = 'quota_exceeded',
}

export interface CalendarError extends Error {
  type: CalendarErrorType;
  retryable: boolean;
  retryAfter?: number; // Seconds to wait before retry
  originalError?: any;
}

export interface CalendarErrorHandler {
  handleError(error: CalendarError): Promise<TimeSlot[]>;
  shouldRetry(error: CalendarError): boolean;
  getRetryDelay(attempt: number): number;
  createFallbackTimeSlots(): TimeSlot[];
}

// Cache interface
export interface CalendarCache {
  userId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  events: TimeSlot[];
  fetchedAt: Date;
  expiresAt: Date;
}

export interface CalendarCacheManager {
  get(userId: string, date: Date): CalendarCache | null;
  set(userId: string, date: Date, events: TimeSlot[]): void;
  invalidate(userId: string, date?: Date): void;
  cleanup(): void;
}

// Configuration interfaces
export interface CalendarIntegrationConfig {
  enabled: boolean;
  cacheTimeToLive: number; // milliseconds
  maxRetries: number;
  retryBaseDelay: number; // milliseconds
  apiTimeout: number; // milliseconds
  maxEventsPerDay: number;
  bufferTimeBeforeMeeting: number; // minutes
  bufferTimeAfterMeeting: number; // minutes
  energyInferenceRules: EnergyInferenceRule[];
  focusTypeRules: FocusTypeRule[];
}

export interface EnergyInferenceRule {
  pattern: string | RegExp;
  field: 'summary' | 'description' | 'location';
  energyLevel: EnergyLevel;
  priority: number; // Higher priority rules override lower priority
}

export interface FocusTypeRule {
  pattern: string | RegExp;
  field: 'summary' | 'description' | 'location';
  focusTypes: FocusType[];
  priority: number;
}

// Meeting buffer configuration
export interface MeetingBuffer {
  beforeMeeting: number; // minutes
  afterMeeting: number; // minutes
  applyToEventTypes: string[]; // Event types to apply buffer to
}

// Analytics and metrics interfaces
export interface CalendarIntegrationMetrics {
  totalEventsProcessed: number;
  successfulParses: number;
  failedParses: number;
  apiCallsSuccessful: number;
  apiCallsFailed: number;
  averageResponseTime: number; // milliseconds
  cacheHitRate: number; // percentage
  lastSyncTime: Date;
  errorsByType: Record<CalendarErrorType, number>;
}

export interface CalendarEventProcessingResult {
  success: boolean;
  event: GoogleCalendarEvent;
  timeSlot?: TimeSlot;
  error?: CalendarError;
  processingTime: number; // milliseconds
}

// Extended TimeSlot for calendar integration
export interface CalendarTimeSlot extends TimeSlot {
  sourceEventId?: string;
  sourceType: 'calendar' | 'manual' | 'system';
  calendarProvider: 'google' | 'outlook' | 'other';
  eventSummary?: string;
  eventLocation?: string;
  attendeeCount?: number;
  isOrganizer?: boolean;
  meetingType?: 'focus' | 'social' | 'administrative' | 'technical';
  bufferBefore?: number; // minutes
  bufferAfter?: number; // minutes
}

// Service method signatures for dependency injection
export interface GoogleCalendarService {
  getCalendarEvents(
    userId: string,
    calendarId?: string,
    timeMin?: Date,
    timeMax?: Date
  ): Promise<GoogleCalendarListResponse>;

  createCalendarEvent(
    userId: string,
    eventData: Partial<GoogleCalendarEvent>,
    calendarId?: string
  ): Promise<GoogleCalendarEvent>;
}

// Daily planner integration points
export interface DailyPlannerCalendarIntegration {
  /**
   * Main method called by DailyPlannerService to get calendar commitments
   */
  getExistingCommitments(userId: string, date: Date): Promise<TimeSlot[]>;

  /**
   * Get calendar integration status for user feedback
   */
  getIntegrationStatus(userId: string): Promise<CalendarIntegrationStatus>;

  /**
   * Force refresh calendar data (bypass cache)
   */
  refreshCalendarData(userId: string, date: Date): Promise<TimeSlot[]>;
}

export interface CalendarIntegrationStatus {
  connected: boolean;
  lastSyncTime?: Date;
  errorMessage?: string;
  eventsCount?: number;
  nextSyncTime?: Date;
}

// Testing interfaces
export interface MockCalendarEvent {
  summary: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  attendees?: number;
  type?: 'meeting' | 'focus' | 'social' | 'admin';
  location?: string;
}

export interface CalendarTestScenario {
  name: string;
  description: string;
  mockEvents: MockCalendarEvent[];
  expectedTimeSlots: number;
  expectedEnergyLevels: EnergyLevel[];
  expectedFocusTypes: FocusType[][];
}
