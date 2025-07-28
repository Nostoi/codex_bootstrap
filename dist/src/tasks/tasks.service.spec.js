"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const tasks_service_1 = require("./tasks.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
describe("TasksService", () => {
    let service;
    let prisma;
    const mockPrismaService = {
        task: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        taskDependency: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
        userSettings: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                tasks_service_1.TasksService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();
        service = module.get(tasks_service_1.TasksService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it("should be defined", () => {
        expect(service).toBeDefined();
    });
    describe('findAll', () => {
        it("should return all tasks", async () => {
            const mockTasks = [
                {
                    id: '1',
                    title: 'Test Task',
                    completed: false,
                    dueDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
            const result = await service.findAll();
            expect(result).toEqual(mockTasks);
            expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
                where: {},
                include: expect.any(Object),
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' }
                ]
            });
        });
        it("should filter tasks by owner ID", async () => {
            const ownerId = 'user123';
            mockPrismaService.task.findMany.mockResolvedValue([]);
            await service.findAll(ownerId);
            expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
                where: { ownerId },
                include: expect.any(Object),
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' }
                ]
            });
        });
    });
    describe('toggle', () => {
        it("should toggle task completion", async () => {
            const taskId = '1';
            const mockTask = {
                id: taskId,
                title: 'Test Task',
                completed: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const toggledTask = { ...mockTask, completed: true };
            mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
            mockPrismaService.task.update.mockResolvedValue(toggledTask);
            const result = await service.toggle(taskId);
            expect(result.completed).toBe(true);
            expect(mockPrismaService.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: { completed: true },
                include: expect.any(Object)
            });
        });
        it("should throw NotFoundException for non-existent task", async () => {
            const taskId = '999';
            mockPrismaService.task.findUnique.mockResolvedValue(null);
            await expect(service.toggle(taskId)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('create', () => {
        it("should create a task with metadata", async () => {
            const createTaskDto = {
                title: 'New Task',
                description: 'Task description',
                energyLevel: 'MEDIUM',
                focusType: 'TECHNICAL',
                priority: 5,
            };
            const ownerId = 'user123';
            const mockCreatedTask = {
                id: '1',
                ...createTaskDto,
                completed: false,
                ownerId,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaService.task.create.mockResolvedValue(mockCreatedTask);
            const result = await service.create(createTaskDto, ownerId);
            expect(result).toEqual(mockCreatedTask);
            expect(mockPrismaService.task.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: createTaskDto.title,
                    description: createTaskDto.description,
                    energyLevel: createTaskDto.energyLevel,
                    focusType: createTaskDto.focusType,
                    priority: createTaskDto.priority,
                    owner: { connect: { id: ownerId } }
                }),
                include: expect.any(Object)
            });
        });
    });
});
//# sourceMappingURL=tasks.service.spec.js.map