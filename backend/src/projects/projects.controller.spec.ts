import { Test, TestingModule } from "@nestjs/testing";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

describe("ProjectsController", () => {
  let controller: ProjectsController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: service }],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("delegates create", () => {
    controller.create({ name: "Test" } as any);
    expect(service.create).toHaveBeenCalled();
  });

  it("delegates findAll", () => {
    controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it("delegates findOne", () => {
    controller.findOne("1");
    expect(service.findOne).toHaveBeenCalledWith("1");
  });

  it("delegates update", () => {
    controller.update("1", { name: "U" } as any);
    expect(service.update).toHaveBeenCalledWith("1", { name: "U" });
  });

  it("delegates remove", () => {
    controller.remove("1");
    expect(service.remove).toHaveBeenCalledWith("1");
  });
});
