import { Module, forwardRef } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationHistoryService } from './notification-history.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsGateway,
    NotificationsService, 
    NotificationHistoryService,
    NotificationPreferencesService,
    NotificationTemplatesService
  ],
  exports: [
    NotificationsService, 
    NotificationsGateway,
    NotificationHistoryService,
    NotificationPreferencesService,
    NotificationTemplatesService
  ],
})
export class NotificationsModule {}
