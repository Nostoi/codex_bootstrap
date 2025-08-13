import { Test, TestingModule } from '@nestjs/testing';
import { GraphService } from '../graph.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { GraphAuthService } from '../auth/graph-auth.service';
import { ConfigService } from '@nestjs/config';
import { Client } from '@microsoft/microsoft-graph-client';

/**
 * Microsoft Graph Integration Test with Realistic Calendar Data
 *
 * This test demonstrates how the Microsoft Graph integration works with actual calendar data.
 * While using mocked Graph API responses for CI/CD compatibility, the test data represents
 * real Microsoft Outlook calendar scenarios.
 */
describe('GraphService - Calendar Integration with Realistic Data', () => {
  let service: GraphService;
  let prisma: PrismaService;
  let authService: GraphAuthService;
  let module: TestingModule;

  // Realistic Microsoft Graph API response for calendar events
  const mockOutlookCalendarEvents = [
    {
      id: 'AAMkAGE1M2IyNGNmLTI5MTgtNDUyZi1hODVhLTYxZWI4NzQzYTU1NgBGAAAAAAAiQ8W-mfgbQKR5-EQGrm_-BwC',
      subject: 'Daily Standup - ADHD Task Management Team',
      body: {
        content:
          'Review progress on Helmsman ADHD features:\n- Energy level optimization\n- Calendar sync improvements\n- Accessibility enhancements',
        contentType: 'text',
      },
      location: {
        displayName: 'Microsoft Teams Meeting',
      },
      start: {
        dateTime: '2025-08-13T09:00:00.0000000',
        timeZone: 'Pacific Standard Time',
      },
      end: {
        dateTime: '2025-08-13T09:30:00.0000000',
        timeZone: 'Pacific Standard Time',
      },
      isAllDay: false,
      attendees: [
        {
          emailAddress: {
            address: 'dev1@company.com',
            name: 'Developer 1',
          },
          status: {
            response: 'accepted',
          },
        },
        {
          emailAddress: {
            address: 'dev2@company.com',
            name: 'Developer 2',
          },
          status: {
            response: 'tentative',
          },
        },
      ],
      categories: ['Work', 'Development', 'ADHD-Friendly'],
      showAs: 'busy',
      importance: 'normal',
      sensitivity: 'normal',
      organizer: {
        emailAddress: {
          address: 'scrum.master@company.com',
          name: 'Scrum Master',
        },
      },
      webLink: 'https://outlook.office365.com/calendar/event/123',
      lastModifiedDateTime: '2025-08-12T15:30:00.0000000Z',
      '@odata.etag': 'W/"DwAAABYAAAC8/6Y8F+VaTKOGKJAqDNVqAAAS5drS"',
    },
    {
      id: 'AAMkAGE1M2IyNGNmLTI5MTgtNDUyZi1hODVhLTYxZWI4NzQzYTU1NgBGAAAAAAAiQ8W-mfgbQKR5-EQGrm_-BwD',
      subject: 'Focus Time: Deep Work Block',
      body: {
        content:
          'Protected focus time for ADHD-optimized productivity:\n- No meetings\n- No interruptions\n- Complex coding tasks only',
        contentType: 'text',
      },
      location: {
        displayName: 'Home Office - Quiet Zone',
      },
      start: {
        dateTime: '2025-08-13T10:00:00.0000000',
        timeZone: 'Pacific Standard Time',
      },
      end: {
        dateTime: '2025-08-13T12:00:00.0000000',
        timeZone: 'Pacific Standard Time',
      },
      isAllDay: false,
      categories: ['Personal', 'Focus', 'High-Energy'],
      showAs: 'busy',
      importance: 'high',
      sensitivity: 'private',
      organizer: {
        emailAddress: {
          address: 'user@company.com',
          name: 'Test User',
        },
      },
      lastModifiedDateTime: '2025-08-12T20:15:00.0000000Z',
      '@odata.etag': 'W/"DwAAABYAAAC8/6Y8F+VaTKOGKJAqDNVqAAAS5drT"',
    },
    {
      id: 'AAMkAGE1M2IyNGNmLTI5MTgtNDUyZi1hODVhLTYxZWI4NzQzYTU1NgBGAAAAAAAiQ8W-mfgbQKR5-EQGrm_-BwE',
      subject: 'Lunch Break & Energy Recharge',
      body: {
        content:
          'ADHD-friendly break time:\n- Mindful eating\n- Short walk\n- No work-related content',
        contentType: 'text',
      },
      start: {
        dateTime: '2025-08-13T12:00:00.0000000',
        timeZone: 'Pacific Standard Time',
      },
      end: {
        dateTime: '2025-08-13T13:00:00.0000000',
        timeZone: 'Pacific Standard Time',
      },
      isAllDay: false,
      categories: ['Personal', 'Break', 'Low-Energy'],
      showAs: 'free',
      importance: 'normal',
      sensitivity: 'normal',
      organizer: {
        emailAddress: {
          address: 'user@company.com',
          name: 'Test User',
        },
      },
      lastModifiedDateTime: '2025-08-12T18:45:00.0000000Z',
      '@odata.etag': 'W/"DwAAABYAAAC8/6Y8F+VaTKOGKJAqDNVqAAAS5drU"',
    },
  ];

  // Realistic calendar delta sync response (updated and deleted events)
  const mockDeltaSyncResponse = {
    value: [
      {
        ...mockOutlookCalendarEvents[0],
        subject: 'Daily Standup - ADHD Task Management Team [UPDATED]',
        lastModifiedDateTime: '2025-08-13T08:30:00.0000000Z',
        '@odata.etag': 'W/"DwAAABYAAAC8/6Y8F+VaTKOGKJAqDNVqAAAS5drV"',
      },
      {
        id: 'AAMkAGE1M2IyNGNmLTI5MTgtNDUyZi1hODVhLTYxZWI4NzQzYTU1NgBGAAAAAAAiQ8W-mfgbQKR5-EQGrm_-BwF',
        '@removed': {
          reason: 'deleted',
        },
        '@odata.etag': 'W/"DwAAABYAAAC8/6Y8F+VaTKOGKJAqDNVqAAAS5drW"',
      },
    ],
    '@odata.deltaLink':
      'https://graph.microsoft.com/v1.0/me/calendar/events/delta?$deltatoken=R0lGODlhAQABAIAAAP___wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    calendarEvent: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    calendarSyncState: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    integrationConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuthService = {
    getAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
    isUserAuthenticated: jest.fn().mockResolvedValue(true),
    isTokenValid: jest.fn().mockResolvedValue(true),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config = {
        MICROSOFT_CLIENT_ID: 'test-client-id',
        MICROSOFT_CLIENT_SECRET: 'test-client-secret',
        MICROSOFT_REDIRECT_URI: 'http://localhost:3500/auth/microsoft/callback',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        GraphService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GraphAuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<GraphService>(GraphService);
    prisma = module.get<PrismaService>(PrismaService);
    authService = module.get<GraphAuthService>(GraphAuthService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Calendar Event Retrieval', () => {
    it('should fetch and process ADHD-optimized calendar events', async () => {
      // Mock Microsoft Graph API response
      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          query: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ value: mockOutlookCalendarEvents }),
        }),
      };

      jest.spyOn(service as any, 'createGraphClient').mockResolvedValue(mockGraphClient);

      const userId = 'test-user-id';
      const startDate = new Date('2025-08-13T00:00:00Z');
      const endDate = new Date('2025-08-13T23:59:59Z');

      const result = await service.getCalendarEvents(userId, 'primary', startDate, endDate);

      // Verify API call structure
      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/calendar/events');
      expect(authService.getAccessToken).toHaveBeenCalledWith(userId);

      // Verify calendar events contain ADHD-relevant data
      expect(result.calendarEvents).toHaveLength(3);

      // Test standup meeting event
      const standupEvent = result.calendarEvents.find(e => e.subject.includes('Daily Standup'));
      expect(standupEvent).toBeDefined();
      expect(standupEvent.subject).toBe('Daily Standup - ADHD Task Management Team');
      expect(standupEvent.duration).toBe(30); // 30 minutes - ADHD-friendly short meeting
      expect(standupEvent.location).toBe('Microsoft Teams Meeting');
      expect(standupEvent.categories).toContain('ADHD-Friendly');

      // Test focus time event (ADHD deep work optimization)
      const focusEvent = result.calendarEvents.find(e => e.subject.includes('Focus Time'));
      expect(focusEvent).toBeDefined();
      expect(focusEvent.subject).toBe('Focus Time: Deep Work Block');
      expect(focusEvent.duration).toBe(120); // 2 hours - optimal ADHD focus block
      expect(focusEvent.importance).toBe('high');
      expect(focusEvent.categories).toContain('High-Energy');

      // Test break time event (ADHD energy management)
      const breakEvent = result.calendarEvents.find(e => e.subject.includes('Lunch Break'));
      expect(breakEvent).toBeDefined();
      expect(breakEvent.categories).toContain('Low-Energy');
      expect(breakEvent.showAs).toBe('free'); // Available during break
    });

    it('should handle calendar sync with conflict resolution', async () => {
      // Mock existing local events that conflict with remote
      const existingLocalEvent = {
        id: 'local-event-1',
        graphId:
          'AAMkAGE1M2IyNGNmLTI5MTgtNDUyZi1hODVhLTYxZWI4NzQzYTU1NgBGAAAAAAAiQ8W-mfgbQKR5-EQGrm_-BwC',
        subject: 'Daily Standup - ADHD Task Management Team [LOCAL CHANGES]',
        lastModified: new Date('2025-08-13T08:00:00Z'),
        locallyModified: true,
        remotelyModified: false,
      };

      mockPrisma.calendarEvent.findMany.mockResolvedValue([existingLocalEvent]);

      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          query: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ value: mockOutlookCalendarEvents }),
        }),
      };

      jest.spyOn(service as any, 'createGraphClient').mockResolvedValue(mockGraphClient);

      const result = await service.syncCalendarEvents('test-user-id');

      // Verify conflict detection
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('CONTENT_CONFLICT');
      expect(result.conflicts[0].localVersion.subject).toContain('[LOCAL CHANGES]');
      expect(result.conflicts[0].remoteVersion.subject).toBe(
        'Daily Standup - ADHD Task Management Team'
      );

      // Verify conflict resolution strategy for ADHD users (preserve local focus-related changes)
      expect(result.conflicts[0].recommendedResolution).toBe('PREFER_LOCAL');
      expect(result.conflicts[0].reason).toContain('User has made local modifications');
    });

    it('should process delta sync for real-time updates', async () => {
      // Mock existing sync state
      const existingSyncState = {
        id: 'sync-state-1',
        userId: 'test-user-id',
        calendarId: 'primary',
        deltaToken: 'existing-delta-token',
        lastSyncTime: new Date('2025-08-13T07:00:00Z'),
      };

      mockPrisma.calendarSyncState.findUnique.mockResolvedValue(existingSyncState);

      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          query: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue(mockDeltaSyncResponse),
        }),
      };

      jest.spyOn(service as any, 'createGraphClient').mockResolvedValue(mockGraphClient);

      const result = await service.performDeltaSync('test-user-id');

      // Verify delta sync API call
      expect(mockGraphClient.api).toHaveBeenCalledWith('/me/calendar/events/delta');

      // Verify processing of updated events
      expect(result.updatedEvents).toHaveLength(1);
      expect(result.updatedEvents[0].subject).toContain('[UPDATED]');

      // Verify processing of deleted events
      expect(result.deletedEvents).toHaveLength(1);
      expect(result.deletedEvents[0].reason).toBe('deleted');

      // Verify delta token update for next sync
      expect(result.newDeltaToken).toBe(
        'R0lGODlhAQABAIAAAP___wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
      );
    });

    it('should extract ADHD-relevant metadata from calendar events', async () => {
      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          query: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ value: mockOutlookCalendarEvents }),
        }),
      };

      jest.spyOn(service as any, 'createGraphClient').mockResolvedValue(mockGraphClient);

      const result = await service.getCalendarEventsWithADHDMetadata('test-user-id');

      // Verify ADHD-specific categorization
      const events = result.calendarEvents;

      // Check energy level classification
      const focusEvent = events.find(e => e.subject.includes('Focus Time'));
      expect(focusEvent.adhdMetadata.energyLevel).toBe('HIGH');
      expect(focusEvent.adhdMetadata.focusType).toBe('TECHNICAL');
      expect(focusEvent.adhdMetadata.breakNeeded).toBe(false);

      const breakEvent = events.find(e => e.subject.includes('Lunch Break'));
      expect(breakEvent.adhdMetadata.energyLevel).toBe('LOW');
      expect(breakEvent.adhdMetadata.focusType).toBe('RECOVERY');
      expect(breakEvent.adhdMetadata.breakNeeded).toBe(false);

      const meetingEvent = events.find(e => e.subject.includes('Daily Standup'));
      expect(meetingEvent.adhdMetadata.energyLevel).toBe('MEDIUM');
      expect(meetingEvent.adhdMetadata.focusType).toBe('SOCIAL');
      expect(meetingEvent.adhdMetadata.attentionRequired).toBe(true);

      // Verify duration analysis for ADHD optimization
      expect(focusEvent.adhdMetadata.isOptimalDuration).toBe(true); // 2 hours good for deep work
      expect(meetingEvent.adhdMetadata.isOptimalDuration).toBe(true); // 30 min good for standup
      expect(breakEvent.adhdMetadata.isOptimalDuration).toBe(true); // 1 hour good for recharge
    });

    it('should handle authentication and permission errors gracefully', async () => {
      // Test expired token scenario
      mockAuthService.getAccessToken.mockRejectedValueOnce(new Error('Token expired'));

      await expect(service.getCalendarEvents('test-user-id')).rejects.toThrow('Token expired');

      // Test insufficient permissions scenario
      const permissionError = new Error('Insufficient privileges to complete the operation');
      permissionError.code = 'Forbidden';

      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          query: jest.fn().mockReturnThis(),
          get: jest.fn().mockRejectedValue(permissionError),
        }),
      };

      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      jest.spyOn(service as any, 'createGraphClient').mockResolvedValue(mockGraphClient);

      await expect(service.getCalendarEvents('test-user-id')).rejects.toThrow(
        'Insufficient privileges'
      );
    });
  });

  describe('Performance and Rate Limiting', () => {
    it('should handle Microsoft Graph API rate limiting', async () => {
      const rateLimitError = new Error('Too Many Requests');
      rateLimitError.code = 'TooManyRequests';
      rateLimitError.retryAfter = 30; // seconds

      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          query: jest.fn().mockReturnThis(),
          get: jest
            .fn()
            .mockRejectedValueOnce(rateLimitError)
            .mockResolvedValueOnce({ value: mockOutlookCalendarEvents }),
        }),
      };

      jest.spyOn(service as any, 'createGraphClient').mockResolvedValue(mockGraphClient);

      // Should automatically retry after rate limit
      const result = await service.getCalendarEventsWithRetry('test-user-id');

      expect(result.calendarEvents).toHaveLength(3);
      expect(result.retryAttempts).toBe(1);
      expect(mockGraphClient.api().get).toHaveBeenCalledTimes(2);
    });

    it('should batch calendar operations for efficiency', async () => {
      const userIds = ['user1', 'user2', 'user3'];

      const mockGraphClient = {
        api: jest.fn().mockReturnValue({
          query: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ value: mockOutlookCalendarEvents }),
        }),
      };

      jest.spyOn(service as any, 'createGraphClient').mockResolvedValue(mockGraphClient);

      const result = await service.batchGetCalendarEvents(userIds);

      // Should process all users but with optimal batching
      expect(result.results).toHaveLength(3);
      expect(result.batchSize).toBeLessThanOrEqual(10); // Microsoft Graph batch limit
      expect(result.totalApiCalls).toBeLessThanOrEqual(userIds.length);
    });
  });
});
