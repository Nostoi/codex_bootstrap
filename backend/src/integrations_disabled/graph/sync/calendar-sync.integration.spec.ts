import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { CalendarSyncStatus } from '@prisma/client';
import {
  CalendarSyncTestDataFactory,
  TestEnumValues,
} from '../../../test-utils/calendar-sync-test-data.factory';

describe('Calendar Sync Integration Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let testDataFactory: CalendarSyncTestDataFactory;

  const mockUser = CalendarSyncTestDataFactory.createMockUser();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    testDataFactory = new CalendarSyncTestDataFactory();

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
        .send(CalendarSyncTestDataFactory.createSyncRequestData())
        .expect(202);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('status', 'started');

      // Verify sync state was created
      const syncState = await prismaService.calendarSyncState.findUnique({
        where: {
          userId_calendarId: {
            userId: mockUser.id,
            calendarId: 'default',
          },
        },
      });

      expect(syncState?.status).toBe(CalendarSyncStatus.PENDING);
    });

    it('should reject invalid sync direction', async () => {
      await request(app.getHttpServer())
        .post('/calendar/sync/start')
        .set('Authorization', `Bearer mock-jwt-token`)
        .send({
          direction: 'invalid-direction',
          conflictResolution: 'prefer_latest',
        })
        .expect(400);
    });

    it('should handle existing in-progress sync', async () => {
      // Create an existing in-progress sync
      await prismaService.calendarSyncState.create({
        data: CalendarSyncTestDataFactory.createSyncStateData({
          status: CalendarSyncStatus.IN_PROGRESS,
        }),
      });

      await request(app.getHttpServer())
        .post('/calendar/sync/start')
        .set('Authorization', `Bearer mock-jwt-token`)
        .send(CalendarSyncTestDataFactory.createSyncRequestData())
        .expect(409); // Conflict - sync already in progress
    });

    it('should return sync status', async () => {
      // Create a sync job first
      const response = await request(app.getHttpServer())
        .post('/calendar/sync/start')
        .set('Authorization', `Bearer mock-jwt-token`)
        .send(CalendarSyncTestDataFactory.createSyncRequestData())
        .expect(202);

      const jobId = response.body.jobId;

      const statusResponse = await request(app.getHttpServer())
        .get(`/calendar/sync/status/${jobId}`)
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(200);

      expect(statusResponse.body).toHaveProperty('status');
      expect(statusResponse.body).toHaveProperty('progress');
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
          data: CalendarSyncTestDataFactory.createSyncStateData({
            status: CalendarSyncStatus.COMPLETED,
            direction: TestEnumValues.SyncDirection.DOWNLOAD,
            totalEvents: 50,
            processedEvents: 50,
            syncedEvents: 10,
            conflictedEvents: 5,
            failedEvents: 5,
          }),
        }),
        prismaService.calendarSyncState.create({
          data: CalendarSyncTestDataFactory.createSyncStateData({
            status: CalendarSyncStatus.FAILED,
            direction: TestEnumValues.SyncDirection.UPLOAD,
            calendarId: 'calendar2',
          }),
        }),
      ]);

      const response = await request(app.getHttpServer())
        .get('/calendar/sync/history')
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('direction');
      expect(response.body[0]).toHaveProperty('status');
    });
  });

  describe('GET /calendar/sync/conflicts', () => {
    it('should return pending conflicts', async () => {
      // Create a sync state and conflict
      const syncState = await prismaService.calendarSyncState.create({
        data: CalendarSyncTestDataFactory.createSyncStateData({
          status: CalendarSyncStatus.COMPLETED,
          conflictsDetected: 1,
        }),
      });

      // First create a calendar event to reference
      const calendarEvent = await prismaService.calendarEvent.create({
        data: CalendarSyncTestDataFactory.createCalendarEventData({
          userId: mockUser.id,
        }),
      });

      const conflict = await prismaService.calendarSyncConflict.create({
        data: CalendarSyncTestDataFactory.createSyncConflictData({
          eventId: calendarEvent.id,
          syncStateId: syncState.id,
          calendarEventId: calendarEvent.id,
        }),
      });

      const response = await request(app.getHttpServer())
        .get('/calendar/sync/conflicts')
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('conflictType');
      expect(response.body[0]).toHaveProperty('localData');
      expect(response.body[0]).toHaveProperty('remoteData');
    });
  });

  describe('PUT /calendar/sync/conflicts/:id/resolve', () => {
    it('should resolve a conflict with local preference', async () => {
      // Create a sync state and conflict
      const syncState = await prismaService.calendarSyncState.create({
        data: CalendarSyncTestDataFactory.createSyncStateData({
          status: CalendarSyncStatus.COMPLETED,
          conflictsDetected: 1,
        }),
      });

      const calendarEvent = await prismaService.calendarEvent.create({
        data: CalendarSyncTestDataFactory.createCalendarEventData({
          userId: mockUser.id,
        }),
      });

      const conflict = await prismaService.calendarSyncConflict.create({
        data: CalendarSyncTestDataFactory.createSyncConflictData({
          eventId: calendarEvent.id,
          syncStateId: syncState.id,
          calendarEventId: calendarEvent.id,
        }),
      });

      const response = await request(app.getHttpServer())
        .put(`/calendar/sync/conflicts/${conflict.id}/resolve`)
        .set('Authorization', `Bearer mock-jwt-token`)
        .send({
          resolution: TestEnumValues.CalendarConflictResolution.USE_LOCAL,
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'resolved');

      // Verify conflict was updated
      const updatedConflict = await prismaService.calendarSyncConflict.findUnique({
        where: { id: conflict.id },
      });

      expect(updatedConflict?.resolution).toBe(TestEnumValues.CalendarConflictResolution.USE_LOCAL);
      expect(updatedConflict?.resolvedAt).toBeTruthy();
    });
  });

  describe('GET /calendar/sync/conflicts/stats', () => {
    it('should return conflict statistics', async () => {
      // Create multiple sync states with different statuses
      const syncStates = await Promise.all([
        prismaService.calendarSyncState.create({
          data: CalendarSyncTestDataFactory.createSyncStateData({
            status: CalendarSyncStatus.COMPLETED,
            direction: TestEnumValues.SyncDirection.BIDIRECTIONAL,
            conflictsDetected: 2,
          }),
        }),
        prismaService.calendarSyncState.create({
          data: CalendarSyncTestDataFactory.createSyncStateData({
            status: CalendarSyncStatus.COMPLETED,
            direction: TestEnumValues.SyncDirection.DOWNLOAD,
            calendarId: 'calendar2',
            conflictsDetected: 1,
          }),
        }),
      ]);

      const response = await request(app.getHttpServer())
        .get('/calendar/sync/conflicts/stats')
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(200);

      expect(response.body).toHaveProperty('totalConflicts');
      expect(response.body).toHaveProperty('pendingConflicts');
      expect(response.body).toHaveProperty('resolvedConflicts');
    });
  });

  describe('DELETE /calendar/sync/:id', () => {
    it('should cancel a running sync job', async () => {
      // Create a sync state
      const syncState = await prismaService.calendarSyncState.create({
        data: CalendarSyncTestDataFactory.createSyncStateData({
          status: CalendarSyncStatus.IN_PROGRESS,
        }),
      });

      const response = await request(app.getHttpServer())
        .delete(`/calendar/sync/${syncState.id}`)
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'cancelled');
    });
  });

  describe('POST /calendar/sync/conflicts/:id/auto-resolve', () => {
    it('should auto-resolve a resolvable conflict', async () => {
      // Create a sync state and auto-resolvable conflict
      const syncState = await prismaService.calendarSyncState.create({
        data: CalendarSyncTestDataFactory.createSyncStateData({
          status: CalendarSyncStatus.COMPLETED,
          conflictsDetected: 1,
        }),
      });

      const calendarEvent = await prismaService.calendarEvent.create({
        data: CalendarSyncTestDataFactory.createCalendarEventData({
          userId: mockUser.id,
        }),
      });

      const conflict = await prismaService.calendarSyncConflict.create({
        data: CalendarSyncTestDataFactory.createSyncConflictData({
          eventId: calendarEvent.id,
          syncStateId: syncState.id,
          calendarEventId: calendarEvent.id,
          autoResolvable: true,
        }),
      });

      const response = await request(app.getHttpServer())
        .post(`/calendar/sync/conflicts/${conflict.id}/auto-resolve`)
        .set('Authorization', `Bearer mock-jwt-token`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'auto-resolved');
    });
  });
});
