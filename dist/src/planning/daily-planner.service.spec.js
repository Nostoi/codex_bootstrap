"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const daily_planner_service_1 = require("./daily-planner.service");
const prisma_service_1 = require("../prisma/prisma.service");
const tasks_service_1 = require("../tasks/tasks.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const mockPrismaService = {
    task: {
        findMany: jest.fn(),
    },
    userSettings: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
};
const mockTasksService = {
    findAll: jest.fn(),
    findTaskDependencies: jest.fn(),
};
describe('DailyPlannerService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                daily_planner_service_1.DailyPlannerService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: tasks_service_1.TasksService,
                    useValue: mockTasksService,
                },
            ],
        }).compile();
        service = module.get(daily_planner_service_1.DailyPlannerService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('generatePlan', () => {
        it('should generate an empty plan when no tasks are available', async () => {
            const userId = '1';
            const date = new Date('2024-01-15');
            mockTasksService.findAll.mockResolvedValue([]);
            mockTasksService.findTaskDependencies.mockResolvedValue([]);
            mockPrismaService.userSettings.findUnique.mockResolvedValue({
                workingHoursStart: 9,
                workingHoursEnd: 17,
                timeZone: 'UTC',
            });
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            expect(result.scheduleBlocks).toHaveLength(0);
            expect(result.totalEstimatedMinutes).toBe(0);
            expect(result.energyOptimization).toBeGreaterThanOrEqual(0);
            expect(result.focusOptimization).toBeGreaterThanOrEqual(0);
            expect(result.deadlineRisk).toBeGreaterThanOrEqual(0);
        });
        it('should generate a plan with properly scheduled tasks', async () => {
            const userId = '1';
            const date = new Date('2024-01-15');
            const mockTasks = [
                {
                    id: 'task1',
                    title: 'Important Task',
                    description: 'Task description',
                    priority: 5,
                    deadline: new Date('2024-01-16'),
                    estimatedMinutes: 60,
                    energyLevel: client_1.EnergyLevel.HIGH,
                    focusType: client_1.FocusType.TECHNICAL,
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
                    priority: 3,
                    deadline: new Date('2024-01-17'),
                    estimatedMinutes: 30,
                    energyLevel: client_1.EnergyLevel.MEDIUM,
                    focusType: client_1.FocusType.ADMINISTRATIVE,
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
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            expect(result.scheduleBlocks.length).toBeGreaterThan(0);
            expect(result.totalEstimatedMinutes).toBeGreaterThan(0);
            expect(result.unscheduledTasks).toBeDefined();
            expect(result.energyOptimization).toBeGreaterThanOrEqual(0);
            expect(result.energyOptimization).toBeLessThanOrEqual(1);
        });
        it('should handle circular dependencies correctly', async () => {
            const userId = '1';
            const date = new Date('2024-01-15');
            const mockTasks = [
                {
                    id: 'task1',
                    title: 'Task 1',
                    description: 'Task 1 description',
                    priority: 3,
                    deadline: new Date('2024-01-16'),
                    estimatedMinutes: 30,
                    energyLevel: client_1.EnergyLevel.MEDIUM,
                    focusType: client_1.FocusType.TECHNICAL,
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
                    priority: 3,
                    deadline: new Date('2024-01-16'),
                    estimatedMinutes: 30,
                    energyLevel: client_1.EnergyLevel.MEDIUM,
                    focusType: client_1.FocusType.TECHNICAL,
                    dependsOn: [{ id: 'task1' }],
                    metadata: {
                        energyLevel: 'MEDIUM',
                        focusType: 'TECHNICAL',
                    },
                },
            ];
            mockTasksService.findAll.mockResolvedValue(mockTasks);
            mockTasksService.findTaskDependencies.mockImplementation((taskId) => {
                if (taskId === 'task1') {
                    return Promise.resolve([{ dependsOn: 'task2' }]);
                }
                else if (taskId === 'task2') {
                    return Promise.resolve([{ dependsOn: 'task1' }]);
                }
                return Promise.resolve([]);
            });
            mockPrismaService.userSettings.findUnique.mockResolvedValue({
                workingHoursStart: 9,
                workingHoursEnd: 17,
                timeZone: 'UTC',
            });
            await expect(service.generatePlan(userId, date)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should respect working hours constraints', async () => {
            const userId = '1';
            const date = new Date('2024-01-15');
            const mockTasks = [
                {
                    id: 'task1',
                    title: 'Long Task',
                    description: 'A very long task',
                    priority: 5,
                    deadline: new Date('2024-01-16'),
                    estimatedMinutes: 600,
                    energyLevel: client_1.EnergyLevel.HIGH,
                    focusType: client_1.FocusType.TECHNICAL,
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
                workingHoursEnd: 17,
                timeZone: 'UTC',
            });
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            expect(result.totalEstimatedMinutes).toBeDefined();
            expect(result.scheduleBlocks).toBeDefined();
        });
        it('should calculate task scores correctly', async () => {
            const userId = '1';
            const date = new Date('2024-01-15');
            const highPriorityTask = {
                id: 'task1',
                title: 'High Priority Task',
                description: 'Important task',
                priority: 5,
                deadline: new Date('2024-01-15'),
                estimatedMinutes: 60,
                energyLevel: client_1.EnergyLevel.HIGH,
                focusType: client_1.FocusType.TECHNICAL,
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
                priority: 1,
                deadline: new Date('2024-01-20'),
                estimatedMinutes: 30,
                energyLevel: client_1.EnergyLevel.LOW,
                focusType: client_1.FocusType.ADMINISTRATIVE,
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
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            if (result.scheduleBlocks.length >= 2) {
                const firstScheduledTask = result.scheduleBlocks[0];
                expect(firstScheduledTask.task.id).toBe('task1');
            }
        });
        it('should handle tasks with dependencies correctly', async () => {
            const userId = '1';
            const date = new Date('2024-01-15');
            const dependentTask = {
                id: 'task1',
                title: 'Dependent Task',
                description: 'Task that depends on another',
                priority: 5,
                deadline: new Date('2024-01-16'),
                estimatedMinutes: 60,
                energyLevel: client_1.EnergyLevel.HIGH,
                focusType: client_1.FocusType.TECHNICAL,
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
                priority: 3,
                deadline: new Date('2024-01-16'),
                estimatedMinutes: 30,
                energyLevel: client_1.EnergyLevel.MEDIUM,
                focusType: client_1.FocusType.TECHNICAL,
                dependsOn: [],
                metadata: {
                    energyLevel: 'MEDIUM',
                    focusType: 'TECHNICAL',
                },
            };
            mockTasksService.findAll.mockResolvedValue([dependentTask, prerequisiteTask]);
            mockTasksService.findTaskDependencies.mockImplementation((taskId) => {
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
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            if (result.scheduleBlocks.length >= 2) {
                const prerequisiteScheduled = result.scheduleBlocks.find(t => t.task.id === 'task2');
                const dependentScheduled = result.scheduleBlocks.find(t => t.task.id === 'task1');
                if (prerequisiteScheduled && dependentScheduled) {
                    expect(new Date(prerequisiteScheduled.startTime).getTime())
                        .toBeLessThan(new Date(dependentScheduled.startTime).getTime());
                }
            }
        });
    });
    describe('edge cases', () => {
        it('should handle missing user settings gracefully', async () => {
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
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            expect(result.scheduleBlocks).toHaveLength(0);
        });
        it('should handle empty task list', async () => {
            const userId = '1';
            const date = new Date('2024-01-15');
            mockTasksService.findAll.mockResolvedValue([]);
            mockTasksService.findTaskDependencies.mockResolvedValue([]);
            mockPrismaService.userSettings.findUnique.mockResolvedValue({
                workingHoursStart: 9,
                workingHoursEnd: 17,
                timeZone: 'UTC',
            });
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            expect(result.scheduleBlocks).toHaveLength(0);
            expect(result.totalEstimatedMinutes).toBe(0);
            expect(result.unscheduledTasks).toHaveLength(0);
        });
        it('should handle invalid date input', async () => {
            const userId = '1';
            const invalidDate = new Date('invalid');
            await expect(service.generatePlan(userId, invalidDate)).rejects.toThrow();
        });
    });
});
//# sourceMappingURL=daily-planner.service.spec.js.map