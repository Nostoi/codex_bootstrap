"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsController = void 0;
const common_1 = require("@nestjs/common");
const metrics_service_1 = require("./metrics.service");
let MetricsController = class MetricsController {
    constructor(metrics) {
        this.metrics = metrics;
    }
    log(body) {
        return this.metrics.record(body.userId, body.action);
    }
    adoption(action = "login") {
        return { count: this.metrics.countByAction(action) };
    }
    bugs() {
        return { count: this.metrics.countByAction("bug") };
    }
};
exports.MetricsController = MetricsController;
__decorate([
    (0, common_1.Post)("log"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "log", null);
__decorate([
    (0, common_1.Get)("adoption"),
    __param(0, (0, common_1.Query)("action")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "adoption", null);
__decorate([
    (0, common_1.Get)("bugs"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MetricsController.prototype, "bugs", null);
exports.MetricsController = MetricsController = __decorate([
    (0, common_1.Controller)("metrics"),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService])
], MetricsController);
//# sourceMappingURL=metrics.controller.js.map