import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { TasksController, UserSettingsController } from "./tasks.controller";
import { TasksService } from "./tasks.service";

@Module({
  imports: [PrismaModule, forwardRef(() => NotificationsModule)],
  controllers: [TasksController, UserSettingsController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
