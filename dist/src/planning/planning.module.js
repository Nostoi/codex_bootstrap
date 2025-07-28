"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanningModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const tasks_module_1 = require("../tasks/tasks.module");
const planning_controller_1 = require("./planning.controller");
const daily_planner_service_1 = require("./daily-planner.service");
let PlanningModule = class PlanningModule {
};
exports.PlanningModule = PlanningModule;
exports.PlanningModule = PlanningModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, tasks_module_1.TasksModule],
        controllers: [planning_controller_1.PlanningController],
        providers: [daily_planner_service_1.DailyPlannerService],
        exports: [daily_planner_service_1.DailyPlannerService],
    })
], PlanningModule);
//# sourceMappingURL=planning.module.js.map