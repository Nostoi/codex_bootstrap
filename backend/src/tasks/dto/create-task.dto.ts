import { EnergyLevel, FocusType, TaskSource } from '@prisma/client';
import { IsString, IsOptional, IsEnum, IsNumber, IsInt, Min, Max } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(EnergyLevel)
  energyLevel?: EnergyLevel;

  @IsOptional()
  @IsEnum(FocusType)
  focusType?: FocusType;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  priority?: number;

  @IsOptional()
  @IsString()
  softDeadline?: string;

  @IsOptional()
  @IsString()
  hardDeadline?: string;

  @IsOptional()
  @IsEnum(TaskSource)
  source?: TaskSource;

  @IsOptional()
  @IsString()
  aiSuggestion?: string;

  @IsOptional()
  @IsString()
  projectId?: string;
}
