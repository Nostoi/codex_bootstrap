import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { CalendarSyncStatus } from '@prisma/client';

describe.skip('Calendar Sync Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.calendarSyncConflict.deleteMany();
    await prismaService.calendarEvent.deleteMany();
    await prismaService.calendarSyncState.deleteMany();
  });

  describe('POST /calendar/sync/start', () => {
    it('should start a sync job successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/calendar/sync/start')
        .set('Authorization', `Bearer mock-jwt-token`)
        .send({
          direction: 'bidirectional',
          conflictResolution: 'prefer_latest',
        })
        .expect(202);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body.status).toBe('started');

      // Verify sync state was created in database
      const syncState = await prismaService.calendarSyncState.findUnique({
        where: { id: response.body.jobId },
      });

      expect(syncState).toBeDefined();
      expect(syncState?.status).toBe(CalendarSyncStatus.PENDING);
      expect(syncState?.direction).toBe('bidirectional');
    });

    it('should validate request body', async () => {
      await request(app.getHttpServer())
        .post('/calendar/sync/start')
        .set('Authorization', `Bearer mock-jwt-token`)
        .send({
          direction: 'invalid-direction',
        })
        .expect(400);
    });
  });

  describe('GET /calendar/sync/status/:jobId', () => {
    it('should return sync job status', async () => {
      // Create a sync state in the database
      const syncState = await prismaService.calendarSyncState.create({
        data: {
          userId: mockUser.id,
          calendarId: 'default',
          status: CalendarSyncStatus.IN_PROGRESS,
          direction: 'bidirectional',
          totalEvents: 100,
          processedEvents: 50,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/calendar/sync/status/${syncState.id}`)
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(200);

      expect(response.body).toMatchObject({
        jobId: syncState.id,
        status: 'IN_PROGRESS',
        direction: 'bidirectional',
        progress: {
          total: 100,
          processed: 50,
        },
      });
    });

    it('should return 404 for non-existent job', async () => {
      await request(app.getHttpServer())
        .get('/calendar/sync/status/non-existent-job')
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(404);
    });
  });

  describe('GET /calendar/sync/history', () => {
    it('should return sync history with pagination', async () => {
      // Create multiple sync states
      const syncStates = await Promise.all([
        prismaService.calendarSyncState.create({
          data: {
            userId: mockUser.id,
            calendarId: 'default',
            status: CalendarSyncStatus.COMPLETED,
            direction: 'pull',
            totalEvents: 50,
            processedEvents: 50,
            syncedEvents: 10,
            conflictedEvents: 5,
            failedEvents: 5,
          },
        }),
        prismaService.calendarSyncState.create({
          data: {
            userId: mockUser.id,
            calendarId: 'default',
            status: CalendarSyncStatus.FAILED,
            direction: 'push',
            totalEvents: 25,
            processedEvents: 10,
            error: 'Network timeout',
          },
        }),
      ]);

      const response = await request(app.getHttpServer())
        .get('/calendar/sync/history?limit=10&offset=0')
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('direction');
      expect(response.body[0]).toHaveProperty('status');
    });
  });

  describe('GET /calendar/sync/conflicts', () => {
    it('should return pending conflicts', async () => {
      // Create a sync state and conflict
      const syncState = await prismaService.calendarSyncState.create({
        data: {
          userId: mockUser.id,
          calendarId: 'default',
          status: CalendarSyncStatus.COMPLETED,
          direction: 'bidirectional',
          conflictsDetected: 1,
        },
      });

      // First create a calendar event to reference
      const calendarEvent = await prismaService.calendarEvent.create({
        data: {
          userId: mockUser.id,
          graphId: 'event-123',
          subject: 'Test Event',
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T11:00:00Z'),
        },
      });

      const conflict = await prismaService.calendarSyncConflict.create({
        data: {
          syncStateId: syncState.id,
          eventId: 'event-123',
          calendarEventId: calendarEvent.id,
          conflictType: 'TITLE',
          localVersion: JSON.stringify({ title: 'Local Title' }),
          remoteVersion: JSON.stringify({ title: 'Remote Title' }),
          conflictData: {
            localValue: 'Local Title',
            remoteValue: 'Remote Title',
          },
          resolution: 'PENDING',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/calendar/sync/conflicts')
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        id: conflict.id,
        eventId: 'event-123',
        conflictType: 'TITLE',
      });
    });
  });

  describe('PUT /calendar/sync/conflicts/:conflictId/resolve', () => {
    it('should resolve a conflict', async () => {
      // Create a sync state and conflict
      const syncState = await prismaService.calendarSyncState.create({
        data: {
          userId: mockUser.id,
          calendarId: 'default',
          status: CalendarSyncStatus.COMPLETED,
          direction: 'bidirectional',
        },
      });

      // First create a calendar event to reference
      const calendarEvent = await prismaService.calendarEvent.create({
        data: {
          userId: mockUser.id,
          graphId: 'event-123',
          subject: 'Test Event',
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T11:00:00Z'),
        },
      });

      const conflict = await prismaService.calendarSyncConflict.create({
        data: {
          syncStateId: syncState.id,
          eventId: 'event-123',
          calendarEventId: calendarEvent.id,
          conflictType: 'TITLE',
          localVersion: JSON.stringify({ title: 'Local Title' }),
          remoteVersion: JSON.stringify({ title: 'Remote Title' }),
          conflictData: {
            localValue: 'Local Title',
            remoteValue: 'Remote Title',
          },
          resolution: 'PENDING',
        },
      });

      const response = await request(app.getHttpServer())
        .put(`/calendar/sync/conflicts/${conflict.id}/resolve`)
        .set('Authorization', `Bearer mock-jwt-token`)
        .send({
          resolution: 'PREFER_LOCAL',
          resolvedData: {
            reason: 'User prefers local version',
          },
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Conflict resolved successfully',
      });

      // Verify conflict was updated in database
      const updatedConflict = await prismaService.calendarSyncConflict.findUnique({
        where: { id: conflict.id },
      });

      expect(updatedConflict?.resolution).toBe('PREFER_LOCAL');
      expect(updatedConflict?.resolvedAt).toBeDefined();
    });
  });

  describe('GET /calendar/sync/metrics', () => {
    it('should return sync metrics', async () => {
      // Create some sync states for metrics
      await Promise.all([
        prismaService.calendarSyncState.create({
          data: {
            userId: mockUser.id,
            calendarId: 'default',
            status: CalendarSyncStatus.COMPLETED,
            direction: 'bidirectional',
            totalEvents: 100,
            processedEvents: 100,
            syncedEvents: 20,
            conflictedEvents: 10,
            failedEvents: 0,
          },
        }),
        prismaService.calendarSyncState.create({
          data: {
            userId: mockUser.id,
            calendarId: 'default',
            status: CalendarSyncStatus.FAILED,
            direction: 'pull',
            totalEvents: 50,
            processedEvents: 25,
            error: 'API rate limit exceeded',
          },
        }),
      ]);

      const response = await request(app.getHttpServer())
        .get('/calendar/sync/metrics?days=7')
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(200);

      expect(response.body).toHaveProperty('totalSyncs');
      expect(response.body).toHaveProperty('successfulSyncs');
      expect(response.body).toHaveProperty('failedSyncs');
      expect(response.body).toHaveProperty('eventsProcessed');
      expect(response.body.totalSyncs).toBe(2);
      expect(response.body.successfulSyncs).toBe(1);
      expect(response.body.failedSyncs).toBe(1);
    });
  });

  describe('GET /calendar/sync/test', () => {
    it('should test sync capabilities', async () => {
      const response = await request(app.getHttpServer())
        .get('/calendar/sync/test')
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(200);

      expect(response.body).toHaveProperty('canSync');
      expect(response.body).toHaveProperty('deltaSupported');
      expect(response.body).toHaveProperty('calendars');
    });
  });

  describe('POST /calendar/sync/reset', () => {
    it('should reset sync state', async () => {
      // Create a sync state with delta token
      await prismaService.calendarSyncState.create({
        data: {
          userId: mockUser.id,
          calendarId: 'default',
          status: CalendarSyncStatus.COMPLETED,
          direction: 'bidirectional',
          deltaToken: 'old-delta-token',
          lastSyncTime: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .post('/calendar/sync/reset')
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Sync state reset successfully',
      });
    });
  });

  describe('GET /calendar/sync/conflicts/stats', () => {
    it('should return conflict statistics', async () => {
      // Create sync states and conflicts for statistics
      const syncState = await prismaService.calendarSyncState.create({
        data: {
          userId: mockUser.id,
          calendarId: 'default',
          status: CalendarSyncStatus.COMPLETED,
          direction: 'bidirectional',
        },
      });

      // Create calendar events to reference
      const calendarEvent1 = await prismaService.calendarEvent.create({
        data: {
          userId: mockUser.id,
          graphId: 'event-1',
          subject: 'Test Event 1',
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T11:00:00Z'),
        },
      });

      const calendarEvent2 = await prismaService.calendarEvent.create({
        data: {
          userId: mockUser.id,
          graphId: 'event-2',
          subject: 'Test Event 2',
          startTime: new Date('2025-01-01T14:00:00Z'),
          endTime: new Date('2025-01-01T15:00:00Z'),
        },
      });

      await Promise.all([
        prismaService.calendarSyncConflict.create({
          data: {
            syncStateId: syncState.id,
            eventId: 'event-1',
            calendarEventId: calendarEvent1.id,
            conflictType: 'TITLE',
            localVersion: JSON.stringify({ title: 'Local Title 1' }),
            remoteVersion: JSON.stringify({ title: 'Remote Title 1' }),
            conflictData: {},
            resolution: 'PENDING',
          },
        }),
        prismaService.calendarSyncConflict.create({
          data: {
            syncStateId: syncState.id,
            eventId: 'event-2',
            calendarEventId: calendarEvent2.id,
            conflictType: 'START_TIME',
            localVersion: JSON.stringify({ startTime: '10:00' }),
            remoteVersion: JSON.stringify({ startTime: '11:00' }),
            conflictData: {},
            resolution: 'PREFER_LOCAL',
            resolvedAt: new Date(),
          },
        }),
      ]);

      const response = await request(app.getHttpServer())
        .get('/calendar/sync/conflicts/stats?days=30')
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(200);

      expect(response.body).toMatchObject({
        total: 2,
        pending: 1,
        resolved: 1,
        resolutionBreakdown: expect.any(Object),
        timeRange: expect.any(Object),
      });
    });
  });
});
