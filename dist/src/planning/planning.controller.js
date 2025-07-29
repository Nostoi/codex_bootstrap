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
var PlanningController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanningController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const daily_planner_service_1 = require("./daily-planner.service");
const planning_dto_1 = require("./dto/planning.dto");
let PlanningController = PlanningController_1 = class PlanningController {
    constructor(plannerService) {
        this.plannerService = plannerService;
        this.logger = new common_1.Logger(PlanningController_1.name);
    }
    async generateTodaysPlan(dateString, req) {
        const userId = req?.user?.id || "temp-user-id";
        const date = dateString ? new Date(dateString) : new Date();
        this.logger.log(`Generating plan for user ${userId} on ${date.toISOString()}`);
        return this.plannerService.generatePlan(userId, date);
    }
};
exports.PlanningController = PlanningController;
__decorate([
    (0, common_1.Get)("today"),
    (0, swagger_1.ApiOperation)({
        summary: "Generate optimized daily plan",
        description: "Creates an energy-aware daily schedule based on task metadata, user energy patterns, and dependencies",
    }),
    (0, swagger_1.ApiQuery)({
        name: "date",
        required: false,
        description: "Date for plan generation (YYYY-MM-DD). Defaults to today.",
        example: "2025-07-28",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Successfully generated daily plan",
        type: planning_dto_1.DailyPlanResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: "Invalid date format or plan generation failed",
    }),
    __param(0, (0, common_1.Query)("date")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlanningController.prototype, "generateTodaysPlan", null);
exports.PlanningController = PlanningController = PlanningController_1 = __decorate([
    (0, swagger_1.ApiTags)("Planning"),
    (0, common_1.Controller)("plans"),
    __metadata("design:paramtypes", [daily_planner_service_1.DailyPlannerService])
], PlanningController);
//# sourceMappingURL=planning.controller.js.map