import {
  CalendarSyncStatus,
  CalendarConflictType,
  CalendarConflictResolution,
  SyncDirection,
} from '@prisma/client';

/**
 * Test data factory for calendar sync integration tests
 * Provides consistent data structures that match current Prisma schema
 */

export interface TestCalendarEventData {
  graphId: string;
  subject: string;
  start: Date;
  end: Date;
  rawData: any;
  lastModified: Date;
  attendees: any[];
  categories: string[];
  userId?: string;
  body?: string;
  location?: string;
  isAllDay?: boolean;
}

export interface TestSyncStateData {
  userId: string;
  calendarId: string;
  status: CalendarSyncStatus;
  direction: SyncDirection;
  totalEvents?: number;
  processedEvents?: number;
  syncedEvents?: number;
  conflictedEvents?: number;
  failedEvents?: number;
  conflictCount?: number;
}

export interface TestSyncConflictData {
  eventId: string;
  conflictType: CalendarConflictType;
  description: string;
  localData: any;
  remoteData: any;
  resolution?: CalendarConflictResolution;
  syncStateId?: string;
  calendarEventId?: string;
  localVersion?: string;
  remoteVersion?: string;
  conflictData?: any;
  autoResolvable?: boolean;
}

export class CalendarSyncTestDataFactory {
  /**
   * Creates test calendar event data with all required fields
   */
  static createCalendarEventData(
    overrides: Partial<TestCalendarEventData> = {}
  ): TestCalendarEventData {
    return {
      graphId: 'test-graph-id-' + Math.random().toString(36).substr(2, 9),
      subject: 'Test Event',
      start: new Date('2025-01-01T10:00:00Z'),
      end: new Date('2025-01-01T11:00:00Z'),
      rawData: {
        id: 'graph-event-123',
        subject: 'Test Event',
        '@odata.etag': 'W/"test-etag"',
      },
      lastModified: new Date('2025-01-01T09:00:00Z'),
      attendees: [],
      categories: [],
      body: 'Test event description',
      location: 'Test Location',
      isAllDay: false,
      ...overrides,
    };
  }

  /**
   * Creates test sync state data with valid enum values
   */
  static createSyncStateData(overrides: Partial<TestSyncStateData> = {}): TestSyncStateData {
    return {
      userId: 'test-user-123', // Default, should be overridden in tests
      calendarId: 'default',
      status: CalendarSyncStatus.PENDING,
      direction: SyncDirection.BIDIRECTIONAL,
      totalEvents: 0,
      processedEvents: 0,
      syncedEvents: 0,
      conflictedEvents: 0,
      failedEvents: 0,
      conflictCount: 0,
      ...overrides,
    };
  }

  /**
   * Creates test sync conflict data with all required fields
   */
  static createSyncConflictData(
    overrides: Partial<TestSyncConflictData> = {}
  ): TestSyncConflictData {
    return {
      eventId: 'test-event-id',
      conflictType: CalendarConflictType.TITLE,
      description: 'Test conflict description',
      localData: { title: 'Local Title' },
      remoteData: { title: 'Remote Title' },
      resolution: CalendarConflictResolution.PENDING,
      localVersion: JSON.stringify({ title: 'Local Title' }),
      remoteVersion: JSON.stringify({ title: 'Remote Title' }),
      conflictData: {
        localValue: 'Local Title',
        remoteValue: 'Remote Title',
      },
      autoResolvable: false,
      ...overrides,
    };
  }

  /**
   * Creates a mock user for testing
   */
  static createMockUser() {
    const timestamp = Date.now();
    return {
      id: `test-user-${timestamp}`,
      email: `test-${timestamp}@example.com`,
    };
  }

  /**
   * Creates valid sync request body data
   */
  static createSyncRequestData(overrides: any = {}) {
    return {
      calendarId: 'default',
      direction: SyncDirection.BIDIRECTIONAL,
      conflictResolution: 'prefer_latest',
      ...overrides,
    };
  }
}

/**
 * Enum mapping helpers for tests
 */
export const TestEnumValues = {
  SyncDirection: {
    BIDIRECTIONAL: SyncDirection.BIDIRECTIONAL,
    UPLOAD: SyncDirection.UPLOAD,
    DOWNLOAD: SyncDirection.DOWNLOAD,
  },
  CalendarSyncStatus: {
    PENDING: CalendarSyncStatus.PENDING,
    IN_PROGRESS: CalendarSyncStatus.IN_PROGRESS,
    COMPLETED: CalendarSyncStatus.COMPLETED,
    FAILED: CalendarSyncStatus.FAILED,
  },
  CalendarConflictType: {
    TITLE: CalendarConflictType.TITLE,
    TIME_MISMATCH: CalendarConflictType.TIME_MISMATCH,
    LOCATION_MISMATCH: CalendarConflictType.LOCATION_MISMATCH,
    BOTH_MODIFIED: CalendarConflictType.BOTH_MODIFIED,
  },
  CalendarConflictResolution: {
    PENDING: CalendarConflictResolution.PENDING,
    USE_LOCAL: CalendarConflictResolution.USE_LOCAL,
    USE_REMOTE: CalendarConflictResolution.USE_REMOTE,
    MERGE: CalendarConflictResolution.MERGE,
    MANUAL: CalendarConflictResolution.MANUAL,
  },
};
