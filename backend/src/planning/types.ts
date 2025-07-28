import { Task, UserSettings, EnergyLevel, FocusType } from '@prisma/client';

export interface PlanningInput {
  userId: string;
  date: Date;
  availableTasks: Task[];
  userSettings: UserSettings;
  workingHours: TimeSlot[];
  existingCommitments: TimeSlot[];
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  energyLevel: EnergyLevel;
  preferredFocusTypes: FocusType[];
  isAvailable: boolean;
}

export interface ScoredTask extends Task {
  score: number;
  priorityScore: number;
  deadlineScore: number;
  energyScore: number;
  focusScore: number;
}

export interface ScheduleAssignment {
  task: Task;
  timeSlot: TimeSlot;
  energyMatch: number;
  focusMatch: number;
  reasoning: string;
}

export interface ScheduleBlock {
  startTime: Date;
  endTime: Date;
  task: Task;
  energyMatch: number;
  focusMatch: number;
  reasoning: string;
}

export interface DailyPlan {
  date: Date;
  scheduleBlocks: ScheduleBlock[];
  unscheduledTasks: Task[];
  totalEstimatedMinutes: number;
  energyOptimization: number;
  focusOptimization: number;
  deadlineRisk: number;
}

export interface OptimizationResult {
  energyOptimization: number;
  focusOptimization: number;
  deadlineRisk: number;
}

export interface DependencyGraph {
  nodes: Map<string, Task>;
  edges: Map<string, Set<string>>;
  inDegree: Map<string, number>;
}
