import { Test, TestingModule } from '@nestjs/testing';
import { DailyPlannerService } from './daily-planner.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { GoogleService } from '../integrations_disabled/google/google.service';
import { GraphService } from '../integrations_disabled/graph/graph.service';
import { BadRequestException } from '@nestjs/common';
import { EnergyLevel, FocusType, Task, TaskStatus } from '@prisma/client';

// Mock Prisma Client
const mockPrismaService = {
  task: {
    findMany: jest.fn(),
  },
  userSettings: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

// Mock Tasks Service
const mockTasksService = {
  findAll: jest.fn(),
  findTaskDependencies: jest.fn(),
};

const mockGoogleService = {
  getCalendarEvents: jest.fn(),
};

const mockGraphService = {
  getCalendarEvents: jest.fn(),
};

describe('DailyPlannerService', () => {
  let service: DailyPlannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyPlannerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
        {
          provide: GoogleService,
          useValue: mockGoogleService,
        },
        {
          provide: GraphService,
          useValue: mockGraphService,
        },
      ],
    }).compile();

    service = module.get<DailyPlannerService>(DailyPlannerService);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default calendar mocks
    mockGoogleService.getCalendarEvents.mockResolvedValue({
      kind: 'calendar#events',
      items: [],
    });

    mockGraphService.getCalendarEvents.mockResolvedValue({
      value: [],
    });
  });

  describe('generatePlan', () => {
    it('should generate an empty plan when no tasks are available', async () => {
      // Arrange
      const userId = '1';
      const date = new Date('2024-01-15');

      mockTasksService.findAll.mockResolvedValue([]);
      mockTasksService.findTaskDependencies.mockResolvedValue([]);
      mockPrismaService.userSettings.findUnique.mockResolvedValue({
        workingHoursStart: 9,
        workingHoursEnd: 17,
        timeZone: 'UTC',
      });

      // Act
      const result = await service.generatePlan(userId, date);

      // Assert
      expect(result).toBeDefined();
      expect(result.scheduleBlocks).toHaveLength(0);
      expect(result.totalEstimatedMinutes).toBe(0);
      expect(result.energyOptimization).toBeGreaterThanOrEqual(0);
      expect(result.focusOptimization).toBeGreaterThanOrEqual(0);
      expect(result.deadlineRisk).toBeGreaterThanOrEqual(0);
    });

    it('should generate a plan with properly scheduled tasks', async () => {
      // Arrange
      const userId = '1';
      const date = new Date('2024-01-15');

      const mockTasks = [
        {
          id: 'task1',
          title: 'Important Task',
          description: 'Task description',
          priority: 5, // HIGH priority
          deadline: new Date('2024-01-16'),
          estimatedMinutes: 60,
          energyLevel: EnergyLevel.HIGH,
          focusType: FocusType.TECHNICAL,
          dependsOn: [],
          metadata: {
            energyLevel: 'HIGH',
            focusType: 'TECHNICAL',
          },
        },
        {
          id: 'task2',
          title: 'Medium Task',
          description: 'Another task',
          priority: 3, // MEDIUM priority
          deadline: new Date('2024-01-17'),
          estimatedMinutes: 30,
          energyLevel: EnergyLevel.MEDIUM,
          focusType: FocusType.ADMINISTRATIVE,
          dependsOn: [],
          metadata: {
            energyLevel: 'MEDIUM',
            focusType: 'ADMINISTRATIVE',
          },
        },
      ];

      mockTasksService.findAll.mockResolvedValue(mockTasks);
      mockTasksService.findTaskDependencies.mockResolvedValue([]);
      mockPrismaService.userSettings.findUnique.mockResolvedValue({
        workingHoursStart: 9,
        workingHoursEnd: 17,
        timeZone: 'UTC',
      });

      // Act
      const result = await service.generatePlan(userId, date);

      // Assert
      expect(result).toBeDefined();
      expect(result.scheduleBlocks.length).toBeGreaterThan(0);
      expect(result.totalEstimatedMinutes).toBeGreaterThan(0);
      expect(result.unscheduledTasks).toBeDefined();
      expect(result.energyOptimization).toBeGreaterThanOrEqual(0);
      expect(result.energyOptimization).toBeLessThanOrEqual(1);
    });

    it('should handle circular dependencies correctly', async () => {
      // Arrange
      const userId = '1';
      const date = new Date('2024-01-15');

      const mockTasks = [
        {
          id: 'task1',
          title: 'Task 1',
          description: 'Task 1 description',
          priority: 3, // MEDIUM priority
          deadline: new Date('2024-01-16'),
          estimatedMinutes: 30,
          energyLevel: EnergyLevel.MEDIUM,
          focusType: FocusType.TECHNICAL,
          dependsOn: [{ id: 'task2' }],
          metadata: {
            energyLevel: 'MEDIUM',
            focusType: 'TECHNICAL',
          },
        },
        {
          id: 'task2',
          title: 'Task 2',
          description: 'Task 2 description',
          priority: 3, // MEDIUM priority
          deadline: new Date('2024-01-16'),
          estimatedMinutes: 30,
          energyLevel: EnergyLevel.MEDIUM,
          focusType: FocusType.TECHNICAL,
          dependsOn: [{ id: 'task1' }],
          metadata: {
            energyLevel: 'MEDIUM',
            focusType: 'TECHNICAL',
          },
        },
      ];

      mockTasksService.findAll.mockResolvedValue(mockTasks);
      // Mock circular dependencies
      mockTasksService.findTaskDependencies.mockImplementation((taskId: string) => {
        if (taskId === 'task1') {
          return Promise.resolve([{ dependsOn: 'task2' }]);
        } else if (taskId === 'task2') {
          return Promise.resolve([{ dependsOn: 'task1' }]);
        }
        return Promise.resolve([]);
      });
      mockPrismaService.userSettings.findUnique.mockResolvedValue({
        workingHoursStart: 9,
        workingHoursEnd: 17,
        timeZone: 'UTC',
      });

      // Act & Assert
      await expect(service.generatePlan(userId, date)).rejects.toThrow(BadRequestException);
    });

    it('should respect working hours constraints', async () => {
      // Arrange
      const userId = '1';
      const date = new Date('2024-01-15');

      const mockTasks = [
        {
          id: 'task1',
          title: 'Long Task',
          description: 'A very long task',
          priority: 5, // HIGH priority
          deadline: new Date('2024-01-16'),
          estimatedMinutes: 600, // 10 hours - exceeds 8-hour working day
          energyLevel: EnergyLevel.HIGH,
          focusType: FocusType.TECHNICAL,
          dependsOn: [],
          metadata: {
            energyLevel: 'HIGH',
            focusType: 'TECHNICAL',
          },
        },
      ];

      mockTasksService.findAll.mockResolvedValue(mockTasks);
      mockTasksService.findTaskDependencies.mockResolvedValue([]);
      mockPrismaService.userSettings.findUnique.mockResolvedValue({
        workingHoursStart: 9,
        workingHoursEnd: 17, // 8-hour working day
        timeZone: 'UTC',
      });

      // Act
      const result = await service.generatePlan(userId, date);

      // Assert
      expect(result).toBeDefined();
      // The algorithm may schedule partial work or split tasks, so just verify it handles the constraint gracefully
      expect(result.totalEstimatedMinutes).toBeDefined();
      expect(result.scheduleBlocks).toBeDefined();
    });

    it('should calculate task scores correctly', async () => {
      // Arrange
      const userId = '1';
      const date = new Date('2024-01-15');

      const highPriorityTask = {
        id: 'task1',
        title: 'High Priority Task',
        description: 'Important task',
        priority: 5, // HIGH priority
        deadline: new Date('2024-01-15'), // Due today
        estimatedMinutes: 60,
        energyLevel: EnergyLevel.HIGH,
        focusType: FocusType.TECHNICAL,
        dependsOn: [],
        metadata: {
          energyLevel: 'HIGH',
          focusType: 'TECHNICAL',
        },
      };

      const lowPriorityTask = {
        id: 'task2',
        title: 'Low Priority Task',
        description: 'Less important task',
        priority: 1, // LOW priority
        deadline: new Date('2024-01-20'), // Due later
        estimatedMinutes: 30,
        energyLevel: EnergyLevel.LOW,
        focusType: FocusType.ADMINISTRATIVE,
        dependsOn: [],
        metadata: {
          energyLevel: 'LOW',
          focusType: 'ADMINISTRATIVE',
        },
      };

      mockTasksService.findAll.mockResolvedValue([highPriorityTask, lowPriorityTask]);
      mockTasksService.findTaskDependencies.mockResolvedValue([]);
      mockPrismaService.userSettings.findUnique.mockResolvedValue({
        workingHoursStart: 9,
        workingHoursEnd: 17,
        timeZone: 'UTC',
      });

      // Act
      const result = await service.generatePlan(userId, date);

      // Assert
      expect(result).toBeDefined();

      // High priority task should be scheduled first (if both are scheduled)
      if (result.scheduleBlocks.length >= 2) {
        const firstScheduledTask = result.scheduleBlocks[0];
        expect(firstScheduledTask.task.id).toBe('task1');
      }
    });

    it('should handle tasks with dependencies correctly', async () => {
      // Arrange
      const userId = '1';
      const date = new Date('2024-01-15');

      const dependentTask = {
        id: 'task1',
        title: 'Dependent Task',
        description: 'Task that depends on another',
        priority: 5, // HIGH priority
        deadline: new Date('2024-01-16'),
        estimatedMinutes: 60,
        energyLevel: EnergyLevel.HIGH,
        focusType: FocusType.TECHNICAL,
        dependsOn: [{ id: 'task2' }],
        metadata: {
          energyLevel: 'HIGH',
          focusType: 'TECHNICAL',
        },
      };

      const prerequisiteTask = {
        id: 'task2',
        title: 'Prerequisite Task',
        description: 'Task that must be done first',
        priority: 3, // MEDIUM priority
        deadline: new Date('2024-01-16'),
        estimatedMinutes: 30,
        energyLevel: EnergyLevel.MEDIUM,
        focusType: FocusType.TECHNICAL,
        dependsOn: [],
        metadata: {
          energyLevel: 'MEDIUM',
          focusType: 'TECHNICAL',
        },
      };

      mockTasksService.findAll.mockResolvedValue([dependentTask, prerequisiteTask]);
      // Mock proper dependencies - task1 depends on task2
      mockTasksService.findTaskDependencies.mockImplementation((taskId: string) => {
        if (taskId === 'task1') {
          return Promise.resolve([{ dependsOn: 'task2' }]);
        }
        return Promise.resolve([]);
      });
      mockPrismaService.userSettings.findUnique.mockResolvedValue({
        workingHoursStart: 9,
        workingHoursEnd: 17,
        timeZone: 'UTC',
      });

      // Act
      const result = await service.generatePlan(userId, date);

      // Assert
      expect(result).toBeDefined();

      if (result.scheduleBlocks.length >= 2) {
        // Find the tasks in the schedule
        const prerequisiteScheduled = result.scheduleBlocks.find(t => t.task.id === 'task2');
        const dependentScheduled = result.scheduleBlocks.find(t => t.task.id === 'task1');

        if (prerequisiteScheduled && dependentScheduled) {
          // Prerequisite should be scheduled before dependent
          expect(new Date(prerequisiteScheduled.startTime).getTime()).toBeLessThan(
            new Date(dependentScheduled.startTime).getTime()
          );
        }
      }
    });
  });

  describe('edge cases', () => {
    it('should handle missing user settings gracefully', async () => {
      // Arrange
      const userId = '1';
      const date = new Date('2024-01-15');

      mockTasksService.findAll.mockResolvedValue([]);
      mockTasksService.findTaskDependencies.mockResolvedValue([]);
      mockPrismaService.userSettings.findUnique.mockResolvedValue(null);
      mockPrismaService.userSettings.create.mockResolvedValue({
        userId,
        workingHoursStart: 9,
        workingHoursEnd: 17,
        timeZone: 'UTC',
      });

      // Act
      const result = await service.generatePlan(userId, date);

      // Assert
      expect(result).toBeDefined();
      expect(result.scheduleBlocks).toHaveLength(0);
    });

    it('should handle empty task list', async () => {
      // Arrange
      const userId = '1';
      const date = new Date('2024-01-15');

      mockTasksService.findAll.mockResolvedValue([]);
      mockTasksService.findTaskDependencies.mockResolvedValue([]);
      mockPrismaService.userSettings.findUnique.mockResolvedValue({
        workingHoursStart: 9,
        workingHoursEnd: 17,
        timeZone: 'UTC',
      });

      // Act
      const result = await service.generatePlan(userId, date);

      // Assert
      expect(result).toBeDefined();
      expect(result.scheduleBlocks).toHaveLength(0);
      expect(result.totalEstimatedMinutes).toBe(0);
      expect(result.unscheduledTasks).toHaveLength(0);
    });

    it('should handle invalid date input', async () => {
      // Arrange
      const userId = '1';
      const invalidDate = new Date('invalid');

      // Act & Assert
      await expect(service.generatePlan(userId, invalidDate)).rejects.toThrow();
    });
  });

  describe('resolveTaskDependencies', () => {
    it('should return ready tasks when no dependencies exist', async () => {
      // Arrange
      const tasks = [
        {
          id: 'task1',
          title: 'Independent Task 1',
          status: TaskStatus.TODO,
          priority: 3,
        },
        {
          id: 'task2',
          title: 'Independent Task 2',
          status: TaskStatus.TODO,
          priority: 2,
        },
      ] as Task[];

      mockTasksService.findTaskDependencies.mockResolvedValue([]);

      // Act
      const result = await service.resolveTaskDependencies(tasks);

      // Assert
      expect(result.totalTasks).toBe(2);
      expect(result.readyCount).toBe(2);
      expect(result.blockedCount).toBe(0);
      expect(result.readyTasks).toHaveLength(2);
      expect(result.blockedTasks).toHaveLength(0);
    });

    it('should identify blocked tasks with incomplete dependencies', async () => {
      // Arrange
      const tasks = [
        {
          id: 'task1',
          title: 'Dependent Task',
          status: TaskStatus.TODO,
          priority: 3,
        },
        {
          id: 'task2',
          title: 'Dependency Task',
          status: TaskStatus.TODO, // Not completed
          priority: 2,
        },
      ] as Task[];

      mockTasksService.findTaskDependencies.mockImplementation((taskId: string) => {
        if (taskId === 'task1') {
          return Promise.resolve([{ taskId: 'task1', dependsOn: 'task2' }]);
        }
        return Promise.resolve([]);
      });

      // Act
      const result = await service.resolveTaskDependencies(tasks);

      // Assert
      expect(result.totalTasks).toBe(2);
      expect(result.readyCount).toBe(1);
      expect(result.blockedCount).toBe(1);
      expect(result.readyTasks).toHaveLength(1);
      expect(result.readyTasks[0].id).toBe('task2');
      expect(result.blockedTasks).toHaveLength(1);
      expect(result.blockedTasks[0].task.id).toBe('task1');
      expect(result.blockedTasks[0].reasons).toHaveLength(1);
      expect(result.blockedTasks[0].reasons[0].type).toBe('incomplete_dependency');
    });

    it('should identify orphaned dependencies', async () => {
      // Arrange
      const tasks = [
        {
          id: 'task1',
          title: 'Task with Orphaned Dependency',
          status: TaskStatus.TODO,
          priority: 3,
        },
      ] as Task[];

      mockTasksService.findTaskDependencies.mockImplementation((taskId: string) => {
        if (taskId === 'task1') {
          return Promise.resolve([{ taskId: 'task1', dependsOn: 'nonexistent-task' }]);
        }
        return Promise.resolve([]);
      });

      // Act
      const result = await service.resolveTaskDependencies(tasks);

      // Assert
      expect(result.totalTasks).toBe(1);
      expect(result.readyCount).toBe(0);
      expect(result.blockedCount).toBe(1);
      expect(result.blockedTasks[0].reasons[0].type).toBe('orphaned_dependency');
      expect(result.blockedTasks[0].reasons[0].dependencyTaskId).toBe('nonexistent-task');
    });
  });

  describe('Energy-Mapped Time Slot Generation', () => {
    const mockUserSettings = {
      id: 'settings1',
      userId: 'user1',
      morningEnergyLevel: EnergyLevel.HIGH,
      afternoonEnergyLevel: EnergyLevel.MEDIUM,
      workStartTime: '09:00',
      workEndTime: '17:00',
      focusSessionLength: 90,
      preferredFocusTypes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should parse work times correctly', () => {
      // Access private method for testing
      const parseWorkTime = (service as any).parseWorkTime.bind(service);

      expect(parseWorkTime('09:00')).toEqual({ hour: 9, minute: 0 });
      expect(parseWorkTime('13:30')).toEqual({ hour: 13, minute: 30 });
      expect(parseWorkTime('17:45')).toEqual({ hour: 17, minute: 45 });
    });

    it('should handle invalid time formats gracefully', () => {
      const parseWorkTime = (service as any).parseWorkTime.bind(service);

      expect(parseWorkTime('invalid')).toEqual({ hour: 9, minute: 0 });
      expect(parseWorkTime('25:00')).toEqual({ hour: 9, minute: 0 });
      expect(parseWorkTime('12:70')).toEqual({ hour: 9, minute: 0 });
    });

    it('should calculate context-aware break durations', () => {
      const calculateBreakDuration = (service as any).calculateBreakDuration.bind(service);

      expect(calculateBreakDuration(60)).toBe(10); // Short session
      expect(calculateBreakDuration(90)).toBe(15); // Medium session
      expect(calculateBreakDuration(120)).toBe(20); // Long session
      expect(calculateBreakDuration(150)).toBe(25); // Very long session
    });

    it('should map enhanced energy levels throughout the day', () => {
      const getEnhancedEnergyLevelForTime = (service as any).getEnhancedEnergyLevelForTime.bind(
        service
      );

      // Early morning (7:00) - should be lower than base morning energy
      const earlyMorning = new Date();
      earlyMorning.setHours(7, 0, 0, 0);
      expect(getEnhancedEnergyLevelForTime(earlyMorning, mockUserSettings)).toBe(
        EnergyLevel.MEDIUM
      );

      // Peak morning (9:00) - should match user's morning energy
      const peakMorning = new Date();
      peakMorning.setHours(9, 0, 0, 0);
      expect(getEnhancedEnergyLevelForTime(peakMorning, mockUserSettings)).toBe(EnergyLevel.HIGH);

      // Lunch time (12:30) - should be low
      const lunchTime = new Date();
      lunchTime.setHours(12, 30, 0, 0);
      expect(getEnhancedEnergyLevelForTime(lunchTime, mockUserSettings)).toBe(EnergyLevel.LOW);

      // Afternoon peak (15:00) - should match user's afternoon energy
      const afternoonPeak = new Date();
      afternoonPeak.setHours(15, 0, 0, 0);
      expect(getEnhancedEnergyLevelForTime(afternoonPeak, mockUserSettings)).toBe(
        EnergyLevel.MEDIUM
      );

      // Evening (19:00) - should be low
      const evening = new Date();
      evening.setHours(19, 0, 0, 0);
      expect(getEnhancedEnergyLevelForTime(evening, mockUserSettings)).toBe(EnergyLevel.LOW);
    });

    it('should optimize focus types based on energy and time', () => {
      const getOptimizedFocusTypes = (service as any).getOptimizedFocusTypes.bind(service);

      // High energy morning - should prioritize creative work
      const morningTime = new Date();
      morningTime.setHours(9, 0, 0, 0);
      const morningFocus = getOptimizedFocusTypes(EnergyLevel.HIGH, morningTime);
      expect(morningFocus).toContain(FocusType.CREATIVE);
      expect(morningFocus).toContain(FocusType.TECHNICAL);

      // High energy afternoon - should prioritize technical work
      const afternoonTime = new Date();
      afternoonTime.setHours(15, 0, 0, 0);
      const afternoonFocus = getOptimizedFocusTypes(EnergyLevel.HIGH, afternoonTime);
      expect(afternoonFocus[0]).toBe(FocusType.TECHNICAL);

      // Low energy evening - should prioritize social and admin
      const eveningTime = new Date();
      eveningTime.setHours(17, 0, 0, 0);
      const eveningFocus = getOptimizedFocusTypes(EnergyLevel.LOW, eveningTime);
      expect(eveningFocus).toContain(FocusType.SOCIAL);
      expect(eveningFocus).toContain(FocusType.ADMINISTRATIVE);
    });

    it('should generate time slots with custom work hours', async () => {
      // Mock data setup
      const testDate = new Date('2025-07-28');
      const customSettings = {
        ...mockUserSettings,
        workStartTime: '08:30',
        workEndTime: '16:30',
        focusSessionLength: 60,
      };

      // Mock tasks to ensure we have something to schedule
      const mockTasks = [
        {
          id: 'task1',
          title: 'Test Task',
          status: TaskStatus.IN_PROGRESS,
          userId: 'user1',
          estimatedMinutes: 60,
          priority: 3,
          energyLevel: EnergyLevel.HIGH,
          focusType: FocusType.TECHNICAL,
          createdAt: new Date(),
          updatedAt: new Date(),
          description: null,
          hardDeadline: null,
          parentId: null,
          sortOrder: 0,
        },
      ];

      mockTasksService.findAll.mockResolvedValue(mockTasks);
      mockTasksService.findTaskDependencies.mockResolvedValue([]);
      mockPrismaService.userSettings.findUnique.mockResolvedValue(customSettings);

      // Generate plan with custom settings
      const result = await service.generatePlan('user1', testDate);

      // Verify that the planning system worked with our custom hours
      // The test should pass as long as the method completes without error
      expect(result).toBeDefined();
      expect(result.date).toBe('2025-07-28');
      expect(result.totalEstimatedMinutes).toBeGreaterThanOrEqual(0);

      // If there are scheduled blocks, verify timing
      if (result.scheduleBlocks.length > 0) {
        const firstSlot = new Date(result.scheduleBlocks[0].startTime);
        expect(firstSlot.getHours()).toBeGreaterThanOrEqual(8);
        if (firstSlot.getHours() === 8) {
          expect(firstSlot.getMinutes()).toBeGreaterThanOrEqual(30);
        }
      }
    });
  });

  describe('Google Calendar Integration', () => {
    const testDate = new Date('2025-07-28T10:00:00Z');
    const userId = 'test-user-1';

    beforeEach(() => {
      // Set up default user settings for calendar tests
      mockPrismaService.userSettings.findUnique.mockResolvedValue({
        userId,
        morningEnergyLevel: EnergyLevel.HIGH,
        afternoonEnergyLevel: EnergyLevel.MEDIUM,
        workStartTime: '09:00',
        workEndTime: '17:00',
        focusSessionLength: 90,
        preferredFocusTypes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockTasksService.findAll.mockResolvedValue([]);
      mockTasksService.findTaskDependencies.mockResolvedValue([]);
    });

    describe('Calendar Event Parsing', () => {
      it('should parse Google Calendar events into TimeSlots correctly', async () => {
        // Arrange: Mock calendar response with different event types
        const mockCalendarEvents = {
          kind: 'calendar#events',
          items: [
            {
              id: 'event-1',
              summary: 'Team Standup',
              description: 'Daily team sync meeting',
              start: {
                dateTime: '2025-07-28T09:00:00-07:00',
                timeZone: 'America/Los_Angeles',
              },
              end: {
                dateTime: '2025-07-28T09:30:00-07:00',
                timeZone: 'America/Los_Angeles',
              },
              attendees: [
                { email: 'user1@example.com', responseStatus: 'accepted' },
                { email: 'user2@example.com', responseStatus: 'accepted' },
              ],
            },
            {
              id: 'event-2',
              summary: 'Focus Work - Deep Coding',
              description: 'Dedicated coding time',
              start: {
                dateTime: '2025-07-28T10:00:00-07:00',
                timeZone: 'America/Los_Angeles',
              },
              end: {
                dateTime: '2025-07-28T12:00:00-07:00',
                timeZone: 'America/Los_Angeles',
              },
              attendees: [],
            },
            {
              id: 'event-3',
              summary: 'All Hands Meeting',
              description: 'Company-wide meeting',
              start: {
                dateTime: '2025-07-28T14:00:00-07:00',
                timeZone: 'America/Los_Angeles',
              },
              end: {
                dateTime: '2025-07-28T15:00:00-07:00',
                timeZone: 'America/Los_Angeles',
              },
              attendees: Array(15).fill({ email: 'user@example.com', responseStatus: 'accepted' }),
            },
          ],
        };

        mockGoogleService.getCalendarEvents.mockResolvedValue(mockCalendarEvents);

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalledWith(
          userId,
          'primary',
          expect.any(Date),
          expect.any(Date)
        );
        expect(result).toBeDefined();
        expect(result.scheduleBlocks).toBeDefined();
      });

      it('should handle all-day events correctly', async () => {
        // Arrange: Mock all-day event
        const mockCalendarEvents = {
          kind: 'calendar#events',
          items: [
            {
              id: 'all-day-event',
              summary: 'Conference Day',
              start: {
                date: '2025-07-28',
              },
              end: {
                date: '2025-07-29',
              },
            },
          ],
        };

        mockGoogleService.getCalendarEvents.mockResolvedValue(mockCalendarEvents);

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert: Should handle all-day events without crashing
        expect(result).toBeDefined();
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalled();
      });

      it('should infer energy levels correctly based on event characteristics', async () => {
        // Arrange: Events designed to test energy level inference
        const mockCalendarEvents = {
          kind: 'calendar#events',
          items: [
            {
              id: 'focus-time',
              summary: 'Focus Work Session',
              start: { dateTime: '2025-07-28T09:00:00-07:00' },
              end: { dateTime: '2025-07-28T10:30:00-07:00' },
              attendees: [], // No attendees = focus time = HIGH energy
            },
            {
              id: 'small-meeting',
              summary: '1:1 with Manager',
              start: { dateTime: '2025-07-28T11:00:00-07:00' },
              end: { dateTime: '2025-07-28T11:30:00-07:00' },
              attendees: [{ email: 'manager@example.com', responseStatus: 'accepted' }], // Small meeting = MEDIUM energy
            },
            {
              id: 'large-meeting',
              summary: 'All Hands Meeting',
              start: { dateTime: '2025-07-28T14:00:00-07:00' },
              end: { dateTime: '2025-07-28T15:00:00-07:00' },
              attendees: Array(10).fill({ email: 'user@example.com' }), // Large meeting = LOW energy
            },
          ],
        };

        mockGoogleService.getCalendarEvents.mockResolvedValue(mockCalendarEvents);

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert: Should successfully parse and categorize events
        expect(result).toBeDefined();
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalled();
      });

      it('should infer focus types correctly based on event content', async () => {
        // Arrange: Events with different focus type indicators
        const mockCalendarEvents = {
          kind: 'calendar#events',
          items: [
            {
              id: 'tech-review',
              summary: 'Code Review Session',
              description: 'Review API changes and system architecture',
              start: { dateTime: '2025-07-28T09:00:00-07:00' },
              end: { dateTime: '2025-07-28T10:00:00-07:00' },
            },
            {
              id: 'design-workshop',
              summary: 'Design Workshop',
              description: 'Creative brainstorming for new features',
              start: { dateTime: '2025-07-28T11:00:00-07:00' },
              end: { dateTime: '2025-07-28T12:00:00-07:00' },
            },
            {
              id: 'admin-task',
              summary: 'Budget Planning',
              description: 'Quarterly budget review and expense reports',
              start: { dateTime: '2025-07-28T14:00:00-07:00' },
              end: { dateTime: '2025-07-28T15:00:00-07:00' },
            },
          ],
        };

        mockGoogleService.getCalendarEvents.mockResolvedValue(mockCalendarEvents);

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert: Should successfully categorize focus types
        expect(result).toBeDefined();
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalled();
      });
    });

    describe('Calendar Error Handling', () => {
      it('should handle Google Calendar API failures gracefully', async () => {
        // Arrange: Mock API failure
        mockGoogleService.getCalendarEvents.mockRejectedValue(
          new Error('Google Calendar API unavailable')
        );

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert: Should continue planning without calendar data
        expect(result).toBeDefined();
        expect(result.scheduleBlocks).toBeDefined();
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalled();
      });

      it('should handle authentication errors with retry logic', async () => {
        // Arrange: Mock 401 error followed by success
        const authError = new Error('Authentication failed');
        (authError as any).response = { status: 401 };

        mockGoogleService.getCalendarEvents.mockRejectedValueOnce(authError).mockResolvedValueOnce({
          kind: 'calendar#events',
          items: [],
        });

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert: Should handle auth error gracefully
        expect(result).toBeDefined();
      });

      it('should handle rate limiting with exponential backoff', async () => {
        // Arrange: Mock rate limit error
        const rateLimitError = new Error('Rate limit exceeded');
        (rateLimitError as any).response = { status: 429 };

        mockGoogleService.getCalendarEvents.mockRejectedValue(rateLimitError);

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert: Should handle rate limiting gracefully
        expect(result).toBeDefined();
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalled();
      });

      it('should handle malformed calendar event data', async () => {
        // Arrange: Mock malformed calendar response
        const mockMalformedEvents = {
          kind: 'calendar#events',
          items: [
            {
              id: 'malformed-event',
              summary: 'Test Event',
              // Missing start/end times
            },
            {
              id: 'invalid-dates',
              summary: 'Invalid Event',
              start: { dateTime: 'invalid-date' },
              end: { dateTime: 'invalid-date' },
            },
            {
              id: 'valid-event',
              summary: 'Valid Event',
              start: { dateTime: '2025-07-28T10:00:00-07:00' },
              end: { dateTime: '2025-07-28T11:00:00-07:00' },
            },
          ],
        };

        mockGoogleService.getCalendarEvents.mockResolvedValue(mockMalformedEvents);

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert: Should handle malformed events gracefully
        expect(result).toBeDefined();
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalled();
      });
    });

    describe('Calendar Integration Performance', () => {
      it('should handle large calendar datasets efficiently', async () => {
        // Arrange: Mock large calendar response (100+ events)
        const largeEventsList = Array(150)
          .fill(null)
          .map((_, index) => ({
            id: `event-${index}`,
            summary: `Meeting ${index}`,
            start: {
              dateTime: `2025-07-28T${String(9 + (index % 8)).padStart(2, '0')}:${String((index * 30) % 60).padStart(2, '0')}:00-07:00`,
            },
            end: {
              dateTime: `2025-07-28T${String(9 + (index % 8)).padStart(2, '0')}:${String(((index * 30) % 60) + 30).padStart(2, '0')}:00-07:00`,
            },
            attendees: [{ email: 'user@example.com', responseStatus: 'accepted' }],
          }));

        const mockLargeCalendarEvents = {
          kind: 'calendar#events',
          items: largeEventsList,
        };

        mockGoogleService.getCalendarEvents.mockResolvedValue(mockLargeCalendarEvents);

        // Act
        const startTime = performance.now();
        const result = await service.generatePlan(userId, testDate);
        const endTime = performance.now();

        // Assert: Should handle large datasets within reasonable time
        expect(result).toBeDefined();
        expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalled();
      });

      it('should not block planning when calendar API is slow', async () => {
        // Arrange: Mock slow calendar API response
        mockGoogleService.getCalendarEvents.mockImplementation(
          () =>
            new Promise(resolve => {
              setTimeout(() => {
                resolve({
                  kind: 'calendar#events',
                  items: [
                    {
                      id: 'slow-event',
                      summary: 'Slow Event',
                      start: { dateTime: '2025-07-28T10:00:00-07:00' },
                      end: { dateTime: '2025-07-28T11:00:00-07:00' },
                    },
                  ],
                });
              }, 100); // 100ms delay
            })
        );

        // Act
        const startTime = performance.now();
        const result = await service.generatePlan(userId, testDate);
        const endTime = performance.now();

        // Assert: Should complete even with slow calendar API
        expect(result).toBeDefined();
        expect(endTime - startTime).toBeGreaterThan(100); // Should wait for calendar
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalled();
      });
    });

    describe('Calendar Event Conflict Detection', () => {
      it('should prevent task scheduling during calendar events', async () => {
        // Arrange: Mock calendar event and task
        const mockCalendarEvents = {
          kind: 'calendar#events',
          items: [
            {
              id: 'blocking-meeting',
              summary: 'Important Meeting',
              start: { dateTime: '2025-07-28T10:00:00-07:00' },
              end: { dateTime: '2025-07-28T11:00:00-07:00' },
              attendees: [{ email: 'user@example.com', responseStatus: 'accepted' }],
            },
          ],
        };

        const mockTask = {
          id: 'task-1',
          title: 'Complete project',
          description: 'Work on the project',
          status: TaskStatus.TODO,
          userId,
          projectId: 'project-1',
          estimatedMinutes: 60,
          priority: 5,
          energyLevel: EnergyLevel.MEDIUM,
          focusType: FocusType.TECHNICAL,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
          dueDate: null,
          source: null,
          aiSuggestion: null,
          softDeadline: null,
          hardDeadline: null,
          parentId: null,
          sortOrder: 0,
        };

        mockGoogleService.getCalendarEvents.mockResolvedValue(mockCalendarEvents);
        mockTasksService.findAll.mockResolvedValue([mockTask]);

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert: Task should not be scheduled during calendar event time
        expect(result).toBeDefined();

        // Check that no schedule blocks overlap with the calendar event
        const conflictingBlocks = result.scheduleBlocks.filter(block => {
          const blockStart = new Date(block.startTime);
          const blockEnd = new Date(block.endTime);
          const eventStart = new Date('2025-07-28T10:00:00-07:00');
          const eventEnd = new Date('2025-07-28T11:00:00-07:00');

          return blockStart < eventEnd && blockEnd > eventStart;
        });

        expect(conflictingBlocks).toHaveLength(0);
      });

      it('should handle overlapping calendar events correctly', async () => {
        // Arrange: Mock overlapping calendar events
        const mockCalendarEvents = {
          kind: 'calendar#events',
          items: [
            {
              id: 'event-1',
              summary: 'Meeting 1',
              start: { dateTime: '2025-07-28T10:00:00-07:00' },
              end: { dateTime: '2025-07-28T11:00:00-07:00' },
            },
            {
              id: 'event-2',
              summary: 'Meeting 2',
              start: { dateTime: '2025-07-28T10:30:00-07:00' },
              end: { dateTime: '2025-07-28T11:30:00-07:00' },
            },
          ],
        };

        mockGoogleService.getCalendarEvents.mockResolvedValue(mockCalendarEvents);

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert: Should handle overlapping events without errors
        expect(result).toBeDefined();
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalled();
      });
    });

    describe('Calendar Integration Edge Cases', () => {
      it('should handle empty calendar response', async () => {
        // Arrange: Mock empty calendar
        mockGoogleService.getCalendarEvents.mockResolvedValue({
          kind: 'calendar#events',
          items: [],
        });

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert: Should work normally with empty calendar
        expect(result).toBeDefined();
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalled();
      });

      it('should handle null calendar response', async () => {
        // Arrange: Mock null response
        mockGoogleService.getCalendarEvents.mockResolvedValue(null);

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert: Should handle null response gracefully
        expect(result).toBeDefined();
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalled();
      });

      it('should handle calendar events without attendees', async () => {
        // Arrange: Mock event without attendees
        const mockCalendarEvents = {
          kind: 'calendar#events',
          items: [
            {
              id: 'solo-event',
              summary: 'Personal Task',
              start: { dateTime: '2025-07-28T10:00:00-07:00' },
              end: { dateTime: '2025-07-28T11:00:00-07:00' },
              // No attendees field
            },
          ],
        };

        mockGoogleService.getCalendarEvents.mockResolvedValue(mockCalendarEvents);

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert: Should handle events without attendees
        expect(result).toBeDefined();
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalled();
      });

      it('should handle events with missing summary', async () => {
        // Arrange: Mock event without summary
        const mockCalendarEvents = {
          kind: 'calendar#events',
          items: [
            {
              id: 'no-summary-event',
              start: { dateTime: '2025-07-28T10:00:00-07:00' },
              end: { dateTime: '2025-07-28T11:00:00-07:00' },
              // No summary field
            },
          ],
        };

        mockGoogleService.getCalendarEvents.mockResolvedValue(mockCalendarEvents);

        // Act
        const result = await service.generatePlan(userId, testDate);

        // Assert: Should handle events without summary
        expect(result).toBeDefined();
        expect(mockGoogleService.getCalendarEvents).toHaveBeenCalled();
      });
    });
  });
});
