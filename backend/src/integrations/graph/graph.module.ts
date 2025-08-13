import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';
import { GraphConfigService } from './config/graph-config.service';
import { GraphAuthService } from './auth/graph-auth.service';
import { GraphAuthController } from './auth/graph-auth.controller';
import { CalendarSyncModule } from './sync/calendar-sync.module';

@Module({
  imports: [ConfigModule, CalendarSyncModule],
  controllers: [GraphController, GraphAuthController],
  providers: [GraphService, GraphConfigService, GraphAuthService],
  exports: [GraphService, GraphConfigService, GraphAuthService, CalendarSyncModule],
})
export class GraphModule {}
