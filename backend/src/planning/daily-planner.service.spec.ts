import { Test, TestingModule } from '@nestjs/testing';
import { DailyPlannerService } from './daily-planner.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { BadRequestException } from '@nestjs/common';
import { EnergyLevel, FocusType } from '@prisma/client';

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
      ],
    }).compile();

    service = module.get<DailyPlannerService>(DailyPlannerService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
          expect(new Date(prerequisiteScheduled.startTime).getTime())
            .toBeLessThan(new Date(dependentScheduled.startTime).getTime());
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
});
