import { IsDateString, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GeneratePlanDto {
  @ApiProperty({
    description: "Date for plan generation (YYYY-MM-DD)",
    example: "2025-07-28",
  })
  @IsDateString()
  date: string;

  @ApiProperty({ description: "User ID to generate plan for", required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class DailyPlanResponseDto {
  @ApiProperty({ description: "Date of the plan" })
  date: string;

  @ApiProperty({ description: "Scheduled task blocks" })
  scheduleBlocks: ScheduleBlockDto[];

  @ApiProperty({ description: "Tasks that could not be scheduled" })
  unscheduledTasks: TaskSummaryDto[];

  @ApiProperty({ description: "Total estimated minutes for scheduled tasks" })
  totalEstimatedMinutes: number;

  @ApiProperty({ description: "Energy optimization score (0-1)" })
  energyOptimization: number;

  @ApiProperty({ description: "Focus optimization score (0-1)" })
  focusOptimization: number;

  @ApiProperty({ description: "Deadline risk score (0-1)" })
  deadlineRisk: number;
}

export class ScheduleBlockDto {
  @ApiProperty({ description: "Block start time" })
  startTime: string;

  @ApiProperty({ description: "Block end time" })
  endTime: string;

  @ApiProperty({ description: "Scheduled task" })
  task: TaskSummaryDto;

  @ApiProperty({ description: "Energy match score (0-1)" })
  energyMatch: number;

  @ApiProperty({ description: "Focus type match score (0-1)" })
  focusMatch: number;

  @ApiProperty({ description: "Reasoning for scheduling decision" })
  reasoning: string;
}

export class TaskSummaryDto {
  @ApiProperty({ description: "Task ID" })
  id: string;

  @ApiProperty({ description: "Task title" })
  title: string;

  @ApiProperty({ description: "Task description" })
  description?: string;

  @ApiProperty({ description: "Energy level required" })
  energyLevel?: string;

  @ApiProperty({ description: "Focus type required" })
  focusType?: string;

  @ApiProperty({ description: "Estimated minutes" })
  estimatedMinutes?: number;

  @ApiProperty({ description: "Priority (1-5)" })
  priority?: number;

  @ApiProperty({ description: "Hard deadline if any" })
  hardDeadline?: string;
}
