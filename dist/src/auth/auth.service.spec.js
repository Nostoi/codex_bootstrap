"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("./auth.service");
const users_service_1 = require("../users/users.service");
describe("AuthService", () => {
    let service;
    const usersService = {
        findByEmail: jest.fn().mockResolvedValue(null),
        create: jest
            .fn()
            .mockImplementation(async (data) => ({ id: "1", email: data.email })),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: users_service_1.UsersService, useValue: usersService },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
    });
    it("should be defined", () => {
        expect(service).toBeDefined();
    });
    it("returns a token on login", async () => {
        const result = await service.login("test@example.com");
        expect(result.access_token).toBeDefined();
    });
});
//# sourceMappingURL=auth.service.spec.js.map