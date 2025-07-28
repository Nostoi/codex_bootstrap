import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { TasksController, UserSettingsController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

@Module({
  imports: [PrismaModule],
  controllers: [TasksController, UserSettingsController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
