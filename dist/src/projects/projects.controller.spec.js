"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const projects_controller_1 = require("./projects.controller");
const projects_service_1 = require("./projects.service");
describe("ProjectsController", () => {
    let controller;
    const service = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [projects_controller_1.ProjectsController],
            providers: [{ provide: projects_service_1.ProjectsService, useValue: service }],
        }).compile();
        controller = module.get(projects_controller_1.ProjectsController);
    });
    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
    it("delegates create", () => {
        controller.create({ name: "Test" });
        expect(service.create).toHaveBeenCalled();
    });
    it("delegates findAll", () => {
        controller.findAll();
        expect(service.findAll).toHaveBeenCalled();
    });
    it("delegates findOne", () => {
        controller.findOne("1");
        expect(service.findOne).toHaveBeenCalledWith("1");
    });
    it("delegates update", () => {
        controller.update("1", { name: "U" });
        expect(service.update).toHaveBeenCalledWith("1", { name: "U" });
    });
    it("delegates remove", () => {
        controller.remove("1");
        expect(service.remove).toHaveBeenCalledWith("1");
    });
});
//# sourceMappingURL=projects.controller.spec.js.map