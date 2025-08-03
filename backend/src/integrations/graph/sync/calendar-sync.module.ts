import { Module } from '@nestjs/common';
// import { CalendarSyncService } from './services/calendar-sync.service';
// import { DeltaSyncManager } from './services/delta-sync.manager';
// import { ConflictResolver } from './services/conflict-resolver.service';
import { CalendarSyncController } from './controllers/calendar-sync.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
// import { GraphModule } from '../graph.module'; // Avoid circular dependency
import { AuthModule } from '../../../auth/auth.module';

/**
 * Calendar Sync Module
 * Provides comprehensive calendar synchronization capabilities
 */
@Module({
  imports: [
    PrismaModule,
    // GraphModule, // Temporarily disabled to avoid circular dependency
    AuthModule,
  ],
  controllers: [CalendarSyncController],
  providers: [
    // CalendarSyncService,
    // DeltaSyncManager,
    // ConflictResolver,
  ],
  exports: [
    // CalendarSyncService,
    // DeltaSyncManager,
    // ConflictResolver,
  ],
})
export class CalendarSyncModule {}
