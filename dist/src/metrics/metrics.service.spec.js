"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const metrics_service_1 = require("./metrics.service");
describe("MetricsService", () => {
    it("records and counts actions", () => {
        const service = new metrics_service_1.MetricsService();
        service.record("u1", "login");
        service.record("u2", "login");
        expect(service.countByAction("login")).toBe(2);
    });
});
//# sourceMappingURL=metrics.service.spec.js.map