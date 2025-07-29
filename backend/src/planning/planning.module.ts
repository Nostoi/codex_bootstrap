import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { TasksModule } from "../tasks/tasks.module";
import { GoogleModule } from "../integrations/google/google.module";
import { PlanningController } from "./planning.controller";
import { DailyPlannerService } from "./daily-planner.service";

@Module({
  imports: [PrismaModule, TasksModule, GoogleModule],
  controllers: [PlanningController],
  providers: [DailyPlannerService],
  exports: [DailyPlannerService],
})
export class PlanningModule {}
