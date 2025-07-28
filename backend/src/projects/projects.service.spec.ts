import { Test, TestingModule } from "@nestjs/testing";
import { ProjectsService } from "./projects.service";
import { PrismaService } from "../prisma/prisma.service";

describe("ProjectsService", () => {
  let service: ProjectsService;
  const mockPrisma = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return all projects", async () => {
    const projects = [{ id: "1", name: "Proj" }];
    mockPrisma.project.findMany.mockResolvedValue(projects);
    const result = await service.findAll();
    expect(result).toEqual(projects);
    expect(mockPrisma.project.findMany).toHaveBeenCalled();
  });
});
