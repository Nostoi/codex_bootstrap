import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module'; // Re-enabled
import { TasksController, UserSettingsController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [PrismaModule, forwardRef(() => NotificationsModule)], // Re-enabled NotificationsModule
  controllers: [TasksController, UserSettingsController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
