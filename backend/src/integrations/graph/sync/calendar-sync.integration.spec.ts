import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { CalendarSyncStatus } from '@prisma/client';

describe('Calendar Sync Integration Tests', () => {
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
            createdEvents: 10,
            updatedEvents: 30,
            deletedEvents: 10,
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

      const conflict = await prismaService.calendarSyncConflict.create({
        data: {
          syncStateId: syncState.id,
          eventId: 'event-123',
          conflictType: 'TITLE',
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

      const conflict = await prismaService.calendarSyncConflict.create({
        data: {
          syncStateId: syncState.id,
          eventId: 'event-123',
          conflictType: 'TITLE',
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
            createdEvents: 20,
            updatedEvents: 70,
            deletedEvents: 10,
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

      await Promise.all([
        prismaService.calendarSyncConflict.create({
          data: {
            syncStateId: syncState.id,
            eventId: 'event-1',
            conflictType: 'TITLE',
            conflictData: {},
            resolution: 'PENDING',
          },
        }),
        prismaService.calendarSyncConflict.create({
          data: {
            syncStateId: syncState.id,
            eventId: 'event-2',
            conflictType: 'START_TIME',
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
