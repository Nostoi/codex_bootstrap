import { EnergyLevel, FocusType } from "@prisma/client";
import { TimeSlot } from "../../planning/types";
export interface GoogleCalendarEvent {
    id?: string;
    summary?: string;
    description?: string;
    start?: GoogleCalendarDateTime;
    end?: GoogleCalendarDateTime;
    attendees?: GoogleCalendarAttendee[];
    status?: "confirmed" | "tentative" | "cancelled";
    visibility?: "default" | "public" | "private" | "confidential";
    transparency?: "opaque" | "transparent";
    eventType?: "default" | "outOfOffice" | "focusTime" | "workingLocation";
    location?: string;
    organizer?: GoogleCalendarOrganizer;
    recurringEventId?: string;
    originalStartTime?: GoogleCalendarDateTime;
}
export interface GoogleCalendarDateTime {
    date?: string;
    dateTime?: string;
    timeZone?: string;
}
export interface GoogleCalendarAttendee {
    email?: string;
    displayName?: string;
    responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
    optional?: boolean;
    organizer?: boolean;
}
export interface GoogleCalendarOrganizer {
    email?: string;
    displayName?: string;
    self?: boolean;
}
export interface GoogleCalendarListResponse {
    kind: "calendar#events";
    items?: GoogleCalendarEvent[];
    nextPageToken?: string;
    nextSyncToken?: string;
}
export interface CalendarIntegration {
    getExistingCommitments(userId: string, date: Date): Promise<TimeSlot[]>;
    parseCalendarEvent(event: GoogleCalendarEvent, userTimezone?: string): TimeSlot;
    inferEnergyLevel(event: GoogleCalendarEvent): EnergyLevel;
    inferPreferredFocusTypes(event: GoogleCalendarEvent): FocusType[];
    handleApiFailure(error: CalendarError): Promise<TimeSlot[]>;
    isValidEvent(event: GoogleCalendarEvent): boolean;
}
export declare enum CalendarErrorType {
    API_UNAVAILABLE = "api_unavailable",
    AUTH_EXPIRED = "auth_expired",
    RATE_LIMITED = "rate_limited",
    NETWORK_ERROR = "network_error",
    PERMISSION_DENIED = "permission_denied",
    INVALID_EVENT_DATA = "invalid_event_data",
    QUOTA_EXCEEDED = "quota_exceeded"
}
export interface CalendarError extends Error {
    type: CalendarErrorType;
    retryable: boolean;
    retryAfter?: number;
    originalError?: any;
}
export interface CalendarErrorHandler {
    handleError(error: CalendarError): Promise<TimeSlot[]>;
    shouldRetry(error: CalendarError): boolean;
    getRetryDelay(attempt: number): number;
    createFallbackTimeSlots(): TimeSlot[];
}
export interface CalendarCache {
    userId: string;
    date: string;
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
export interface CalendarIntegrationConfig {
    enabled: boolean;
    cacheTimeToLive: number;
    maxRetries: number;
    retryBaseDelay: number;
    apiTimeout: number;
    maxEventsPerDay: number;
    bufferTimeBeforeMeeting: number;
    bufferTimeAfterMeeting: number;
    energyInferenceRules: EnergyInferenceRule[];
    focusTypeRules: FocusTypeRule[];
}
export interface EnergyInferenceRule {
    pattern: string | RegExp;
    field: "summary" | "description" | "location";
    energyLevel: EnergyLevel;
    priority: number;
}
export interface FocusTypeRule {
    pattern: string | RegExp;
    field: "summary" | "description" | "location";
    focusTypes: FocusType[];
    priority: number;
}
export interface MeetingBuffer {
    beforeMeeting: number;
    afterMeeting: number;
    applyToEventTypes: string[];
}
export interface CalendarIntegrationMetrics {
    totalEventsProcessed: number;
    successfulParses: number;
    failedParses: number;
    apiCallsSuccessful: number;
    apiCallsFailed: number;
    averageResponseTime: number;
    cacheHitRate: number;
    lastSyncTime: Date;
    errorsByType: Record<CalendarErrorType, number>;
}
export interface CalendarEventProcessingResult {
    success: boolean;
    event: GoogleCalendarEvent;
    timeSlot?: TimeSlot;
    error?: CalendarError;
    processingTime: number;
}
export interface CalendarTimeSlot extends TimeSlot {
    sourceEventId?: string;
    sourceType: "calendar" | "manual" | "system";
    calendarProvider: "google" | "outlook" | "other";
    eventSummary?: string;
    eventLocation?: string;
    attendeeCount?: number;
    isOrganizer?: boolean;
    meetingType?: "focus" | "social" | "administrative" | "technical";
    bufferBefore?: number;
    bufferAfter?: number;
}
export interface GoogleCalendarService {
    getCalendarEvents(userId: string, calendarId?: string, timeMin?: Date, timeMax?: Date): Promise<GoogleCalendarListResponse>;
    createCalendarEvent(userId: string, eventData: Partial<GoogleCalendarEvent>, calendarId?: string): Promise<GoogleCalendarEvent>;
}
export interface DailyPlannerCalendarIntegration {
    getExistingCommitments(userId: string, date: Date): Promise<TimeSlot[]>;
    getIntegrationStatus(userId: string): Promise<CalendarIntegrationStatus>;
    refreshCalendarData(userId: string, date: Date): Promise<TimeSlot[]>;
}
export interface CalendarIntegrationStatus {
    connected: boolean;
    lastSyncTime?: Date;
    errorMessage?: string;
    eventsCount?: number;
    nextSyncTime?: Date;
}
export interface MockCalendarEvent {
    summary: string;
    start: string;
    end: string;
    attendees?: number;
    type?: "meeting" | "focus" | "social" | "admin";
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
