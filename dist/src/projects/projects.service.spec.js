"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const projects_service_1 = require("./projects.service");
const prisma_service_1 = require("../prisma/prisma.service");
describe('ProjectsService', () => {
    let service;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                projects_service_1.ProjectsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(projects_service_1.ProjectsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should return all projects', async () => {
        const projects = [{ id: '1', name: 'Proj' }];
        mockPrisma.project.findMany.mockResolvedValue(projects);
        const result = await service.findAll();
        expect(result).toEqual(projects);
        expect(mockPrisma.project.findMany).toHaveBeenCalled();
    });
});
//# sourceMappingURL=projects.service.spec.js.map