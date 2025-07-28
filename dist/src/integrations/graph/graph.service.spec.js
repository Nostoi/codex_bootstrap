"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const graph_service_1 = require("./graph.service");
const prisma_service_1 = require("../../prisma/prisma.service");
describe('GraphService', () => {
    let service;
    const mockPrisma = {
        integrationConfig: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                graph_service_1.GraphService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(graph_service_1.GraphService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('saves integration config', async () => {
        mockPrisma.integrationConfig.upsert.mockResolvedValue({ id: '1' });
        const result = await service.saveIntegrationConfig('u1', 'token');
        expect(result).toEqual({ id: '1' });
        expect(mockPrisma.integrationConfig.upsert).toHaveBeenCalled();
    });
    it('fetches user profile', async () => {
        mockPrisma.integrationConfig.findUnique.mockResolvedValue({ accessToken: 'a' });
        const mockGet = jest.fn().mockResolvedValue('profile');
        jest
            .spyOn(service, 'createGraphClient')
            .mockReturnValue({ api: () => ({ get: mockGet }) });
        const result = await service.getUserProfile('u1');
        expect(result).toBe('profile');
        expect(mockGet).toHaveBeenCalled();
    });
});
//# sourceMappingURL=graph.service.spec.js.map