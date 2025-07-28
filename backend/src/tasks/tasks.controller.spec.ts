import { Test, TestingModule } from "@nestjs/testing";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

describe("TasksController", () => {
  let controller: TasksController;
  const service = {
    findAll: jest.fn(),
    toggle: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: service }],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("gets tasks", () => {
    controller.getTasks();
    expect(service.findAll).toHaveBeenCalled();
  });

  it("toggles task", () => {
    controller.toggleTask("1");
    expect(service.toggle).toHaveBeenCalledWith(1);
  });
});
