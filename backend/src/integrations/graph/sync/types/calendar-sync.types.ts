// Calendar Sync Types and Interfaces

export interface CalendarEventData {
  subject: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  timeZone?: string;
  isAllDay?: boolean;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

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
