import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SyncDirection, SyncTrigger } from '../types/calendar-sync.types';

export class StartSyncDto {
  @ApiProperty({ enum: SyncDirection, description: 'Direction of synchronization' })
  @IsEnum(SyncDirection)
  direction: SyncDirection;

  @ApiProperty({ enum: SyncTrigger, description: 'What triggered this sync' })
  @IsEnum(SyncTrigger)
  trigger: SyncTrigger;

  @ApiPropertyOptional({ description: 'Perform full sync instead of delta sync' })
  @IsOptional()
  @IsBoolean()
  fullSync?: boolean;

  @ApiPropertyOptional({ description: 'Specific calendar IDs to sync (default: all calendars)' })
  @IsOptional()
  @IsString({ each: true })
  calendarIds?: string[];

  @ApiPropertyOptional({ enum: ['AUTO', 'MANUAL'], description: 'How to handle conflicts' })
  @IsOptional()
  @IsEnum(['AUTO', 'MANUAL'])
  conflictResolution?: 'AUTO' | 'MANUAL';
}

export class SyncStatusResponseDto {
  @ApiProperty({ description: 'Whether sync is currently in progress' })
  syncInProgress: boolean;

  @ApiProperty({ description: 'Current sync job ID if running' })
  jobId?: string;

  @ApiProperty({ description: 'Sync progress percentage (0-100)' })
  progress: number;

  @ApiProperty({ description: 'Last sync timestamp' })
  lastSyncTime?: Date;

  @ApiProperty({ description: 'Next scheduled sync time' })
  nextSyncTime?: Date;

  @ApiProperty({ description: 'Total number of events' })
  totalEvents: number;

  @ApiProperty({ description: 'Number of synced events' })
  syncedEvents: number;

  @ApiProperty({ description: 'Number of conflicted events' })
  conflictedEvents: number;

  @ApiProperty({ description: 'Number of failed events' })
  failedEvents: number;
}

export class ResolveConflictDto {
  @ApiProperty({
    enum: ['USE_LOCAL', 'USE_REMOTE', 'MERGE', 'SKIP'],
    description: 'How to resolve the conflict',
  })
  @IsEnum(['USE_LOCAL', 'USE_REMOTE', 'MERGE', 'SKIP'])
  resolution: 'USE_LOCAL' | 'USE_REMOTE' | 'MERGE' | 'SKIP';

  @ApiPropertyOptional({ description: 'Merged event data (required if resolution is MERGE)' })
  @IsOptional()
  mergedData?: {
    subject?: string;
    description?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    timeZone?: string;
    isAllDay?: boolean;
  };

  @ApiPropertyOptional({ description: 'Resolution notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SyncHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Number of records to return', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Number of records to skip' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({ description: 'Filter by sync status' })
  @IsOptional()
  @IsEnum(['COMPLETED', 'FAILED', 'IN_PROGRESS'])
  status?: 'COMPLETED' | 'FAILED' | 'IN_PROGRESS';

  @ApiPropertyOptional({ description: 'Filter syncs after this date' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter syncs before this date' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class SyncResultDto {
  @ApiProperty({ description: 'Whether the sync was successful' })
  success: boolean;

  @ApiProperty({ description: 'Sync job ID' })
  jobId: string;

  @ApiProperty({ description: 'Number of events synced' })
  syncedCount: number;

  @ApiProperty({ description: 'Number of conflicts detected' })
  conflictCount: number;

  @ApiProperty({ description: 'Number of errors encountered' })
  errorCount: number;

  @ApiProperty({ description: 'Sync duration in milliseconds' })
  duration: number;

  @ApiProperty({ description: 'Sync start time' })
  startTime: Date;

  @ApiProperty({ description: 'Sync end time' })
  endTime: Date;

  @ApiPropertyOptional({ description: 'Error messages if any' })
  errors?: string[];

  @ApiPropertyOptional({ description: 'Conflict information' })
  conflicts?: Array<{
    eventId: string;
    conflictType: string;
    autoResolvable: boolean;
  }>;
}

export class ConflictListDto {
  @ApiProperty({ description: 'Conflict ID' })
  id: string;

  @ApiProperty({ description: 'Calendar event ID' })
  eventId: string;

  @ApiProperty({ description: 'Type of conflict' })
  conflictType: string;

  @ApiProperty({ description: 'Whether conflict can be auto-resolved' })
  autoResolvable: boolean;

  @ApiProperty({ description: 'When the conflict was detected' })
  detectedAt: Date;

  @ApiProperty({ description: 'Current resolution status' })
  resolution: string;

  @ApiProperty({ description: 'Local version of the event' })
  localVersion: any;

  @ApiProperty({ description: 'Remote version of the event' })
  remoteVersion: any;
}

export class SyncScheduleDto {
  @ApiProperty({ description: 'Enable automatic sync' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'Sync interval in minutes', minimum: 5, maximum: 1440 })
  @IsNumber()
  @Min(5)
  @Max(1440)
  intervalMinutes: number;

  @ApiPropertyOptional({ description: 'Sync only during these hours (24h format)' })
  @IsOptional()
  syncHours?: {
    start: string; // HH:mm format
    end: string; // HH:mm format
  };

  @ApiPropertyOptional({ description: 'Days of week to sync (0=Sunday, 6=Saturday)' })
  @IsOptional()
  @IsNumber({}, { each: true })
  syncDays?: number[];
}
