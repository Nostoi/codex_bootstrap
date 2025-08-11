// Calendar Sync Types and Interfaces

export interface CalendarEventData {
  subject: string;
  description?: string | null; // Allow both undefined and null for Prisma compatibility
  location?: string | null; // Explicit nullable for database mapping
  startTime: Date;
  endTime: Date;
  timeZone?: string | null; // Nullable timezone handling
  isAllDay?: boolean;
  isRecurring?: boolean;
  recurrencePattern?: string | null; // JSON string can be null in database
}

// Enhanced LocalCalendarEvent interface (replaces type alias)
export interface LocalCalendarEvent extends CalendarEventData {
  id: string; // Required unique identifier
  userId?: string; // For internal operations
  graphId?: string | null; // Microsoft Graph ID (nullable for Prisma compatibility)
  createdAt?: Date;
  updatedAt?: Date;
  syncStatus?: import('@prisma/client').CalendarSyncStatus;
}

// Type-safe conversion functions for calendar event transformations
export interface CalendarEventConverters {
  convertPrismaToLocal: (prismaEvent: any) => LocalCalendarEvent;
  convertGraphToLocal: (graphEvent: GraphCalendarEvent) => LocalCalendarEvent;
  convertLocalToPrisma: (localEvent: LocalCalendarEvent) => any;
}

// Null-safe utility types for calendar operations
export type NullableString = string | null;
export type OptionalNullableString = string | null | undefined;

export interface GraphCalendarEvent {
  id: string;
  subject: string;
  body?: {
    content?: string;
    contentType?: string;
  };
  location?: {
    displayName?: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  isAllDay: boolean;
  recurrence?: any;
  '@odata.etag'?: string;
  lastModifiedDateTime?: string;
  createdDateTime?: string;

  // Microsoft Graph delta sync: '@removed' property for deleted events
  '@removed'?: {
    reason: string;
  };
}

// Discriminated union types for Microsoft Graph delta sync event state management
export interface RemovedGraphEvent {
  '@removed': {
    reason: string; // typically "deleted"
  };
  id: string;
  // Minimal required properties for removed events
  lastModifiedDateTime?: string;
  '@odata.etag'?: string;
}

export interface ActiveGraphEvent {
  '@removed'?: undefined; // explicitly undefined or omitted
  id: string;
  subject: string;
  body?: {
    content?: string;
    contentType?: string;
  };
  location?: {
    displayName?: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  isAllDay: boolean;
  recurrence?: any;
  '@odata.etag'?: string;
  lastModifiedDateTime?: string;
  createdDateTime?: string;
}

// Union type for all Microsoft Graph calendar events with type-safe discrimination
export type GraphDeltaEvent = ActiveGraphEvent | RemovedGraphEvent;

// Type guards for safe Microsoft Graph delta sync event processing
export function isRemovedEvent(event: GraphDeltaEvent): event is RemovedGraphEvent {
  return '@removed' in event && event['@removed'] !== undefined;
}

export function isActiveEvent(event: GraphDeltaEvent): event is ActiveGraphEvent {
  return !isRemovedEvent(event);
}

// Utility functions for safe '@removed' property access
export function getRemovedReason(event: GraphDeltaEvent): string | undefined {
  return isRemovedEvent(event) ? event['@removed'].reason : undefined;
}

export function isEventDeleted(event: GraphDeltaEvent): boolean {
  return isRemovedEvent(event) && event['@removed'].reason === 'deleted';
}

// Safe conversion functions for delta sync processing
export function safeParseDate(dateStr?: string | Date): Date | null {
  if (!dateStr) return null;
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

export function convertDeltaToLocal(event: GraphDeltaEvent): LocalCalendarEvent | null {
  if (isRemovedEvent(event)) {
    // Return null to exclude deleted events from local store
    return null;
  }

  // Active event conversion: map fields safely with null safety
  const startTime = safeParseDate(event.start?.dateTime);
  const endTime = safeParseDate(event.end?.dateTime);

  if (!startTime || !endTime) {
    return null; // Invalid date ranges excluded
  }

  return {
    id: event.id,
    subject: event.subject ?? 'No Subject',
    description: event.body?.content ?? null,
    location: event.location?.displayName ?? null,
    startTime,
    endTime,
    isAllDay: event.isAllDay ?? false,
    graphId: event.id,
    syncStatus: undefined, // Will be set by sync process
  };
}

export function convertDeltaToLocalBatch(events: GraphDeltaEvent[]): LocalCalendarEvent[] {
  return events
    .map(convertDeltaToLocal)
    .filter((event): event is LocalCalendarEvent => event !== null);
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  conflictCount: number;
  errorCount: number;
  errors?: string[];
  conflicts?: ConflictInfo[];
}

export interface ConflictInfo {
  eventId: string;
  conflictType: string;
  localVersion: CalendarEventData;
  remoteVersion: CalendarEventData;
  autoResolvable: boolean;
}

export interface DeltaSyncOptions {
  calendarId?: string;
  maxResults?: number;
  skipDeleted?: boolean;
}

export interface SyncStateInfo {
  userId: string;
  calendarId?: string;
  lastFullSync?: Date;
  lastDeltaSync?: Date;
  syncInProgress: boolean;
  totalEvents: number;
  syncedEvents: number;
  conflictedEvents: number;
  failedEvents: number;
}

export interface ConflictResolutionRequest {
  conflictId: string;
  resolution: 'USE_LOCAL' | 'USE_REMOTE' | 'MERGE' | 'SKIP';
  mergedData?: CalendarEventData;
  notes?: string;
}

export enum SyncDirection {
  PULL_FROM_GRAPH = 'PULL_FROM_GRAPH',
  PUSH_TO_GRAPH = 'PUSH_TO_GRAPH',
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

export enum SyncTrigger {
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED',
  WEBHOOK = 'WEBHOOK',
  USER_ACTION = 'USER_ACTION',
}

export interface SyncOptions {
  direction: SyncDirection;
  trigger: SyncTrigger;
  fullSync?: boolean;
  calendarIds?: string[];
  conflictResolution?: 'AUTO' | 'MANUAL';
}

// Microsoft Graph Delta Query Response
export interface GraphDeltaResponse {
  value: GraphCalendarEvent[];
  '@odata.deltaLink'?: string;
  '@odata.nextLink'?: string;
}

// Sync Statistics
export interface SyncStatistics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalEvents: number;
  totalConflicts: number;
  averageSyncTime: number;
  lastSyncTime?: Date;
}

// Event comparison result
export interface EventComparisonResult {
  isEqual: boolean;
  differences: string[];
  conflictType?: string;
  requiresManualResolution: boolean;
}

// Sync job definition
export interface SyncJob {
  id: string;
  userId: string;
  calendarId?: string;
  options: SyncOptions;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  startTime: Date;
  endTime?: Date;
  result?: SyncResult;
  error?: string;
}
