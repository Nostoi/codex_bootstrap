"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const tasks_service_1 = require("./tasks.service");
describe('TasksService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                tasks_service_1.TasksService,
            ],
        }).compile();
        service = module.get(tasks_service_1.TasksService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('toggles task completion', () => {
        const task = service.toggle(1);
        expect(task?.completed).toBe(true);
    });
    it('returns tasks with due dates', () => {
        const tasks = service.findAll();
        expect(tasks[0].dueDate).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
});
//# sourceMappingURL=tasks.service.spec.js.map