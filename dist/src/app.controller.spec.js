"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
describe("AppController", () => {
    let appController;
    beforeEach(async () => {
        const app = await testing_1.Test.createTestingModule({
            controllers: [app_controller_1.AppController],
            providers: [app_service_1.AppService],
        }).compile();
        appController = app.get(app_controller_1.AppController);
    });
    describe("getStatus", () => {
        it("should return app status", () => {
            const result = appController.getStatus();
            expect(result.status).toBe("running");
            expect(result.version).toBe("1.0.0");
            expect(result.timestamp).toBeDefined();
        });
    });
    describe("getHealth", () => {
        it("should return health status", () => {
            const result = appController.getHealth();
            expect(result.status).toBe("healthy");
            expect(result.timestamp).toBeDefined();
            expect(typeof result.uptime).toBe("number");
        });
    });
});
//# sourceMappingURL=app.controller.spec.js.map