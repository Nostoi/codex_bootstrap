import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";

describe("UsersService", () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should find all users", async () => {
    const mockUsers = [
      { id: "1", email: "test@example.com", name: "Test User" },
    ];
    mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

    const result = await service.findAll();
    expect(result).toEqual(mockUsers);
    expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("should find user by email", async () => {
    const mockUser = { id: "1", email: "test@example.com", name: "Test User" };
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

    const result = await service.findByEmail("test@example.com");
    expect(result).toEqual(mockUser);
    expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
  });
});
