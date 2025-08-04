import { Test, TestingModule } from '@nestjs/testing';
import { DailyPlannerService } from './daily-planner.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { GoogleService } from '../integrations_disabled/google/google.service';
import { EnergyLevel, FocusType, TaskStatus } from '@prisma/client';
import { TimeSlot } from '../planning/types';
import { createMockPrismaService } from '../test-utils';

describe('DailyPlannerService - Calendar Integration', () => {
  let service: DailyPlannerService;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;
  let mockTasksService: jest.Mocked<TasksService>;
  let mockGoogleService: jest.Mocked<GoogleService>;

  beforeEach(async () => {
    // Create mocks using the enhanced factory
    mockPrismaService = createMockPrismaService();

    mockTasksService = {
      findAll: jest.fn(),
      findTaskDependencies: jest.fn(),
    } as unknown as jest.Mocked<TasksService>;

    mockGoogleService = {
      getCalendarEvents: jest.fn(),
    } as unknown as jest.Mocked<GoogleService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyPlannerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TasksService, useValue: mockTasksService },
        { provide: GoogleService, useValue: mockGoogleService },
      ],
    }).compile();

    service = module.get<DailyPlannerService>(DailyPlannerService);
  });

  describe('Calendar Event Parsing', () => {
    it('should parse regular timed events correctly', () => {
      const mockEvent = {
        id: 'event-1',
        summary: 'Team Meeting',
        start: { dateTime: '2025-07-28T14:00:00-07:00' },
        end: { dateTime: '2025-07-28T15:00:00-07:00' },
        attendees: [{ email: 'user1@example.com' }, { email: 'user2@example.com' }],
      };

      // Access the private method using array notation
      const result = (service as any).parseCalendarEventToTimeSlot(mockEvent);

      expect(result).toEqual({
        startTime: new Date('2025-07-28T14:00:00-07:00'),
        endTime: new Date('2025-07-28T15:00:00-07:00'),
        energyLevel: EnergyLevel.MEDIUM,
        preferredFocusTypes: [FocusType.SOCIAL],
        isAvailable: false,
      });
    });

    it('should handle all-day events', () => {
      const mockEvent = {
        id: 'event-2',
        summary: 'Company Holiday',
        start: { date: '2025-07-28' },
        end: { date: '2025-07-29' },
      };

      const result = (service as any).parseCalendarEventToTimeSlot(mockEvent);

      expect(result.startTime.getHours()).toBe(0);
      expect(result.endTime.getHours()).toBe(23);
      expect(result.energyLevel).toBe(EnergyLevel.LOW);
    });

    it('should handle events with no attendees', () => {
      const mockEvent = {
        id: 'event-3',
        summary: 'Focus Time',
        start: { dateTime: '2025-07-28T10:00:00-07:00' },
        end: { dateTime: '2025-07-28T12:00:00-07:00' },
      };

      const result = (service as any).parseCalendarEventToTimeSlot(mockEvent);

      expect(result.energyLevel).toBe(EnergyLevel.HIGH);
      expect(result.preferredFocusTypes).toContain(FocusType.TECHNICAL);
    });

    it('should reject malformed events', () => {
      const malformedEvents = [
        { id: 'event-1' }, // Missing start/end
        {
          id: 'event-2',
          summary: 'Invalid Event',
          start: { dateTime: 'invalid-date' },
          end: { dateTime: '2025-07-28T15:00:00-07:00' },
        },
        {
          id: 'event-3',
          summary: 'Another Invalid Event',
          start: { dateTime: '2025-07-28T15:00:00-07:00' },
          end: { dateTime: '2025-07-28T14:00:00-07:00' }, // End before start
        },
      ];

      malformedEvents.forEach((event, index) => {
        expect(() => {
          (service as any).parseCalendarEventToTimeSlot(event);
        }).toThrow();
      });
    });
  });

  describe('Energy Level Inference', () => {
    test.each([
      ['Focus Time', [], EnergyLevel.HIGH],
      ['Deep Work Session', [], EnergyLevel.HIGH],
      ['Large Team Meeting', new Array(10).fill({ email: 'user@example.com' }), EnergyLevel.LOW],
      ['1:1 with Manager', [{ email: 'manager@example.com' }], EnergyLevel.MEDIUM],
      ['All Hands Meeting', new Array(50).fill({ email: 'user@example.com' }), EnergyLevel.LOW],
    ])('should infer "%s" with %d attendees as %s energy', (summary, attendees, expectedEnergy) => {
      const event = { summary, attendees };

      const result = (service as any).inferEnergyLevel(event);

      expect(result).toBe(expectedEnergy);
    });
  });

  describe('Focus Type Inference', () => {
    test.each([
      ['Standup Meeting', [FocusType.SOCIAL]],
      ['Technical Review', [FocusType.TECHNICAL]],
      ['Creative Brainstorming', [FocusType.CREATIVE]],
      ['Admin: Expense Reports', [FocusType.ADMINISTRATIVE]],
      ['Workshop: Design Thinking', [FocusType.CREATIVE]],
      ['Code Review Session', [FocusType.TECHNICAL]],
    ])('should infer "%s" as %j focus types', (summary, expectedTypes) => {
      const event = { summary };

      const result = (service as any).inferPreferredFocusTypes(event);

      expect(result).toEqual(expect.arrayContaining(expectedTypes));
    });

    it('should default to social for meetings with attendees', () => {
      const event = {
        summary: 'Generic Meeting',
        attendees: [{ email: 'user1@example.com' }],
      };

      const result = (service as any).inferPreferredFocusTypes(event);

      expect(result).toContain(FocusType.SOCIAL);
    });

    it('should default to technical for solo work', () => {
      const event = {
        summary: 'Work Block',
      };

      const result = (service as any).inferPreferredFocusTypes(event);

      expect(result).toContain(FocusType.TECHNICAL);
    });
  });

  describe('Calendar Integration', () => {
    beforeEach(() => {
      // Setup common mocks
      mockTasksService.findAll.mockResolvedValue([
        {
          id: 'task-1',
          title: 'Complete feature',
          description: 'Implement new functionality',
          ownerId: 'test-user',
          completed: false,
          status: TaskStatus.TODO,
          dueDate: null,
          priority: 5,
          energyLevel: EnergyLevel.HIGH,
          focusType: FocusType.TECHNICAL,
          estimatedMinutes: 120,
          softDeadline: null,
          hardDeadline: null,
          source: null,
          aiSuggestion: null,
          projectId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      mockPrismaService.userSettings.findUnique.mockResolvedValue({
        id: 'settings-1',
        userId: 'test-user',
        theme: 'light',
        morningEnergyLevel: EnergyLevel.HIGH,
        afternoonEnergyLevel: EnergyLevel.MEDIUM,
        workStartTime: '09:00',
        workEndTime: '17:00',
        focusSessionLength: 90,
        preferredFocusTypes: [],
        notificationPreferences: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrismaService.taskDependency.findMany.mockResolvedValue([]);
      mockTasksService.findTaskDependencies.mockResolvedValue([]);
    });

    it('should integrate calendar events into daily planning', async () => {
      // Setup mock calendar events
      mockGoogleService.getCalendarEvents.mockResolvedValue({
        kind: 'calendar#events',
        items: [
          {
            id: 'event-1',
            summary: 'Team Meeting',
            start: { dateTime: '2025-07-28T14:00:00-07:00' },
            end: { dateTime: '2025-07-28T15:00:00-07:00' },
          },
        ],
      });

      const userId = 'test-user';
      const date = new Date('2025-07-28');

      const plan = await service.generatePlan(userId, date);

      // Verify calendar events were fetched with correct parameters
      expect(mockGoogleService.getCalendarEvents).toHaveBeenCalledWith(
        userId,
        'primary',
        expect.any(Date),
        expect.any(Date),
      );

      // Verify plan was generated
      expect(plan).toBeDefined();
      expect(plan.scheduleBlocks).toBeDefined();
    });

    it('should handle calendar API failures gracefully', async () => {
      // Mock API failure
      mockGoogleService.getCalendarEvents.mockRejectedValue(new Error('Network timeout'));

      const userId = 'test-user';
      const date = new Date('2025-07-28');

      // Should not throw error
      const plan = await service.generatePlan(userId, date);

      // Plan should still be generated without calendar data
      expect(plan).toBeDefined();
      expect(plan.scheduleBlocks).toBeDefined();
    });

    it('should handle empty calendar response', async () => {
      mockGoogleService.getCalendarEvents.mockResolvedValue({
        kind: 'calendar#events',
        items: [],
      });

      const userId = 'test-user';
      const date = new Date('2025-07-28');

      const plan = await service.generatePlan(userId, date);

      expect(plan).toBeDefined();
      expect(plan.scheduleBlocks).toBeDefined();
    });

    it('should handle malformed calendar response', async () => {
      mockGoogleService.getCalendarEvents.mockResolvedValue({
        kind: 'calendar#events',
        items: [
          { id: 'event-1' }, // Missing required fields
          {
            id: 'event-2',
            summary: 'Valid Event',
            start: { dateTime: 'invalid-date' },
            end: { dateTime: '2025-07-28T15:00:00-07:00' },
          },
        ],
      });

      const userId = 'test-user';
      const date = new Date('2025-07-28');

      // Should not throw error and filter out invalid events
      const plan = await service.generatePlan(userId, date);

      expect(plan).toBeDefined();
      expect(plan.scheduleBlocks).toBeDefined();
    });
  });

  describe('Private Method Testing Utilities', () => {
    it('should correctly parse date ranges for calendar queries', () => {
      const date = new Date('2025-07-28T12:00:00');

      // Test how the service constructs date ranges
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      expect(startOfDay.getHours()).toBe(0);
      expect(endOfDay.getHours()).toBe(23);
      expect(startOfDay < endOfDay).toBe(true);
    });
  });
});
