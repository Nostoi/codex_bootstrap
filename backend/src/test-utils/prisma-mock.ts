import { PrismaService } from '../prisma/prisma.service';

/**
 * Deep mock utility type that ensures all nested properties are Jest mocks
 */
type DeepMockify<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R
    ? jest.MockInstance<R, Parameters<T[K]>>
    : T[K] extends object
      ? DeepMockify<T[K]>
      : T[K];
};

/**
 * Type for a fully mocked PrismaService with all model operations as Jest mocks
 */
export type MockedPrismaService = DeepMockify<PrismaService>;

/**
 * Creates a properly typed mock PrismaService where all model methods are Jest mocks
 * with support for mockResolvedValue, mockRejectedValue, etc.
 *
 * @returns Fully mocked PrismaService with proper TypeScript support
 */
export function createMockPrismaService(): MockedPrismaService {
  const createModelMock = () => ({
    // Basic CRUD operations
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  });

  const prismaServiceMock = {
    // Core Prisma client methods
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $on: jest.fn(),
    $use: jest.fn(),

    // User management
    user: createModelMock(),
    userSettings: createModelMock(),

    // Task management
    task: createModelMock(),
    taskDependency: createModelMock(),

    // Calendar sync models
    calendarSyncState: createModelMock(),
    calendarEvent: createModelMock(),
    calendarSyncConflict: createModelMock(),

    // Integration models
    integrationConfig: createModelMock(),

    // Project models
    project: createModelMock(),

    // Notification models
    notification: createModelMock(),

    // Additional models can be added here as needed

    // NestJS lifecycle methods (from PrismaService)
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    onModuleDestroy: jest.fn().mockResolvedValue(undefined),
  } as unknown as MockedPrismaService;

  return prismaServiceMock;
}

/**
 * Helper function to reset all mocks in a MockedPrismaService
 * Useful for beforeEach hooks in tests
 *
 * @param prismaService The mocked Prisma service to reset
 */
export function resetPrismaMocks(prismaService: MockedPrismaService): void {
  // Reset model mocks by directly accessing each model's methods
  const resetModelMethods = (model: any) => {
    if (model && typeof model === 'object') {
      // Reset common Prisma model methods directly without iteration
      const methods = [
        'create',
        'findMany',
        'findUnique',
        'findFirst',
        'update',
        'updateMany',
        'upsert',
        'delete',
        'deleteMany',
        'count',
        'aggregate',
        'groupBy',
      ];
      methods.forEach(methodName => {
        const method = model[methodName];
        if (jest.isMockFunction(method)) {
          method.mockReset();
        }
      });
    }
  };

  // Reset each model explicitly to avoid type system complexity
  resetModelMethods(prismaService.user);
  resetModelMethods(prismaService.project);
  resetModelMethods(prismaService.task);
  resetModelMethods(prismaService.taskDependency);
  resetModelMethods(prismaService.notification);
  resetModelMethods(prismaService.interactionLog);
  resetModelMethods(prismaService.userSettings);
  resetModelMethods(prismaService.tag);
  resetModelMethods(prismaService.calendarEvent);
  resetModelMethods(prismaService.calendarSyncState);
  resetModelMethods(prismaService.calendarSyncConflict);
  resetModelMethods(prismaService.integrationConfig);
  resetModelMethods(prismaService.oAuthProvider);
  resetModelMethods(prismaService.userSession);
  resetModelMethods(prismaService.blacklistedToken);
  resetModelMethods(prismaService.document);
  resetModelMethods(prismaService.collaborationSession);

  // Reset core Prisma methods directly
  if (jest.isMockFunction(prismaService.$connect)) prismaService.$connect.mockReset();
  if (jest.isMockFunction(prismaService.$disconnect)) prismaService.$disconnect.mockReset();
  if (jest.isMockFunction(prismaService.$transaction)) prismaService.$transaction.mockReset();
  if (jest.isMockFunction(prismaService.$queryRaw)) prismaService.$queryRaw.mockReset();
  if (jest.isMockFunction(prismaService.$executeRaw)) prismaService.$executeRaw.mockReset();
  if (jest.isMockFunction(prismaService.$executeRawUnsafe))
    prismaService.$executeRawUnsafe.mockReset();
  if (jest.isMockFunction(prismaService.$queryRawUnsafe)) prismaService.$queryRawUnsafe.mockReset();
  if (jest.isMockFunction(prismaService.$on)) prismaService.$on.mockReset();
  if (jest.isMockFunction(prismaService.$use)) prismaService.$use.mockReset();
  if (jest.isMockFunction(prismaService.onModuleInit)) prismaService.onModuleInit.mockReset();
  if (jest.isMockFunction(prismaService.onModuleDestroy)) prismaService.onModuleDestroy.mockReset();
}

/**
 * Helper function to create common mock return values for Prisma operations
 */
export const PrismaMockHelpers = {
  /**
   * Creates a mock user object with default values
   */
  createMockUser: (overrides: Partial<any> = {}) => ({
    id: 'test-user-123',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Creates a mock user settings object
   */
  createMockUserSettings: (overrides: Partial<any> = {}) => ({
    id: 'settings-123',
    userId: 'test-user-123',
    workingHoursStart: 9,
    workingHoursEnd: 17,
    timeZone: 'UTC',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Creates a mock calendar sync state object
   */
  createMockCalendarSyncState: (overrides: Partial<any> = {}) => ({
    id: 'sync-state-123',
    userId: 'test-user-123',
    calendarId: 'default',
    status: 'PENDING',
    direction: 'bidirectional',
    totalEvents: 0,
    processedEvents: 0,
    syncedEvents: 0,
    conflictedEvents: 0,
    failedEvents: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Creates a mock calendar event object
   */
  createMockCalendarEvent: (overrides: Partial<any> = {}) => ({
    id: 'calendar-event-123',
    graphId: 'graph-event-123',
    userId: 'test-user-123',
    title: 'Test Event',
    description: 'Test Description',
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000), // 1 hour later
    isAllDay: false,
    location: 'Test Location',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Creates a mock calendar sync conflict object
   */
  createMockCalendarSyncConflict: (overrides: Partial<any> = {}) => ({
    id: 'conflict-123',
    calendarEventId: 'calendar-event-123',
    conflictType: 'TITLE',
    localVersion: '{"title": "Local Title"}',
    remoteVersion: '{"title": "Remote Title"}',
    conflictData: { localValue: 'Local Title', remoteValue: 'Remote Title' },
    resolution: 'PENDING',
    detectedAt: new Date(),
    autoResolvable: false,
    ...overrides,
  }),

  /**
   * Creates a mock task object
   */
  createMockTask: (overrides: Partial<any> = {}) => ({
    id: 'task-123',
    title: 'Test Task',
    description: 'Test Description',
    userId: 'test-user-123',
    status: 'TODO',
    priority: 3,
    estimatedMinutes: 60,
    energyLevel: 'MEDIUM',
    focusType: 'TECHNICAL',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};
