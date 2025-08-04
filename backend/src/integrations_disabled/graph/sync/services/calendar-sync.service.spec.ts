import { Test, TestingModule } from '@nestjs/testing';
import { CalendarSyncService } from './calendar-sync.service';
import { DeltaSyncManager } from './delta-sync.manager';
import { ConflictResolver } from './conflict-resolver.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GraphService } from '../../graph.service';
import { GraphAuthService } from '../../auth/graph-auth.service';
import { CalendarSyncStatus, CalendarConflictResolution } from '@prisma/client';
import { SyncDirection } from '../types/calendar-sync.types';
import { createMockPrismaService } from '../../../../test-utils';

describe('CalendarSyncService', () => {
  let service: CalendarSyncService;
  let prismaService: jest.Mocked<PrismaService>;
  let deltaSyncManager: jest.Mocked<DeltaSyncManager>;
  let conflictResolver: jest.Mocked<ConflictResolver>;
  let graphService: jest.Mocked<GraphService>;
  let graphAuthService: jest.Mocked<GraphAuthService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockSyncState = {
    id: 'sync-123',
    userId: mockUser.id,
    calendarId: 'default',
    status: CalendarSyncStatus.PENDING,
    direction: 'bidirectional' as SyncDirection,
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
  };

  const mockGraphEvent = {
    id: 'graph-event-123',
    subject: 'Test Event',
    body: { content: 'Test Description' },
    start: { dateTime: '2025-01-15T10:00:00Z' },
    end: { dateTime: '2025-01-15T11:00:00Z' },
    location: { displayName: 'Test Location' },
    isAllDay: false,
    recurrence: null,
    lastModifiedDateTime: '2025-01-15T09:00:00Z',
    createdDateTime: '2025-01-15T08:00:00Z',
  };

  beforeEach(async () => {
    const mockPrismaService = createMockPrismaService();

    const mockDeltaSyncManager = {
      getDeltaChanges: jest.fn(),
      initializeDeltaSync: jest.fn(),
      isDeltaSyncSupported: jest.fn(),
      parseDeltaChanges: jest.fn(),
      isValidDeltaToken: jest.fn(),
    };

    const mockConflictResolver = {
      detectConflicts: jest.fn(),
      autoResolveConflict: jest.fn(),
      recordConflict: jest.fn(),
      getPendingConflicts: jest.fn(),
      getConflictStats: jest.fn(),
    };

    const mockGraphService = {
      getCalendarEvents: jest.fn(),
      createCalendarEvent: jest.fn(),
      updateCalendarEvent: jest.fn(),
      deleteCalendarEvent: jest.fn(),
      getCalendars: jest.fn(),
    };

    const mockGraphAuthService = {
      getAccessToken: jest.fn(),
      isTokenValid: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarSyncService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DeltaSyncManager, useValue: mockDeltaSyncManager },
        { provide: ConflictResolver, useValue: mockConflictResolver },
        { provide: GraphService, useValue: mockGraphService },
        { provide: GraphAuthService, useValue: mockGraphAuthService },
      ],
    }).compile();

    service = module.get<CalendarSyncService>(CalendarSyncService);
    prismaService = module.get(PrismaService);
    deltaSyncManager = module.get(DeltaSyncManager);
    conflictResolver = module.get(ConflictResolver);
    graphService = module.get(GraphService);
    graphAuthService = module.get(GraphAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startSync', () => {
    it('should start a bidirectional sync successfully', async () => {
      // Arrange
      prismaService.calendarSyncState.create.mockResolvedValue(mockSyncState);
      deltaSyncManager.isDeltaSyncSupported.mockResolvedValue(true);
      deltaSyncManager.initializeDeltaSync.mockResolvedValue('delta-token-123');
      graphAuthService.isTokenValid.mockResolvedValue(true);

      // Act
      const jobId = await service.startSync(mockUser.id, 'bidirectional');

      // Assert
      expect(jobId).toBeDefined();
      expect(prismaService.calendarSyncState.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          direction: 'bidirectional',
          status: CalendarSyncStatus.PENDING,
        }),
      });
    });

    it('should handle sync startup failure', async () => {
      // Arrange
      graphAuthService.isTokenValid.mockResolvedValue(false);

      // Act & Assert
      await expect(service.startSync(mockUser.id, 'bidirectional')).rejects.toThrow(
        'Invalid or expired access token'
      );
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status for valid job', async () => {
      // Arrange
      prismaService.calendarSyncState.findUnique.mockResolvedValue(mockSyncState);

      // Act
      const status = await service.getSyncStatus(mockSyncState.id);

      // Assert
      expect(status).toMatchObject({
        jobId: mockSyncState.id,
        status: mockSyncState.status,
        direction: mockSyncState.direction,
        progress: {
          total: mockSyncState.totalEvents,
          processed: mockSyncState.processedEvents,
        },
      });
    });

    it('should return null for non-existent job', async () => {
      // Arrange
      prismaService.calendarSyncState.findUnique.mockResolvedValue(null);

      // Act
      const status = await service.getSyncStatus('non-existent');

      // Assert
      expect(status).toBeNull();
    });
  });

  describe('performPullSync', () => {
    it('should pull events from Graph API successfully', async () => {
      // Arrange
      const mockDeltaResult = {
        events: [mockGraphEvent],
        deltaToken: 'new-delta-token',
      };

      deltaSyncManager.getDeltaChanges.mockResolvedValue(mockDeltaResult);
      prismaService.calendarEvent.upsert.mockResolvedValue({
        id: 'local-event-123',
        ...mockGraphEvent,
      });

      // Act
      const result = await service['performPullSync'](
        mockUser.id,
        mockSyncState.id,
        'delta-token-123'
      );

      // Assert
      expect(result.totalEvents).toBe(1);
      expect(result.createdEvents).toBe(1);
      expect(deltaSyncManager.getDeltaChanges).toHaveBeenCalledWith(
        mockUser.id,
        'delta-token-123',
        expect.any(Object)
      );
    });

    it('should handle delta sync errors gracefully', async () => {
      // Arrange
      deltaSyncManager.getDeltaChanges.mockRejectedValue(new Error('DELTA_TOKEN_INVALID'));
      graphService.getCalendarEvents.mockResolvedValue([mockGraphEvent]);

      // Act
      const result = await service['performPullSync'](
        mockUser.id,
        mockSyncState.id,
        'invalid-delta-token'
      );

      // Assert
      expect(result.totalEvents).toBe(1);
      expect(graphService.getCalendarEvents).toHaveBeenCalled();
    });
  });

  describe('detectAndResolveConflicts', () => {
    it('should detect and auto-resolve conflicts', async () => {
      // Arrange
      const localEvent = {
        id: 'local-123',
        graphEventId: 'graph-event-123',
        subject: 'Local Subject',
        lastModifiedDateTime: '2025-01-15T10:00:00Z',
        ...mockGraphEvent,
      };

      const conflictInfo = {
        eventId: localEvent.id,
        conflictTypes: ['TITLE'],
        localModified: new Date('2025-01-15T10:00:00Z'),
        remoteModified: new Date('2025-01-15T09:00:00Z'),
        details: {},
        suggestedResolution: 'prefer_latest',
      };

      conflictResolver.detectConflicts.mockResolvedValue(conflictInfo);
      conflictResolver.autoResolveConflict.mockResolvedValue({
        resolvedEvent: localEvent,
        resolution: CalendarConflictResolution.PREFER_LOCAL,
        details: { reason: 'Local event modified more recently' },
      });

      // Act
      const result = await service['detectAndResolveConflicts'](
        localEvent,
        mockGraphEvent,
        new Date('2025-01-15T08:00:00Z'),
        'prefer_latest'
      );

      // Assert
      expect(result.hasConflict).toBe(true);
      expect(result.resolution).toBe(CalendarConflictResolution.PREFER_LOCAL);
      expect(conflictResolver.detectConflicts).toHaveBeenCalled();
      expect(conflictResolver.autoResolveConflict).toHaveBeenCalled();
    });

    it('should handle no conflicts scenario', async () => {
      // Arrange
      const localEvent = {
        id: 'local-123',
        graphEventId: 'graph-event-123',
        ...mockGraphEvent,
      };

      conflictResolver.detectConflicts.mockResolvedValue(null);

      // Act
      const result = await service['detectAndResolveConflicts'](
        localEvent,
        mockGraphEvent,
        new Date('2025-01-15T08:00:00Z'),
        'prefer_latest'
      );

      // Assert
      expect(result.hasConflict).toBe(false);
      expect(result.resolvedEvent).toEqual(mockGraphEvent);
    });
  });

  describe('getSyncHistory', () => {
    it('should return paginated sync history', async () => {
      // Arrange
      const mockHistory = [
        { ...mockSyncState, id: 'sync-1' },
        { ...mockSyncState, id: 'sync-2' },
      ];

      prismaService.calendarSyncState.findMany.mockResolvedValue(mockHistory);

      // Act
      const history = await service.getSyncHistory(mockUser.id, 10, 0);

      // Assert
      expect(history).toHaveLength(2);
      expect(prismaService.calendarSyncState.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });
  });

  describe('testSyncCapabilities', () => {
    it('should test user sync capabilities', async () => {
      // Arrange
      graphAuthService.isTokenValid.mockResolvedValue(true);
      deltaSyncManager.isDeltaSyncSupported.mockResolvedValue(true);
      graphService.getCalendars.mockResolvedValue([
        { id: 'cal-1', name: 'Calendar 1' },
        { id: 'cal-2', name: 'Calendar 2' },
      ]);

      // Act
      const capabilities = await service.testSyncCapabilities(mockUser.id);

      // Assert
      expect(capabilities.canSync).toBe(true);
      expect(capabilities.deltaSupported).toBe(true);
      expect(capabilities.calendars).toHaveLength(2);
    });

    it('should handle invalid authentication', async () => {
      // Arrange
      graphAuthService.isTokenValid.mockResolvedValue(false);

      // Act
      const capabilities = await service.testSyncCapabilities(mockUser.id);

      // Assert
      expect(capabilities.canSync).toBe(false);
      expect(capabilities.deltaSupported).toBe(false);
      expect(capabilities.calendars).toEqual([]);
    });
  });

  describe('getSyncMetrics', () => {
    it('should return sync metrics for specified period', async () => {
      // Arrange
      const mockMetrics = [
        { ...mockSyncState, status: CalendarSyncStatus.COMPLETED },
        { ...mockSyncState, status: CalendarSyncStatus.FAILED },
      ];

      prismaService.calendarSyncState.findMany.mockResolvedValue(mockMetrics);

      // Act
      const metrics = await service.getSyncMetrics(mockUser.id, 7);

      // Assert
      expect(metrics.totalSyncs).toBe(2);
      expect(metrics.successfulSyncs).toBe(1);
      expect(metrics.failedSyncs).toBe(1);
    });
  });
});
