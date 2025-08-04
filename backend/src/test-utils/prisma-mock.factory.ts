import { PrismaService } from '../prisma/prisma.service';

// Helper type to ensure all nested objects are properly mocked
type DeepMocked<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? jest.MockedFunction<T[K]>
    : T[K] extends object
      ? DeepMocked<T[K]>
      : T[K];
};

/**
 * Creates a properly typed mock PrismaService for testing
 * All methods return Jest mock functions that can use mockResolvedValue/mockRejectedValue
 */
export function createMockPrismaService(): DeepMocked<PrismaService> {
  return {
    // Task operations
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    } as any,

    // User settings operations
    userSettings: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    } as any,

    // Task dependency operations
    taskDependency: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    } as any,

    // User operations
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    } as any,

    // Project operations
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    } as any,

    // Calendar sync operations
    calendarSyncState: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    } as any,

    // Calendar event operations
    calendarEvent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    } as any,

    // Calendar sync conflict operations
    calendarSyncConflict: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    } as any,

    // Integration config operations
    integrationConfig: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    } as any,

    // Notification operations
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    } as any,

    // Connection lifecycle methods
    $connect: jest.fn(),
    $disconnect: jest.fn(),

    // Transaction methods
    $transaction: jest.fn(),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),

    // Other Prisma client methods
    $use: jest.fn(),
    $on: jest.fn(),
  } as any; // Use any to bypass complex Prisma typing issues
}

/**
 * Resets all mock calls and implementations
 */
export function resetMockPrismaService(mockPrisma: jest.Mocked<PrismaService>): void {
  jest.clearAllMocks();

  // Reset all task mocks
  Object.values(mockPrisma.task).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });

  // Reset all userSettings mocks
  Object.values(mockPrisma.userSettings).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });

  // Reset all taskDependency mocks
  Object.values(mockPrisma.taskDependency).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });

  // Reset calendar sync mocks
  Object.values(mockPrisma.calendarSyncState).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });

  Object.values(mockPrisma.calendarEvent).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });

  Object.values(mockPrisma.calendarSyncConflict).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });

  // Reset other model mocks
  Object.values(mockPrisma.user).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });

  Object.values(mockPrisma.project).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });

  Object.values(mockPrisma.integrationConfig).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });

  Object.values(mockPrisma.notification).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
}

/**
 * Calendar sync specific mock data helpers
 */
export const mockCalendarSyncData = {
  syncState: (overrides = {}) => ({
    id: 'sync-123',
    userId: 'user-123',
    calendarId: 'default',
    status: 'PENDING',
    direction: 'bidirectional',
    deltaToken: null,
    lastSyncTime: null,
    totalEvents: 0,
    processedEvents: 0,
    createdEvents: 0,
    updatedEvents: 0,
    deletedEvents: 0,
    conflictsDetected: 0,
    startedAt: new Date(),
    completedAt: null,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  calendarEvent: (overrides = {}) => ({
    id: 'event-123',
    calendarId: 'default',
    graphEventId: 'graph-event-123',
    title: 'Test Event',
    description: 'Test Description',
    startTime: new Date('2025-01-15T10:00:00Z'),
    endTime: new Date('2025-01-15T11:00:00Z'),
    location: 'Test Location',
    isAllDay: false,
    recurrence: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastModifiedDateTime: '2025-01-15T09:00:00Z',
    ...overrides,
  }),

  syncConflict: (overrides = {}) => ({
    id: 'conflict-123',
    syncStateId: 'sync-123',
    eventId: 'event-123',
    calendarEventId: 'event-123',
    conflictType: 'TITLE',
    localVersion: JSON.stringify({ title: 'Local Title' }),
    remoteVersion: JSON.stringify({ title: 'Remote Title' }),
    conflictData: { localValue: 'Local Title', remoteValue: 'Remote Title' },
    resolution: 'PENDING',
    resolvedBy: null,
    resolvedAt: null,
    detectedAt: new Date(),
    autoResolvable: false,
    ...overrides,
  }),
};
