"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const users_service_1 = require("./users.service");
const prisma_service_1 = require("../prisma/prisma.service");
describe("UsersService", () => {
    let service;
    let prismaService;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                users_service_1.UsersService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();
        service = module.get(users_service_1.UsersService);
        prismaService = module.get(prisma_service_1.PrismaService);
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
//# sourceMappingURL=users.service.spec.js.map