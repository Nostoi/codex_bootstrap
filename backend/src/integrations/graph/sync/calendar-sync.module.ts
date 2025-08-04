import { Module } from '@nestjs/common';
import { CalendarSyncService } from './services/calendar-sync.service';
import { DeltaSyncManager } from './services/delta-sync.manager';
import { ConflictResolver } from './services/conflict-resolver.service';
import { CalendarSyncController } from './controllers/calendar-sync.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthModule } from '../../../auth/auth.module';
// Import specific services directly to avoid circular dependency
import { GraphService } from '../graph.service';
import { GraphAuthService } from '../auth/graph-auth.service';
import { GraphConfigService } from '../config/graph-config.service';

/**
 * Calendar Sync Module
 * Provides comprehensive calendar synchronization capabilities
 *
 * All calendar sync services have been re-enabled after fixing compatibility issues:
 * ✅ Updated type interfaces to match current schema
 * ✅ Fixed service method signatures
 * ✅ Resolved interface compatibility issues
 */
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CalendarSyncController],
  providers: [
    CalendarSyncService,
    DeltaSyncManager,
    ConflictResolver,
    // Include Graph services directly to avoid circular dependency
    GraphService,
    GraphAuthService,
    GraphConfigService,
  ],
  exports: [CalendarSyncService, DeltaSyncManager, ConflictResolver],
})
export class CalendarSyncModule {}
