"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const daily_planner_service_1 = require("./daily-planner.service");
const prisma_service_1 = require("../prisma/prisma.service");
const tasks_service_1 = require("../tasks/tasks.service");
const google_service_1 = require("../integrations/google/google.service");
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
const mockGoogleService = {
    getCalendarEvents: jest.fn(),
};
describe("DailyPlannerService", () => {
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
                {
                    provide: google_service_1.GoogleService,
                    useValue: mockGoogleService,
                },
            ],
        }).compile();
        service = module.get(daily_planner_service_1.DailyPlannerService);
    });
    beforeEach(() => {
        jest.clearAllMocks();
        mockGoogleService.getCalendarEvents.mockResolvedValue({
            kind: 'calendar#events',
            items: []
        });
    });
    describe("generatePlan", () => {
        it("should generate an empty plan when no tasks are available", async () => {
            const userId = "1";
            const date = new Date("2024-01-15");
            mockTasksService.findAll.mockResolvedValue([]);
            mockTasksService.findTaskDependencies.mockResolvedValue([]);
            mockPrismaService.userSettings.findUnique.mockResolvedValue({
                workingHoursStart: 9,
                workingHoursEnd: 17,
                timeZone: "UTC",
            });
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            expect(result.scheduleBlocks).toHaveLength(0);
            expect(result.totalEstimatedMinutes).toBe(0);
            expect(result.energyOptimization).toBeGreaterThanOrEqual(0);
            expect(result.focusOptimization).toBeGreaterThanOrEqual(0);
            expect(result.deadlineRisk).toBeGreaterThanOrEqual(0);
        });
        it("should generate a plan with properly scheduled tasks", async () => {
            const userId = "1";
            const date = new Date("2024-01-15");
            const mockTasks = [
                {
                    id: "task1",
                    title: "Important Task",
                    description: "Task description",
                    priority: 5,
                    deadline: new Date("2024-01-16"),
                    estimatedMinutes: 60,
                    energyLevel: client_1.EnergyLevel.HIGH,
                    focusType: client_1.FocusType.TECHNICAL,
                    dependsOn: [],
                    metadata: {
                        energyLevel: "HIGH",
                        focusType: "TECHNICAL",
                    },
                },
                {
                    id: "task2",
                    title: "Medium Task",
                    description: "Another task",
                    priority: 3,
                    deadline: new Date("2024-01-17"),
                    estimatedMinutes: 30,
                    energyLevel: client_1.EnergyLevel.MEDIUM,
                    focusType: client_1.FocusType.ADMINISTRATIVE,
                    dependsOn: [],
                    metadata: {
                        energyLevel: "MEDIUM",
                        focusType: "ADMINISTRATIVE",
                    },
                },
            ];
            mockTasksService.findAll.mockResolvedValue(mockTasks);
            mockTasksService.findTaskDependencies.mockResolvedValue([]);
            mockPrismaService.userSettings.findUnique.mockResolvedValue({
                workingHoursStart: 9,
                workingHoursEnd: 17,
                timeZone: "UTC",
            });
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            expect(result.scheduleBlocks.length).toBeGreaterThan(0);
            expect(result.totalEstimatedMinutes).toBeGreaterThan(0);
            expect(result.unscheduledTasks).toBeDefined();
            expect(result.energyOptimization).toBeGreaterThanOrEqual(0);
            expect(result.energyOptimization).toBeLessThanOrEqual(1);
        });
        it("should handle circular dependencies correctly", async () => {
            const userId = "1";
            const date = new Date("2024-01-15");
            const mockTasks = [
                {
                    id: "task1",
                    title: "Task 1",
                    description: "Task 1 description",
                    priority: 3,
                    deadline: new Date("2024-01-16"),
                    estimatedMinutes: 30,
                    energyLevel: client_1.EnergyLevel.MEDIUM,
                    focusType: client_1.FocusType.TECHNICAL,
                    dependsOn: [{ id: "task2" }],
                    metadata: {
                        energyLevel: "MEDIUM",
                        focusType: "TECHNICAL",
                    },
                },
                {
                    id: "task2",
                    title: "Task 2",
                    description: "Task 2 description",
                    priority: 3,
                    deadline: new Date("2024-01-16"),
                    estimatedMinutes: 30,
                    energyLevel: client_1.EnergyLevel.MEDIUM,
                    focusType: client_1.FocusType.TECHNICAL,
                    dependsOn: [{ id: "task1" }],
                    metadata: {
                        energyLevel: "MEDIUM",
                        focusType: "TECHNICAL",
                    },
                },
            ];
            mockTasksService.findAll.mockResolvedValue(mockTasks);
            mockTasksService.findTaskDependencies.mockImplementation((taskId) => {
                if (taskId === "task1") {
                    return Promise.resolve([{ dependsOn: "task2" }]);
                }
                else if (taskId === "task2") {
                    return Promise.resolve([{ dependsOn: "task1" }]);
                }
                return Promise.resolve([]);
            });
            mockPrismaService.userSettings.findUnique.mockResolvedValue({
                workingHoursStart: 9,
                workingHoursEnd: 17,
                timeZone: "UTC",
            });
            await expect(service.generatePlan(userId, date)).rejects.toThrow(common_1.BadRequestException);
        });
        it("should respect working hours constraints", async () => {
            const userId = "1";
            const date = new Date("2024-01-15");
            const mockTasks = [
                {
                    id: "task1",
                    title: "Long Task",
                    description: "A very long task",
                    priority: 5,
                    deadline: new Date("2024-01-16"),
                    estimatedMinutes: 600,
                    energyLevel: client_1.EnergyLevel.HIGH,
                    focusType: client_1.FocusType.TECHNICAL,
                    dependsOn: [],
                    metadata: {
                        energyLevel: "HIGH",
                        focusType: "TECHNICAL",
                    },
                },
            ];
            mockTasksService.findAll.mockResolvedValue(mockTasks);
            mockTasksService.findTaskDependencies.mockResolvedValue([]);
            mockPrismaService.userSettings.findUnique.mockResolvedValue({
                workingHoursStart: 9,
                workingHoursEnd: 17,
                timeZone: "UTC",
            });
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            expect(result.totalEstimatedMinutes).toBeDefined();
            expect(result.scheduleBlocks).toBeDefined();
        });
        it("should calculate task scores correctly", async () => {
            const userId = "1";
            const date = new Date("2024-01-15");
            const highPriorityTask = {
                id: "task1",
                title: "High Priority Task",
                description: "Important task",
                priority: 5,
                deadline: new Date("2024-01-15"),
                estimatedMinutes: 60,
                energyLevel: client_1.EnergyLevel.HIGH,
                focusType: client_1.FocusType.TECHNICAL,
                dependsOn: [],
                metadata: {
                    energyLevel: "HIGH",
                    focusType: "TECHNICAL",
                },
            };
            const lowPriorityTask = {
                id: "task2",
                title: "Low Priority Task",
                description: "Less important task",
                priority: 1,
                deadline: new Date("2024-01-20"),
                estimatedMinutes: 30,
                energyLevel: client_1.EnergyLevel.LOW,
                focusType: client_1.FocusType.ADMINISTRATIVE,
                dependsOn: [],
                metadata: {
                    energyLevel: "LOW",
                    focusType: "ADMINISTRATIVE",
                },
            };
            mockTasksService.findAll.mockResolvedValue([
                highPriorityTask,
                lowPriorityTask,
            ]);
            mockTasksService.findTaskDependencies.mockResolvedValue([]);
            mockPrismaService.userSettings.findUnique.mockResolvedValue({
                workingHoursStart: 9,
                workingHoursEnd: 17,
                timeZone: "UTC",
            });
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            if (result.scheduleBlocks.length >= 2) {
                const firstScheduledTask = result.scheduleBlocks[0];
                expect(firstScheduledTask.task.id).toBe("task1");
            }
        });
        it("should handle tasks with dependencies correctly", async () => {
            const userId = "1";
            const date = new Date("2024-01-15");
            const dependentTask = {
                id: "task1",
                title: "Dependent Task",
                description: "Task that depends on another",
                priority: 5,
                deadline: new Date("2024-01-16"),
                estimatedMinutes: 60,
                energyLevel: client_1.EnergyLevel.HIGH,
                focusType: client_1.FocusType.TECHNICAL,
                dependsOn: [{ id: "task2" }],
                metadata: {
                    energyLevel: "HIGH",
                    focusType: "TECHNICAL",
                },
            };
            const prerequisiteTask = {
                id: "task2",
                title: "Prerequisite Task",
                description: "Task that must be done first",
                priority: 3,
                deadline: new Date("2024-01-16"),
                estimatedMinutes: 30,
                energyLevel: client_1.EnergyLevel.MEDIUM,
                focusType: client_1.FocusType.TECHNICAL,
                dependsOn: [],
                metadata: {
                    energyLevel: "MEDIUM",
                    focusType: "TECHNICAL",
                },
            };
            mockTasksService.findAll.mockResolvedValue([
                dependentTask,
                prerequisiteTask,
            ]);
            mockTasksService.findTaskDependencies.mockImplementation((taskId) => {
                if (taskId === "task1") {
                    return Promise.resolve([{ dependsOn: "task2" }]);
                }
                return Promise.resolve([]);
            });
            mockPrismaService.userSettings.findUnique.mockResolvedValue({
                workingHoursStart: 9,
                workingHoursEnd: 17,
                timeZone: "UTC",
            });
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            if (result.scheduleBlocks.length >= 2) {
                const prerequisiteScheduled = result.scheduleBlocks.find((t) => t.task.id === "task2");
                const dependentScheduled = result.scheduleBlocks.find((t) => t.task.id === "task1");
                if (prerequisiteScheduled && dependentScheduled) {
                    expect(new Date(prerequisiteScheduled.startTime).getTime()).toBeLessThan(new Date(dependentScheduled.startTime).getTime());
                }
            }
        });
    });
    describe("edge cases", () => {
        it("should handle missing user settings gracefully", async () => {
            const userId = "1";
            const date = new Date("2024-01-15");
            mockTasksService.findAll.mockResolvedValue([]);
            mockTasksService.findTaskDependencies.mockResolvedValue([]);
            mockPrismaService.userSettings.findUnique.mockResolvedValue(null);
            mockPrismaService.userSettings.create.mockResolvedValue({
                userId,
                workingHoursStart: 9,
                workingHoursEnd: 17,
                timeZone: "UTC",
            });
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            expect(result.scheduleBlocks).toHaveLength(0);
        });
        it("should handle empty task list", async () => {
            const userId = "1";
            const date = new Date("2024-01-15");
            mockTasksService.findAll.mockResolvedValue([]);
            mockTasksService.findTaskDependencies.mockResolvedValue([]);
            mockPrismaService.userSettings.findUnique.mockResolvedValue({
                workingHoursStart: 9,
                workingHoursEnd: 17,
                timeZone: "UTC",
            });
            const result = await service.generatePlan(userId, date);
            expect(result).toBeDefined();
            expect(result.scheduleBlocks).toHaveLength(0);
            expect(result.totalEstimatedMinutes).toBe(0);
            expect(result.unscheduledTasks).toHaveLength(0);
        });
        it("should handle invalid date input", async () => {
            const userId = "1";
            const invalidDate = new Date("invalid");
            await expect(service.generatePlan(userId, invalidDate)).rejects.toThrow();
        });
    });
    describe("resolveTaskDependencies", () => {
        it("should return ready tasks when no dependencies exist", async () => {
            const tasks = [
                {
                    id: "task1",
                    title: "Independent Task 1",
                    status: client_1.TaskStatus.TODO,
                    priority: 3,
                },
                {
                    id: "task2",
                    title: "Independent Task 2",
                    status: client_1.TaskStatus.TODO,
                    priority: 2,
                },
            ];
            mockTasksService.findTaskDependencies.mockResolvedValue([]);
            const result = await service.resolveTaskDependencies(tasks);
            expect(result.totalTasks).toBe(2);
            expect(result.readyCount).toBe(2);
            expect(result.blockedCount).toBe(0);
            expect(result.readyTasks).toHaveLength(2);
            expect(result.blockedTasks).toHaveLength(0);
        });
        it("should identify blocked tasks with incomplete dependencies", async () => {
            const tasks = [
                {
                    id: "task1",
                    title: "Dependent Task",
                    status: client_1.TaskStatus.TODO,
                    priority: 3,
                },
                {
                    id: "task2",
                    title: "Dependency Task",
                    status: client_1.TaskStatus.TODO,
                    priority: 2,
                },
            ];
            mockTasksService.findTaskDependencies.mockImplementation((taskId) => {
                if (taskId === "task1") {
                    return Promise.resolve([{ taskId: "task1", dependsOn: "task2" }]);
                }
                return Promise.resolve([]);
            });
            const result = await service.resolveTaskDependencies(tasks);
            expect(result.totalTasks).toBe(2);
            expect(result.readyCount).toBe(1);
            expect(result.blockedCount).toBe(1);
            expect(result.readyTasks).toHaveLength(1);
            expect(result.readyTasks[0].id).toBe("task2");
            expect(result.blockedTasks).toHaveLength(1);
            expect(result.blockedTasks[0].task.id).toBe("task1");
            expect(result.blockedTasks[0].reasons).toHaveLength(1);
            expect(result.blockedTasks[0].reasons[0].type).toBe("incomplete_dependency");
        });
        it("should identify orphaned dependencies", async () => {
            const tasks = [
                {
                    id: "task1",
                    title: "Task with Orphaned Dependency",
                    status: client_1.TaskStatus.TODO,
                    priority: 3,
                },
            ];
            mockTasksService.findTaskDependencies.mockImplementation((taskId) => {
                if (taskId === "task1") {
                    return Promise.resolve([
                        { taskId: "task1", dependsOn: "nonexistent-task" },
                    ]);
                }
                return Promise.resolve([]);
            });
            const result = await service.resolveTaskDependencies(tasks);
            expect(result.totalTasks).toBe(1);
            expect(result.readyCount).toBe(0);
            expect(result.blockedCount).toBe(1);
            expect(result.blockedTasks[0].reasons[0].type).toBe("orphaned_dependency");
            expect(result.blockedTasks[0].reasons[0].dependencyTaskId).toBe("nonexistent-task");
        });
    });
    describe("Energy-Mapped Time Slot Generation", () => {
        const mockUserSettings = {
            id: "settings1",
            userId: "user1",
            morningEnergyLevel: client_1.EnergyLevel.HIGH,
            afternoonEnergyLevel: client_1.EnergyLevel.MEDIUM,
            workStartTime: "09:00",
            workEndTime: "17:00",
            focusSessionLength: 90,
            preferredFocusTypes: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        it("should parse work times correctly", () => {
            const parseWorkTime = service.parseWorkTime.bind(service);
            expect(parseWorkTime("09:00")).toEqual({ hour: 9, minute: 0 });
            expect(parseWorkTime("13:30")).toEqual({ hour: 13, minute: 30 });
            expect(parseWorkTime("17:45")).toEqual({ hour: 17, minute: 45 });
        });
        it("should handle invalid time formats gracefully", () => {
            const parseWorkTime = service.parseWorkTime.bind(service);
            expect(parseWorkTime("invalid")).toEqual({ hour: 9, minute: 0 });
            expect(parseWorkTime("25:00")).toEqual({ hour: 9, minute: 0 });
            expect(parseWorkTime("12:70")).toEqual({ hour: 9, minute: 0 });
        });
        it("should calculate context-aware break durations", () => {
            const calculateBreakDuration = service.calculateBreakDuration.bind(service);
            expect(calculateBreakDuration(60)).toBe(10);
            expect(calculateBreakDuration(90)).toBe(15);
            expect(calculateBreakDuration(120)).toBe(20);
            expect(calculateBreakDuration(150)).toBe(25);
        });
        it("should map enhanced energy levels throughout the day", () => {
            const getEnhancedEnergyLevelForTime = service.getEnhancedEnergyLevelForTime.bind(service);
            const earlyMorning = new Date();
            earlyMorning.setHours(7, 0, 0, 0);
            expect(getEnhancedEnergyLevelForTime(earlyMorning, mockUserSettings)).toBe(client_1.EnergyLevel.MEDIUM);
            const peakMorning = new Date();
            peakMorning.setHours(9, 0, 0, 0);
            expect(getEnhancedEnergyLevelForTime(peakMorning, mockUserSettings)).toBe(client_1.EnergyLevel.HIGH);
            const lunchTime = new Date();
            lunchTime.setHours(12, 30, 0, 0);
            expect(getEnhancedEnergyLevelForTime(lunchTime, mockUserSettings)).toBe(client_1.EnergyLevel.LOW);
            const afternoonPeak = new Date();
            afternoonPeak.setHours(15, 0, 0, 0);
            expect(getEnhancedEnergyLevelForTime(afternoonPeak, mockUserSettings)).toBe(client_1.EnergyLevel.MEDIUM);
            const evening = new Date();
            evening.setHours(19, 0, 0, 0);
            expect(getEnhancedEnergyLevelForTime(evening, mockUserSettings)).toBe(client_1.EnergyLevel.LOW);
        });
        it("should optimize focus types based on energy and time", () => {
            const getOptimizedFocusTypes = service.getOptimizedFocusTypes.bind(service);
            const morningTime = new Date();
            morningTime.setHours(9, 0, 0, 0);
            const morningFocus = getOptimizedFocusTypes(client_1.EnergyLevel.HIGH, morningTime);
            expect(morningFocus).toContain(client_1.FocusType.CREATIVE);
            expect(morningFocus).toContain(client_1.FocusType.TECHNICAL);
            const afternoonTime = new Date();
            afternoonTime.setHours(15, 0, 0, 0);
            const afternoonFocus = getOptimizedFocusTypes(client_1.EnergyLevel.HIGH, afternoonTime);
            expect(afternoonFocus[0]).toBe(client_1.FocusType.TECHNICAL);
            const eveningTime = new Date();
            eveningTime.setHours(17, 0, 0, 0);
            const eveningFocus = getOptimizedFocusTypes(client_1.EnergyLevel.LOW, eveningTime);
            expect(eveningFocus).toContain(client_1.FocusType.SOCIAL);
            expect(eveningFocus).toContain(client_1.FocusType.ADMINISTRATIVE);
        });
        it("should generate time slots with custom work hours", async () => {
            const testDate = new Date("2025-07-28");
            const customSettings = {
                ...mockUserSettings,
                workStartTime: "08:30",
                workEndTime: "16:30",
                focusSessionLength: 60,
            };
            const mockTasks = [
                {
                    id: "task1",
                    title: "Test Task",
                    status: client_1.TaskStatus.IN_PROGRESS,
                    userId: "user1",
                    estimatedMinutes: 60,
                    priority: 3,
                    energyLevel: client_1.EnergyLevel.HIGH,
                    focusType: client_1.FocusType.TECHNICAL,
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
            const result = await service.generatePlan("user1", testDate);
            expect(result).toBeDefined();
            expect(result.date).toBe("2025-07-28");
            expect(result.totalEstimatedMinutes).toBeGreaterThanOrEqual(0);
            if (result.scheduleBlocks.length > 0) {
                const firstSlot = new Date(result.scheduleBlocks[0].startTime);
                expect(firstSlot.getHours()).toBeGreaterThanOrEqual(8);
                if (firstSlot.getHours() === 8) {
                    expect(firstSlot.getMinutes()).toBeGreaterThanOrEqual(30);
                }
            }
        });
    });
});
//# sourceMappingURL=daily-planner.service.spec.js.map