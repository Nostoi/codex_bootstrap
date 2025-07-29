export declare class GeneratePlanDto {
    date: string;
    userId?: string;
}
export declare class DailyPlanResponseDto {
    date: string;
    scheduleBlocks: ScheduleBlockDto[];
    unscheduledTasks: TaskSummaryDto[];
    totalEstimatedMinutes: number;
    energyOptimization: number;
    focusOptimization: number;
    deadlineRisk: number;
}
export declare class TaskSummaryDto {
    id: string;
    title: string;
    description?: string;
    energyLevel?: string;
    focusType?: string;
    estimatedMinutes?: number;
    priority?: number;
    hardDeadline?: string;
}
export declare class ScheduleBlockDto {
    startTime: string;
    endTime: string;
    task: TaskSummaryDto;
    energyMatch: number;
    focusMatch: number;
    reasoning: string;
}
