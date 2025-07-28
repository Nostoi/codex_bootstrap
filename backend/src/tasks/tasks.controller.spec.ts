import { Test, TestingModule } from "@nestjs/testing";
import { TasksController, UserSettingsController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

describe("TasksController", () => {
  let controller: TasksController;
  const mockTasksService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn(),
    findTaskDependencies: jest.fn(),
    createTaskDependency: jest.fn(),
    removeTaskDependency: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("gets tasks", async () => {
    const mockTasks = [{ id: "1", title: "Test" }];
    mockTasksService.findAll.mockResolvedValue(mockTasks);

    const result = await controller.getTasks();
    expect(result).toEqual(mockTasks);
    expect(mockTasksService.findAll).toHaveBeenCalledWith(undefined);
  });

  it("gets tasks with owner filter", async () => {
    const ownerId = "user123";
    mockTasksService.findAll.mockResolvedValue([]);

    await controller.getTasks(ownerId);
    expect(mockTasksService.findAll).toHaveBeenCalledWith(ownerId);
  });

  it("gets single task", async () => {
    const taskId = "1";
    const mockTask = { id: taskId, title: "Test" };
    mockTasksService.findOne.mockResolvedValue(mockTask);

    const result = await controller.getTask(taskId);
    expect(result).toEqual(mockTask);
    expect(mockTasksService.findOne).toHaveBeenCalledWith(taskId);
  });

  it("creates task", async () => {
    const createTaskDto = { title: "New Task" };
    const ownerId = "user123";
    const mockCreatedTask = { id: "1", ...createTaskDto };
    mockTasksService.create.mockResolvedValue(mockCreatedTask);

    const result = await controller.createTask(createTaskDto as any, ownerId);
    expect(result).toEqual(mockCreatedTask);
    expect(mockTasksService.create).toHaveBeenCalledWith(
      createTaskDto,
      ownerId,
    );
  });

  it("toggles task", async () => {
    const taskId = "1";
    const mockToggledTask = { id: taskId, completed: true };
    mockTasksService.toggle.mockResolvedValue(mockToggledTask);

    const result = await controller.toggleTask(taskId);
    expect(result).toEqual(mockToggledTask);
    expect(mockTasksService.toggle).toHaveBeenCalledWith(taskId);
  });
});

describe("UserSettingsController", () => {
  let controller: UserSettingsController;
  const mockTasksService = {
    findUserSettings: jest.fn(),
    createUserSettings: jest.fn(),
    updateUserSettings: jest.fn(),
    removeUserSettings: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserSettingsController],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compile();

    controller = module.get<UserSettingsController>(UserSettingsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("gets user settings", async () => {
    const userId = "user123";
    const mockSettings = { id: "1", userId };
    mockTasksService.findUserSettings.mockResolvedValue(mockSettings);

    const result = await controller.getUserSettings(userId);
    expect(result).toEqual(mockSettings);
    expect(mockTasksService.findUserSettings).toHaveBeenCalledWith(userId);
  });
});
