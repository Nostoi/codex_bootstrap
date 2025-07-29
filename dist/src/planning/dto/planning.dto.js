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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleBlockDto = exports.TaskSummaryDto = exports.DailyPlanResponseDto = exports.GeneratePlanDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class GeneratePlanDto {
}
exports.GeneratePlanDto = GeneratePlanDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Date for plan generation (YYYY-MM-DD)",
        example: "2025-07-28",
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GeneratePlanDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "User ID to generate plan for", required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GeneratePlanDto.prototype, "userId", void 0);
class DailyPlanResponseDto {
}
exports.DailyPlanResponseDto = DailyPlanResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Date of the plan" }),
    __metadata("design:type", String)
], DailyPlanResponseDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Scheduled task blocks" }),
    __metadata("design:type", Array)
], DailyPlanResponseDto.prototype, "scheduleBlocks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Tasks that could not be scheduled" }),
    __metadata("design:type", Array)
], DailyPlanResponseDto.prototype, "unscheduledTasks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Total estimated minutes for scheduled tasks" }),
    __metadata("design:type", Number)
], DailyPlanResponseDto.prototype, "totalEstimatedMinutes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Energy optimization score (0-1)" }),
    __metadata("design:type", Number)
], DailyPlanResponseDto.prototype, "energyOptimization", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Focus optimization score (0-1)" }),
    __metadata("design:type", Number)
], DailyPlanResponseDto.prototype, "focusOptimization", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Deadline risk score (0-1)" }),
    __metadata("design:type", Number)
], DailyPlanResponseDto.prototype, "deadlineRisk", void 0);
class TaskSummaryDto {
}
exports.TaskSummaryDto = TaskSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Task ID" }),
    __metadata("design:type", String)
], TaskSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Task title" }),
    __metadata("design:type", String)
], TaskSummaryDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Task description" }),
    __metadata("design:type", String)
], TaskSummaryDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Energy level required" }),
    __metadata("design:type", String)
], TaskSummaryDto.prototype, "energyLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Focus type required" }),
    __metadata("design:type", String)
], TaskSummaryDto.prototype, "focusType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Estimated minutes" }),
    __metadata("design:type", Number)
], TaskSummaryDto.prototype, "estimatedMinutes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Priority (1-5)" }),
    __metadata("design:type", Number)
], TaskSummaryDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Hard deadline if any" }),
    __metadata("design:type", String)
], TaskSummaryDto.prototype, "hardDeadline", void 0);
class ScheduleBlockDto {
}
exports.ScheduleBlockDto = ScheduleBlockDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Block start time" }),
    __metadata("design:type", String)
], ScheduleBlockDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Block end time" }),
    __metadata("design:type", String)
], ScheduleBlockDto.prototype, "endTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Scheduled task" }),
    __metadata("design:type", TaskSummaryDto)
], ScheduleBlockDto.prototype, "task", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Energy match score (0-1)" }),
    __metadata("design:type", Number)
], ScheduleBlockDto.prototype, "energyMatch", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Focus type match score (0-1)" }),
    __metadata("design:type", Number)
], ScheduleBlockDto.prototype, "focusMatch", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Reasoning for scheduling decision" }),
    __metadata("design:type", String)
], ScheduleBlockDto.prototype, "reasoning", void 0);
//# sourceMappingURL=planning.dto.js.map