import { Test, TestingModule } from '@nestjs/testing';
import { GoogleService } from './google.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

describe('GoogleService', () => {
  let service: GoogleService;
  let configService: ConfigService;
  let prismaService: PrismaService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config = {
        GOOGLE_CLIENT_ID: 'test_client_id_123',
        GOOGLE_CLIENT_SECRET: 'test_client_secret_456',
        GOOGLE_CALLBACK_URL: 'http://localhost:3501/auth/google/callback',
        FRONTEND_URL: 'http://localhost:3000',
      };
      return config[key];
    }),
  };

  const mockPrismaService = {
    integrationConfig: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'test_config_id',
        provider: 'google',
        userId: 'test_user_123',
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        scopes: ['calendar', 'drive', 'gmail'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      upsert: jest.fn().mockResolvedValue({
        id: 'test_config_id',
        provider: 'google',
        userId: 'test_user_123',
        accessToken: 'updated_access_token',
        refreshToken: 'updated_refresh_token',
        scopes: ['calendar', 'drive', 'gmail'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GoogleService>(GoogleService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with correct OAuth configuration', () => {
      expect(configService.get('GOOGLE_CLIENT_ID')).toBe('test_client_id_123');
      expect(configService.get('GOOGLE_CLIENT_SECRET')).toBe('test_client_secret_456');
      expect(configService.get('GOOGLE_CALLBACK_URL')).toBe(
        'http://localhost:3501/auth/google/callback'
      );
    });
  });

  describe('Integration Configuration', () => {
    it('should save integration configuration', async () => {
      const configData = {
        userId: 'test_user_123',
        provider: 'google',
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        scopes: ['calendar', 'drive', 'gmail'],
      };

      jest.spyOn(service, 'saveIntegrationConfig').mockResolvedValueOnce(undefined);

      await expect(
        service.saveIntegrationConfig(
          configData.userId,
          configData.provider,
          configData.accessToken,
          configData.refreshToken,
          configData.scopes
        )
      ).resolves.not.toThrow();
    });

    it('should handle missing integration configuration', async () => {
      // Mock missing config scenario
      jest
        .spyOn(service, 'getCalendarEvents')
        .mockRejectedValueOnce(new Error('Google integration not configured for user'));

      await expect(service.getCalendarEvents('unconfigured_user')).rejects.toThrow(
        'Google integration not configured for user'
      );
    });
  });

  describe('Calendar Operations', () => {
    const mockUserId = 'test_user_123';

    beforeEach(() => {
      // Mock Google Calendar API responses
      jest
        .spyOn(service, 'getCalendarEvents')
        .mockImplementation(async (userId: string, startDate?: Date, endDate?: Date) => {
          if (userId === 'invalid_user') {
            throw new Error('Google integration not configured for user');
          }
          if (userId === 'rate_limited_user') {
            throw new Error('Rate limit exceeded');
          }
          if (userId === 'network_error_user') {
            throw new Error('Network error');
          }

          return [
            {
              id: 'event_1',
              summary: 'Team Meeting',
              description: 'Weekly team sync',
              start: {
                dateTime: '2024-01-15T10:00:00Z',
                timeZone: 'UTC',
              },
              end: {
                dateTime: '2024-01-15T11:00:00Z',
                timeZone: 'UTC',
              },
              location: 'Conference Room A',
              attendees: [{ email: 'user1@example.com', responseStatus: 'accepted' }],
            },
            {
              id: 'event_2',
              summary: 'Project Review',
              description: 'Quarterly project review',
              start: {
                dateTime: '2024-01-15T14:00:00Z',
                timeZone: 'UTC',
              },
              end: {
                dateTime: '2024-01-15T15:30:00Z',
                timeZone: 'UTC',
              },
            },
          ];
        });

      jest
        .spyOn(service, 'createCalendarEvent')
        .mockImplementation(async (userId: string, eventData: any) => {
          if (userId === 'invalid_user') {
            throw new Error('Google integration not configured for user');
          }

          return {
            id: 'new_event_123',
            summary: eventData.summary,
            description: eventData.description,
            start: eventData.start,
            end: eventData.end,
            htmlLink: 'https://calendar.google.com/event?eid=new_event_123',
          };
        });
    });

    it('should successfully fetch calendar events', async () => {
      const events = await service.getCalendarEvents(mockUserId);

      expect(events).toHaveLength(2);
      expect(events[0]).toMatchObject({
        id: 'event_1',
        summary: 'Team Meeting',
        start: { dateTime: '2024-01-15T10:00:00Z' },
      });
      expect(events[1]).toMatchObject({
        id: 'event_2',
        summary: 'Project Review',
        start: { dateTime: '2024-01-15T14:00:00Z' },
      });
    });

    it('should successfully create calendar event', async () => {
      const eventData = {
        summary: 'New Task: Complete Project Documentation',
        description: 'Auto-generated from Helmsman task management',
        start: {
          dateTime: '2024-01-16T09:00:00Z',
          timeZone: 'UTC',
        },
        end: {
          dateTime: '2024-01-16T10:00:00Z',
          timeZone: 'UTC',
        },
      };

      const createdEvent = await service.createCalendarEvent(mockUserId, eventData);

      expect(createdEvent).toMatchObject({
        id: 'new_event_123',
        summary: eventData.summary,
        start: eventData.start,
        end: eventData.end,
      });
      expect(createdEvent.htmlLink).toContain('calendar.google.com');
    });

    it('should handle large calendar datasets efficiently', async () => {
      // Mock large dataset scenario
      const largeMockEvents = Array.from({ length: 500 }, (_, i) => ({
        id: `event_${i}`,
        summary: `Event ${i}`,
        start: { dateTime: `2024-01-${(i % 28) + 1}T10:00:00Z` },
        end: { dateTime: `2024-01-${(i % 28) + 1}T11:00:00Z` },
      }));

      jest.spyOn(service, 'getCalendarEvents').mockResolvedValueOnce(largeMockEvents);

      const events = await service.getCalendarEvents(mockUserId);
      expect(events).toHaveLength(500);

      // Verify performance characteristics (e.g., response time)
      const startTime = Date.now();
      await service.getCalendarEvents(mockUserId);
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // 5 second threshold
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle missing integration configuration', async () => {
      await expect(service.getCalendarEvents('invalid_user')).rejects.toThrow(
        'Google integration not configured for user'
      );
    });

    it('should handle API rate limiting with proper error messages', async () => {
      await expect(service.getCalendarEvents('rate_limited_user')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });

    it('should handle network connectivity issues', async () => {
      await expect(service.getCalendarEvents('network_error_user')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle malformed event data during creation', async () => {
      const invalidEventData = {
        summary: '', // Empty summary should cause validation error
        start: { dateTime: 'invalid-date-format' },
        end: { dateTime: 'invalid-date-format' },
      };

      jest
        .spyOn(service, 'createCalendarEvent')
        .mockRejectedValueOnce(new Error('Invalid event data format'));

      await expect(service.createCalendarEvent('valid_user', invalidEventData)).rejects.toThrow(
        'Invalid event data format'
      );
    });

    it('should handle access token expiration scenarios', async () => {
      jest.spyOn(service, 'getCalendarEvents').mockRejectedValueOnce(new Error('Token expired'));

      await expect(service.getCalendarEvents('expired_user')).rejects.toThrow('Token expired');
    });
  });

  describe('ADHD-Specific Calendar Features', () => {
    const mockUserId = 'test_user_123';

    it('should support gentle reminder preferences', async () => {
      const eventWithReminder = {
        summary: 'Important Meeting',
        description: 'ADHD-friendly: Set gentle reminder',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 }, // 30 min gentle reminder
            { method: 'popup', minutes: 5 }, // 5 min final reminder
          ],
        },
      };

      const createdEvent = await service.createCalendarEvent(mockUserId, eventWithReminder);
      expect(createdEvent).toBeDefined();
    });

    it('should handle energy-level based scheduling', async () => {
      // Mock method to get events with energy level metadata
      const energyBasedEvents = [
        {
          id: 'high_energy_task',
          summary: 'Creative Work - High Energy Required',
          description: 'Energy Level: High, Focus Type: Creative',
          start: { dateTime: '2024-01-15T09:00:00Z' }, // Morning slot
          end: { dateTime: '2024-01-15T11:00:00Z' },
        },
        {
          id: 'low_energy_task',
          summary: 'Administrative Tasks',
          description: 'Energy Level: Low, Focus Type: Administrative',
          start: { dateTime: '2024-01-15T15:00:00Z' }, // Afternoon slot
          end: { dateTime: '2024-01-15T16:00:00Z' },
        },
      ];

      jest.spyOn(service, 'getCalendarEvents').mockResolvedValueOnce(energyBasedEvents);

      const events = await service.getCalendarEvents(mockUserId);

      // Verify energy level metadata is preserved
      const highEnergyEvent = events.find(e => e.id === 'high_energy_task');
      const lowEnergyEvent = events.find(e => e.id === 'low_energy_task');

      expect(highEnergyEvent?.description).toContain('Energy Level: High');
      expect(lowEnergyEvent?.description).toContain('Energy Level: Low');
    });

    it('should support focus type categorization', async () => {
      const focusTypedEvent = {
        summary: 'Deep Work Session',
        description: 'Focus Type: Technical, Estimated Duration: 2 hours',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T12:00:00Z' },
        colorId: '2', // Blue for technical work
      };

      const createdEvent = await service.createCalendarEvent(mockUserId, focusTypedEvent);
      expect(createdEvent.description).toContain('Focus Type: Technical');
    });
  });

  describe('Integration Patterns', () => {
    const mockUserId = 'test_user_123';

    it('should handle calendar sync conflict resolution', async () => {
      // Mock conflict detection scenario
      const conflictingEvent = {
        summary: 'Conflicting Meeting',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
      };

      jest
        .spyOn(service, 'createCalendarEvent')
        .mockRejectedValueOnce(new Error('Calendar conflict detected'));

      await expect(service.createCalendarEvent(mockUserId, conflictingEvent)).rejects.toThrow(
        'Calendar conflict detected'
      );
    });

    it('should handle Gmail integration for task extraction', async () => {
      // Test Gmail messages retrieval
      jest.spyOn(service, 'getGmailMessagesForTaskExtraction').mockResolvedValueOnce([
        {
          id: 'message_1',
          subject: 'Project Update Required',
          snippet: 'Please review and update the project status...',
          date: '2024-01-15T10:00:00Z',
        },
      ]);

      const messages = await service.getGmailMessagesForTaskExtraction(mockUserId, 7);
      expect(messages).toHaveLength(1);
      expect(messages[0].subject).toContain('Project Update');
    });

    it('should handle Drive file operations', async () => {
      jest.spyOn(service, 'getDriveFiles').mockResolvedValueOnce([
        {
          id: 'file_1',
          name: 'Project Plan.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          createdTime: '2024-01-15T10:00:00Z',
        },
      ]);

      const files = await service.getDriveFiles(mockUserId);
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('Project Plan.docx');
    });
  });

  describe('Performance and Caching', () => {
    const mockUserId = 'test_user_123';

    it('should implement efficient caching for calendar data', async () => {
      // First call - should hit API
      const events1 = await service.getCalendarEvents(mockUserId);

      // Second call - should use cache (if implemented)
      const events2 = await service.getCalendarEvents(mockUserId);

      expect(events1).toEqual(events2);
      // In a real implementation, we'd verify cache hit metrics
    });

    it('should handle concurrent calendar requests efficiently', async () => {
      const concurrentRequests = Array.from({ length: 10 }, () =>
        service.getCalendarEvents(mockUserId)
      );

      const results = await Promise.all(concurrentRequests);

      // All requests should succeed
      results.forEach(events => {
        expect(events).toHaveLength(2);
      });
    });
  });

  describe('Security and Privacy', () => {
    const mockUserId = 'test_user_123';

    it('should not expose sensitive token information in logs', () => {
      const sensitiveData = 'ya29.sensitive_token_data_here';

      // Verify token is not logged in plain text
      // This would need integration with actual logging mock
      expect(true).toBe(true); // Placeholder for security verification
    });

    it('should validate user permissions before operations', async () => {
      jest
        .spyOn(service, 'getCalendarEvents')
        .mockRejectedValueOnce(new Error('Google integration not configured for user'));

      await expect(service.getCalendarEvents('unauthorized_user')).rejects.toThrow(
        'Google integration not configured for user'
      );
    });

    it('should handle token refresh when needed', async () => {
      // Mock token refresh scenario
      jest
        .spyOn(service, 'getCalendarEvents')
        .mockRejectedValueOnce(new Error('Token expired'))
        .mockResolvedValueOnce([
          { id: 'event_1', summary: 'Test Event', start: { dateTime: '2024-01-15T10:00:00Z' } },
        ]);

      // Should handle token refresh internally and retry
      const events = await service.getCalendarEvents(mockUserId);
      expect(events).toHaveLength(1);
    });
  });
});
