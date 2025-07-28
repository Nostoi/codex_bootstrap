"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const graph_controller_1 = require("./graph.controller");
const graph_service_1 = require("./graph.service");
describe('GraphController', () => {
    let controller;
    const service = {
        getUserProfile: jest.fn(),
        getOneDriveFiles: jest.fn(),
        getTeams: jest.fn(),
        createOneDriveFile: jest.fn(),
        saveIntegrationConfig: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [graph_controller_1.GraphController],
            providers: [{ provide: graph_service_1.GraphService, useValue: service }],
        }).compile();
        controller = module.get(graph_controller_1.GraphController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    it('delegates getUserProfile', () => {
        controller.getUserProfile('1');
        expect(service.getUserProfile).toHaveBeenCalledWith('1');
    });
    it('delegates createOneDriveFile', () => {
        controller.createOneDriveFile('1', { filename: 'f', content: 'c' });
        expect(service.createOneDriveFile).toHaveBeenCalledWith('1', 'f', 'c');
    });
});
//# sourceMappingURL=graph.controller.spec.js.map