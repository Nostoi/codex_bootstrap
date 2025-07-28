"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const users_controller_1 = require("./users.controller");
const users_service_1 = require("./users.service");
describe('UsersController', () => {
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
            controllers: [users_controller_1.UsersController],
            providers: [{ provide: users_service_1.UsersService, useValue: service }],
        }).compile();
        controller = module.get(users_controller_1.UsersController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    it('delegates create', () => {
        controller.create({});
        expect(service.create).toHaveBeenCalled();
    });
    it('delegates findAll', () => {
        controller.findAll();
        expect(service.findAll).toHaveBeenCalled();
    });
    it('delegates findOne', () => {
        controller.findOne('1');
        expect(service.findOne).toHaveBeenCalledWith('1');
    });
    it('delegates update', () => {
        controller.update('1', {});
        expect(service.update).toHaveBeenCalledWith('1', {});
    });
    it('delegates remove', () => {
        controller.remove('1');
        expect(service.remove).toHaveBeenCalledWith('1');
    });
});
//# sourceMappingURL=users.controller.spec.js.map