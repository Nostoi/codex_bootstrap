import { Test, TestingModule } from "@nestjs/testing";
import { TasksService } from "./tasks.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("TasksService", () => {
  let service: TasksService;
  let prisma: PrismaService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return all tasks", async () => {
      const mockTasks = [
        {
          id: "1",
          title: "Test Task",
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
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      });
    });

    it("should filter tasks by owner ID", async () => {
      const ownerId = "user123";
      mockPrismaService.task.findMany.mockResolvedValue([]);

      await service.findAll(ownerId);
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: { ownerId },
        include: expect.any(Object),
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      });
    });
  });

  describe("toggle", () => {
    it("should toggle task completion", async () => {
      const taskId = "1";
      const mockTask = {
        id: taskId,
        title: "Test Task",
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
        include: expect.any(Object),
      });
    });

    it("should throw NotFoundException for non-existent task", async () => {
      const taskId = "999";
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.toggle(taskId)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create a task with metadata", async () => {
      const createTaskDto = {
        title: "New Task",
        description: "Task description",
        energyLevel: "MEDIUM" as any,
        focusType: "TECHNICAL" as any,
        priority: 5,
      };
      const ownerId = "user123";

      const mockCreatedTask = {
        id: "1",
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
          owner: { connect: { id: ownerId } },
        }),
        include: expect.any(Object),
      });
    });
  });
});
