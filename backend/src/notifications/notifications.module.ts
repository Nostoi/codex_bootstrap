import { Module, forwardRef } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
