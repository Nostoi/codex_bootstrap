import { Test, TestingModule } from "@nestjs/testing";
import { GraphController } from "./graph.controller";
import { GraphService } from "./graph.service";

describe("GraphController", () => {
  let controller: GraphController;
  const service = {
    getUserProfile: jest.fn(),
    getOneDriveFiles: jest.fn(),
    getTeams: jest.fn(),
    createOneDriveFile: jest.fn(),
    saveIntegrationConfig: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GraphController],
      providers: [{ provide: GraphService, useValue: service }],
    }).compile();

    controller = module.get<GraphController>(GraphController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("delegates getUserProfile", () => {
    controller.getUserProfile("1");
    expect(service.getUserProfile).toHaveBeenCalledWith("1");
  });

  it("delegates createOneDriveFile", () => {
    controller.createOneDriveFile("1", { filename: "f", content: "c" });
    expect(service.createOneDriveFile).toHaveBeenCalledWith("1", "f", "c");
  });
});
