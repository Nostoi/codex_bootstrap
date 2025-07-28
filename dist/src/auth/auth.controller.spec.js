"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
describe("AuthController", () => {
    let controller;
    const service = { login: jest.fn() };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [auth_controller_1.AuthController],
            providers: [{ provide: auth_service_1.AuthService, useValue: service }],
        }).compile();
        controller = module.get(auth_controller_1.AuthController);
    });
    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
    it("delegates login", async () => {
        await controller.login("test@example.com");
        expect(service.login).toHaveBeenCalledWith("test@example.com");
    });
});
//# sourceMappingURL=auth.controller.spec.js.map