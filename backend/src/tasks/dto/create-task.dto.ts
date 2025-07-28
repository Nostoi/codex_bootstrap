import { EnergyLevel, FocusType, TaskSource } from "@prisma/client";

export class CreateTaskDto {
  title!: string;
  description?: string;
  dueDate?: string;
  energyLevel?: EnergyLevel;
  focusType?: FocusType;
  estimatedMinutes?: number;
  priority?: number;
  softDeadline?: string;
  hardDeadline?: string;
  source?: TaskSource;
  aiSuggestion?: string;
  projectId?: string;
}
