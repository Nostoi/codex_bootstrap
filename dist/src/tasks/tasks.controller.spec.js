"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const tasks_controller_1 = require("./tasks.controller");
const tasks_service_1 = require("./tasks.service");
describe('TasksController', () => {
    let controller;
    const service = {
        findAll: jest.fn(),
        toggle: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [tasks_controller_1.TasksController],
            providers: [{ provide: tasks_service_1.TasksService, useValue: service }],
        }).compile();
        controller = module.get(tasks_controller_1.TasksController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    it('gets tasks', () => {
        controller.getTasks();
        expect(service.findAll).toHaveBeenCalled();
    });
    it('toggles task', () => {
        controller.toggleTask('1');
        expect(service.toggle).toHaveBeenCalledWith(1);
    });
});
//# sourceMappingURL=tasks.controller.spec.js.map