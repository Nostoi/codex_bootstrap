import { Test, TestingModule } from "@nestjs/testing";
import { GraphService } from "./graph.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("GraphService", () => {
  let service: GraphService;
  const mockPrisma = {
    integrationConfig: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GraphService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<GraphService>(GraphService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("saves integration config", async () => {
    mockPrisma.integrationConfig.upsert.mockResolvedValue({ id: "1" });
    const result = await service.saveIntegrationConfig("u1", "token");
    expect(result).toEqual({ id: "1" });
    expect(mockPrisma.integrationConfig.upsert).toHaveBeenCalled();
  });

  it("fetches user profile", async () => {
    mockPrisma.integrationConfig.findUnique.mockResolvedValue({
      accessToken: "a",
    });
    const mockGet = jest.fn().mockResolvedValue("profile");
    jest
      .spyOn(service as any, "createGraphClient")
      .mockReturnValue({ api: () => ({ get: mockGet }) });

    const result = await service.getUserProfile("u1");
    expect(result).toBe("profile");
    expect(mockGet).toHaveBeenCalled();
  });
});
