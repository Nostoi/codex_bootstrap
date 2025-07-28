import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { PlanningController } from './planning.controller';
import { DailyPlannerService } from './daily-planner.service';

@Module({
  imports: [PrismaModule, TasksModule],
  controllers: [PlanningController],
  providers: [DailyPlannerService],
  exports: [DailyPlannerService],
})
export class PlanningModule {}
