import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { User } from '../../../auth/user.decorator';
import { CalendarSyncService } from '../services/calendar-sync.service';
import { ConflictResolver } from '../services/conflict-resolver.service';
import {
  StartSyncDto,
  ResolveConflictDto,
  SyncStatusResponseDto,
  SyncResultDto,
  ConflictInfoDto,
  ConflictStatsDto,
} from '../dto/calendar-sync.dto';
import { 
  SyncDirection, 
  ConflictResolutionStrategy 
} from '../types/calendar-sync.types';

/**
 * Calendar Sync Controller
 * Provides REST API endpoints for calendar synchronization operations
 */
@Controller('calendar/sync')
@UseGuards(JwtAuthGuard)
export class CalendarSyncController {
  private readonly logger = new Logger(CalendarSyncController.name);

  constructor(
    private readonly calendarSyncService: CalendarSyncService,
    private readonly conflictResolver: ConflictResolver,
  ) {}

  /**
   * Start a new synchronization job
   * POST /calendar/sync/start
   */
  @Post('start')
  @HttpCode(HttpStatus.ACCEPTED)
  async startSync(
    @User() user: any,
    @Body() startSyncDto: StartSyncDto,
  ): Promise<{ jobId: string; status: string }> {
    this.logger.log(`Starting sync for user ${user.id} with direction: ${startSyncDto.direction}`);

    try {
      const jobId = await this.calendarSyncService.startSync(
        user.id,
        startSyncDto.direction,
        {
          calendarId: startSyncDto.calendarId,
          conflictResolution: startSyncDto.conflictResolution,
          forceFull: startSyncDto.forceFull,
          dateRange: startSyncDto.dateRange,
        }
      );

      return {
        jobId,
        status: 'started',
      };
    } catch (error) {
      this.logger.error(`Failed to start sync for user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Get synchronization status
   * GET /calendar/sync/status/:jobId
   */
  @Get('status/:jobId')
  async getSyncStatus(
    @User() user: any,
    @Param('jobId') jobId: string,
  ): Promise<SyncStatusResponseDto> {
    this.logger.debug(`Getting sync status for job ${jobId}`);

    try {
      const status = await this.calendarSyncService.getSyncStatus(jobId);
      
      if (!status) {
        throw new Error('Sync job not found');
      }

      return {
        jobId: status.jobId,
        status: status.status,
        direction: status.direction,
        progress: status.progress,
        startedAt: status.startedAt,
        completedAt: status.completedAt,
        error: status.error,
        result: status.result,
      };
    } catch (error) {
      this.logger.error(`Failed to get sync status for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get sync history for user
   * GET /calendar/sync/history
   */
  @Get('history')
  async getSyncHistory(
    @User() user: any,
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ): Promise<SyncResultDto[]> {
    this.logger.debug(`Getting sync history for user ${user.id}`);

    try {
      const history = await this.calendarSyncService.getSyncHistory(
        user.id,
        parseInt(limit, 10),
        parseInt(offset, 10)
      );

      return history.map(this.mapSyncStateToDto);
    } catch (error) {
      this.logger.error(`Failed to get sync history for user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Stop an active synchronization job
   * POST /calendar/sync/stop/:jobId
   */
  @Post('stop/:jobId')
  @HttpCode(HttpStatus.OK)
  async stopSync(
    @User() user: any,
    @Param('jobId') jobId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Stopping sync job ${jobId} for user ${user.id}`);

    try {
      await this.calendarSyncService.stopSync(jobId);
      
      return {
        success: true,
        message: 'Sync job stopped successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to stop sync job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Force a full synchronization (reset delta tokens)
   * POST /calendar/sync/reset
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async resetSync(
    @User() user: any,
    @Query('calendarId') calendarId?: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Resetting sync state for user ${user.id}, calendar: ${calendarId || 'default'}`);

    try {
      await this.calendarSyncService.resetSyncState(user.id, calendarId);
      
      return {
        success: true,
        message: 'Sync state reset successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to reset sync state for user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Get pending conflicts
   * GET /calendar/sync/conflicts
   */
  @Get('conflicts')
  async getPendingConflicts(
    @User() user: any,
  ): Promise<ConflictInfoDto[]> {
    this.logger.debug(`Getting pending conflicts for user ${user.id}`);

    try {
      const conflicts = await this.conflictResolver.getPendingConflicts(user.id);
      
      return conflicts.map(conflict => ({
        id: conflict.id,
        eventId: conflict.eventId,
        conflictType: conflict.conflictType,
        conflictData: conflict.conflictData,
        createdAt: conflict.createdAt,
        syncStateId: conflict.syncStateId,
      }));
    } catch (error) {
      this.logger.error(`Failed to get pending conflicts for user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Resolve a conflict
   * PUT /calendar/sync/conflicts/:conflictId/resolve
   */
  @Put('conflicts/:conflictId/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveConflict(
    @User() user: any,
    @Param('conflictId') conflictId: string,
    @Body() resolveConflictDto: ResolveConflictDto,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Resolving conflict ${conflictId} with resolution: ${resolveConflictDto.resolution}`);

    try {
      await this.conflictResolver.resolveConflictManually(
        conflictId,
        resolveConflictDto.resolution,
        resolveConflictDto.resolvedData || {}
      );
      
      return {
        success: true,
        message: 'Conflict resolved successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to resolve conflict ${conflictId}:`, error);
      throw error;
    }
  }

  /**
   * Get conflict statistics
   * GET /calendar/sync/conflicts/stats
   */
  @Get('conflicts/stats')
  async getConflictStats(
    @User() user: any,
    @Query('days') days: string = '30',
  ): Promise<ConflictStatsDto> {
    this.logger.debug(`Getting conflict stats for user ${user.id}`);

    try {
      const daysNum = parseInt(days, 10);
      const timeRange = {
        start: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const stats = await this.conflictResolver.getConflictStats(user.id, timeRange);
      
      return {
        total: stats.total,
        pending: stats.pending,
        resolved: stats.resolved,
        resolutionBreakdown: stats.resolutionBreakdown,
        timeRange: {
          start: timeRange.start,
          end: timeRange.end,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get conflict stats for user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Test sync capabilities for user
   * GET /calendar/sync/test
   */
  @Get('test')
  async testSyncCapabilities(
    @User() user: any,
    @Query('calendarId') calendarId?: string,
  ): Promise<{
    canSync: boolean;
    deltaSupported: boolean;
    calendars: any[];
    lastSyncTime?: Date;
  }> {
    this.logger.debug(`Testing sync capabilities for user ${user.id}`);

    try {
      const result = await this.calendarSyncService.testSyncCapabilities(user.id, calendarId);
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to test sync capabilities for user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Get current sync settings
   * GET /calendar/sync/settings
   */
  @Get('settings')
  async getSyncSettings(
    @User() user: any,
  ): Promise<{
    autoSync: boolean;
    syncInterval: number;
    conflictResolution: ConflictResolutionStrategy;
    calendars: string[];
  }> {
    this.logger.debug(`Getting sync settings for user ${user.id}`);

    try {
      // This would typically come from user preferences/settings
      // For now, return default settings
      return {
        autoSync: false,
        syncInterval: 15, // minutes
        conflictResolution: 'prefer_latest' as ConflictResolutionStrategy,
        calendars: ['default'],
      };
    } catch (error) {
      this.logger.error(`Failed to get sync settings for user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Update sync settings
   * PUT /calendar/sync/settings
   */
  @Put('settings')
  @HttpCode(HttpStatus.OK)
  async updateSyncSettings(
    @User() user: any,
    @Body() settings: {
      autoSync?: boolean;
      syncInterval?: number;
      conflictResolution?: ConflictResolutionStrategy;
      calendars?: string[];
    },
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Updating sync settings for user ${user.id}`);

    try {
      // This would typically update user preferences/settings
      // For now, just acknowledge the request
      this.logger.debug('Sync settings updated:', settings);
      
      return {
        success: true,
        message: 'Sync settings updated successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to update sync settings for user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Get sync metrics
   * GET /calendar/sync/metrics
   */
  @Get('metrics')
  async getSyncMetrics(
    @User() user: any,
    @Query('days') days: string = '7',
  ): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    eventsProcessed: number;
    averageSyncTime: number;
    conflictsGenerated: number;
  }> {
    this.logger.debug(`Getting sync metrics for user ${user.id}`);

    try {
      const daysNum = parseInt(days, 10);
      const metrics = await this.calendarSyncService.getSyncMetrics(user.id, daysNum);
      
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to get sync metrics for user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to map sync state to DTO
   */
  private mapSyncStateToDto(syncState: any): SyncResultDto {
    return {
      id: syncState.id,
      direction: syncState.direction,
      status: syncState.status,
      startedAt: syncState.startedAt,
      completedAt: syncState.completedAt,
      totalEvents: syncState.totalEvents,
      processedEvents: syncState.processedEvents,
      createdEvents: syncState.createdEvents,
      updatedEvents: syncState.updatedEvents,
      deletedEvents: syncState.deletedEvents,
      conflictsDetected: syncState.conflictsDetected,
      error: syncState.error,
    };
  }
}
