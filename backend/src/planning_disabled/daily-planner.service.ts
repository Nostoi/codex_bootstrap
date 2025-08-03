import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TasksService } from "../tasks/tasks.service";
import { GoogleService } from "../integrations_disabled/google/google.service";
import { GraphService } from "../integrations_disabled/graph/graph.service";
import {
  Task,
  UserSettings,
  EnergyLevel,
  FocusType,
  TaskStatus,
} from "@prisma/client";
import {
  PlanningInput,
  TimeSlot,
  ScoredTask,
  ScheduleAssignment,
  ScheduleBlock,
  DailyPlan,
  OptimizationResult,
  DependencyGraph,
  DependencyResolutionResult,
  BlockedTask,
  BlockingReason,
  CalendarEvent,
} from "./types";
import { DailyPlanResponseDto } from "./dto";

@Injectable()
export class DailyPlannerService {
  private readonly logger = new Logger(DailyPlannerService.name);

  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService,
    private googleService: GoogleService,
    private graphService: GraphService,
  ) {}

  /**
   * Generate optimized daily plan for a user
   */
  async generatePlan(
    userId: string,
    date: Date,
  ): Promise<DailyPlanResponseDto> {
    try {
      this.logger.log(
        `Generating plan for user ${userId} on ${date.toISOString()}`,
      );

      // 1. Gather required data
      const input = await this.gatherPlanningData(userId, date);

      // 2. Filter ready tasks (resolve dependencies)
      const readyTasks = await this.filterReadyTasks(input.availableTasks);

      // 3. Score tasks based on multiple factors
      const scoredTasks = this.scoreTasks(readyTasks, date, input.userSettings);

      // 4. Generate available time slots
      const timeSlots = this.generateTimeSlots(
        date,
        input.userSettings,
        input.existingCommitments,
      );

      // 5. Assign tasks to optimal time slots
      const assignments = this.assignTasksToSlots(scoredTasks, timeSlots);

      // 6. Create schedule blocks
      const scheduleBlocks = this.createScheduleBlocks(assignments);

      // 7. Calculate optimization metrics
      const optimization = this.calculateOptimizationMetrics(
        scheduleBlocks,
        scoredTasks,
      );

      const plan: DailyPlan = {
        date,
        scheduleBlocks,
        unscheduledTasks: scoredTasks.filter((t) => !assignments.has(t.id)),
        totalEstimatedMinutes: scheduleBlocks.reduce(
          (sum, block) => sum + (block.task.estimatedMinutes || 30),
          0,
        ),
        ...optimization,
      };

      return this.transformToDto(plan);
    } catch (error) {
      this.logger.error(
        `Failed to generate plan: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Plan generation failed: ${error.message}`);
    }
  }

  /**
   * Get calendar events for a specific date
   * Public method to expose calendar data for frontend integration
   */
  async getCalendarEventsForDate(
    userId: string,
    date: Date,
  ): Promise<CalendarEvent[]> {
    try {
      this.logger.log(
        `Retrieving calendar events for user ${userId} on ${date.toISOString()}`,
      );

      const timeSlots = await this.getExistingCommitments(userId, date);
      
      // Convert TimeSlot objects to CalendarEvent objects
      const calendarEvents: CalendarEvent[] = timeSlots
        .filter(slot => !slot.isAvailable && slot.title) // Only get actual events with titles
        .map(slot => ({
          id: slot.eventId || `${slot.source}-${slot.startTime.getTime()}`,
          title: slot.title || 'Untitled Event',
          description: slot.description,
          startTime: slot.startTime,
          endTime: slot.endTime,
          source: slot.source || 'google',
          energyLevel: slot.energyLevel,
          focusType: slot.preferredFocusTypes[0], // Take first focus type
          isAllDay: slot.isAllDay || false,
        }));

      this.logger.log(
        `Retrieved ${calendarEvents.length} calendar events for user ${userId}`,
      );

      return calendarEvents;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve calendar events for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Calendar events retrieval failed: ${error.message}`,
      );
    }
  }

  /**
   * Gather all data needed for planning
   */
  private async gatherPlanningData(
    userId: string,
    date: Date,
  ): Promise<PlanningInput> {
    // Get user's pending tasks
    const tasks = await this.tasksService.findAll(userId);
    const availableTasks = tasks.filter(
      (task) =>
        task.status !== TaskStatus.DONE && task.status !== TaskStatus.BLOCKED,
    );

    // Get user settings or create defaults
    let userSettings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!userSettings) {
      userSettings = await this.prisma.userSettings.create({
        data: {
          userId,
          morningEnergyLevel: EnergyLevel.HIGH,
          afternoonEnergyLevel: EnergyLevel.MEDIUM,
          workStartTime: "09:00",
          workEndTime: "17:00",
          focusSessionLength: 90,
          preferredFocusTypes: [],
        },
      });
    }

    // Get working hours for the date
    const workingHours = this.getWorkingHours(date, userSettings);

    // Get existing commitments from calendar integration
    const existingCommitments = await this.getExistingCommitments(userId, date);

    return {
      userId,
      date,
      availableTasks,
      userSettings,
      workingHours,
      existingCommitments,
    };
  }

  /**
   * Filter tasks that are ready to be scheduled (no blocking dependencies)
   */
  private async filterReadyTasks(tasks: Task[]): Promise<Task[]> {
    const dependencyGraph = await this.buildDependencyGraph(tasks);

    // Detect circular dependencies
    this.detectCircularDependencies(dependencyGraph);

    // Return tasks with no incomplete dependencies
    const readyTasks: Task[] = [];

    for (const task of tasks) {
      const dependencies = dependencyGraph.edges.get(task.id) || new Set();
      const isReady = Array.from(dependencies).every((depId) => {
        const depTask = dependencyGraph.nodes.get(depId);
        return depTask?.status === TaskStatus.DONE;
      });

      if (isReady) {
        readyTasks.push(task);
      }
    }

    this.logger.log(
      `Filtered ${readyTasks.length} ready tasks from ${tasks.length} total`,
    );
    return readyTasks;
  }

  /**
   * Build dependency graph from tasks
   */
  private async buildDependencyGraph(tasks: Task[]): Promise<DependencyGraph> {
    const nodes = new Map<string, Task>();
    const edges = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    // Initialize nodes
    for (const task of tasks) {
      nodes.set(task.id, task);
      edges.set(task.id, new Set());
      inDegree.set(task.id, 0);
    }

    // Get all dependencies and build edges
    for (const task of tasks) {
      const dependencies = await this.tasksService.findTaskDependencies(
        task.id,
      );

      for (const dep of dependencies) {
        const depTaskId = dep.dependsOn;
        if (nodes.has(depTaskId)) {
          edges.get(depTaskId)?.add(task.id);
          inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
        }
      }
    }

    return { nodes, edges, inDegree };
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(graph: DependencyGraph): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true; // Back edge found - cycle detected
      }
      if (visited.has(nodeId)) {
        return false; // Already processed
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = graph.edges.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId) && hasCycle(nodeId)) {
        throw new BadRequestException(
          `Circular dependency detected involving task ${nodeId}. Please resolve dependencies manually.`,
        );
      }
    }
  }

  /**
   * Resolve task dependencies and return ready vs blocked tasks with detailed reasons
   * This is the main public interface for dependency resolution
   */
  async resolveTaskDependencies(
    tasks: Task[],
  ): Promise<DependencyResolutionResult> {
    try {
      this.logger.log(`Resolving dependencies for ${tasks.length} tasks`);

      const dependencyGraph = await this.buildDependencyGraph(tasks);

      // Check for circular dependencies first
      try {
        this.detectCircularDependencies(dependencyGraph);
      } catch (error) {
        // If circular dependency detected, mark all involved tasks as blocked
        return this.handleCircularDependencyError(tasks, error.message);
      }

      const readyTasks: Task[] = [];
      const blockedTasks: BlockedTask[] = [];

      for (const task of tasks) {
        const blockingReasons = await this.getTaskBlockingReasons(
          task,
          dependencyGraph,
        );

        if (blockingReasons.length === 0) {
          readyTasks.push(task);
        } else {
          blockedTasks.push({
            task,
            reasons: blockingReasons,
          });
        }
      }

      const result: DependencyResolutionResult = {
        readyTasks,
        blockedTasks,
        totalTasks: tasks.length,
        readyCount: readyTasks.length,
        blockedCount: blockedTasks.length,
      };

      this.logger.log(
        `Dependency resolution complete: ${result.readyCount} ready, ${result.blockedCount} blocked`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to resolve task dependencies: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Dependency resolution failed: ${error.message}`,
      );
    }
  }

  /**
   * Get detailed blocking reasons for a specific task
   */
  private async getTaskBlockingReasons(
    task: Task,
    dependencyGraph: DependencyGraph,
  ): Promise<BlockingReason[]> {
    const reasons: BlockingReason[] = [];

    try {
      // Get dependencies for this task
      const dependencies = await this.tasksService.findTaskDependencies(
        task.id,
      );

      for (const dep of dependencies) {
        const dependencyTaskId = dep.dependsOn;
        const dependencyTask = dependencyGraph.nodes.get(dependencyTaskId);

        if (!dependencyTask) {
          // Orphaned dependency - referenced task doesn't exist
          reasons.push({
            type: "orphaned_dependency",
            message: `Task depends on non-existent task ${dependencyTaskId}`,
            dependencyTaskId,
          });
        } else if (dependencyTask.status !== TaskStatus.DONE) {
          // Incomplete dependency
          reasons.push({
            type: "incomplete_dependency",
            message: `Task depends on incomplete task "${dependencyTask.title}" (${dependencyTask.status})`,
            dependencyTaskId,
          });
        }
      }

      return reasons;
    } catch (error) {
      this.logger.error(
        `Failed to get blocking reasons for task ${task.id}: ${error.message}`,
      );

      // Return a generic error reason if we can't determine specific blocking reasons
      reasons.push({
        type: "missing_dependency",
        message: `Unable to verify dependencies: ${error.message}`,
      });

      return reasons;
    }
  }

  /**
   * Handle circular dependency errors by marking all tasks as blocked
   */
  private handleCircularDependencyError(
    tasks: Task[],
    errorMessage: string,
  ): DependencyResolutionResult {
    const blockedTasks: BlockedTask[] = tasks.map((task) => ({
      task,
      reasons: [
        {
          type: "circular_dependency",
          message: errorMessage,
        },
      ],
    }));

    return {
      readyTasks: [],
      blockedTasks,
      totalTasks: tasks.length,
      readyCount: 0,
      blockedCount: tasks.length,
    };
  }

  /**
   * Score tasks based on weighted factors
   */
  private scoreTasks(
    tasks: Task[],
    targetDate: Date,
    userSettings: UserSettings,
  ): ScoredTask[] {
    return tasks
      .map((task) => {
        const scores = this.calculateTaskScore(task, targetDate, userSettings);
        return {
          ...task,
          score: scores.total,
          priorityScore: scores.priority,
          deadlineScore: scores.deadline,
          energyScore: scores.energy,
          focusScore: scores.focus,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate weighted task score
   */
  private calculateTaskScore(
    task: Task,
    targetDate: Date,
    _userSettings: UserSettings,
  ) {
    let priorityScore = 0;
    let deadlineScore = 0;
    let energyScore = 0;
    let focusScore = 0;

    // Priority weight (40% - up to 40 points)
    if (task.priority) {
      priorityScore = task.priority * 8; // 5 * 8 = 40 max
    }

    // Deadline urgency (30% - up to 30 points)
    if (task.hardDeadline) {
      const daysUntilDeadline = Math.max(
        0,
        (task.hardDeadline.getTime() - targetDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      deadlineScore = Math.max(0, 30 - daysUntilDeadline * 5);
    }

    // Energy level bonus (20% - up to 20 points)
    const energyBonus = {
      [EnergyLevel.HIGH]: 20,
      [EnergyLevel.MEDIUM]: 15,
      [EnergyLevel.LOW]: 10,
    };
    energyScore = energyBonus[task.energyLevel || EnergyLevel.MEDIUM];

    // Focus type clustering bonus (10% - up to 10 points)
    const focusBonus = {
      [FocusType.CREATIVE]: 8,
      [FocusType.TECHNICAL]: 8,
      [FocusType.ADMINISTRATIVE]: 6,
      [FocusType.SOCIAL]: 10,
    };
    focusScore = focusBonus[task.focusType || FocusType.ADMINISTRATIVE];

    const total = priorityScore + deadlineScore + energyScore + focusScore;

    return {
      total,
      priority: priorityScore,
      deadline: deadlineScore,
      energy: energyScore,
      focus: focusScore,
    };
  }

  /**
   * Generate energy-mapped time slots based on user settings and energy patterns
   */
  private generateTimeSlots(
    date: Date,
    userSettings: UserSettings,
    commitments: TimeSlot[],
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];

    // Parse user work hours with fallbacks
    const { hour: startHour, minute: startMinute } = this.parseWorkTime(
      userSettings.workStartTime || "09:00",
    );
    const { hour: endHour, minute: endMinute } = this.parseWorkTime(
      userSettings.workEndTime || "17:00",
    );

    const slotDuration = userSettings.focusSessionLength || 90; // minutes
    const breakDuration = this.calculateBreakDuration(slotDuration); // Dynamic break calculation

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    this.logger.log(
      `Generating time slots from ${currentTime.toISOString()} to ${endTime.toISOString()}`,
    );

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);

      if (slotEnd <= endTime) {
        // Enhanced energy mapping with user pattern consideration
        const energyLevel = this.getEnhancedEnergyLevelForTime(
          currentTime,
          userSettings,
        );
        const preferredFocusTypes = this.getOptimizedFocusTypes(
          energyLevel,
          currentTime,
        );

        const slot: TimeSlot = {
          startTime: new Date(currentTime),
          endTime: slotEnd,
          energyLevel,
          preferredFocusTypes,
          isAvailable: !this.hasConflictWithCommitments(
            currentTime,
            slotEnd,
            commitments,
          ),
        };

        slots.push(slot);
      }

      // Move to next slot with context-aware break duration
      currentTime = new Date(slotEnd.getTime() + breakDuration * 60000);
    }

    const availableSlots = slots.filter((slot) => slot.isAvailable);
    this.logger.log(
      `Generated ${slots.length} total slots, ${availableSlots.length} available`,
    );

    return availableSlots;
  }

  /**
   * Parse work time string (e.g., "09:00") into hour and minute components
   */
  private parseWorkTime(timeString: string): { hour: number; minute: number } {
    try {
      const [hourStr, minuteStr] = timeString.split(":");
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      // Validate parsed values
      if (
        isNaN(hour) ||
        isNaN(minute) ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59
      ) {
        this.logger.warn(`Invalid time format: ${timeString}, using defaults`);
        return { hour: 9, minute: 0 };
      }

      return { hour, minute };
    } catch (error) {
      this.logger.warn(
        `Failed to parse time ${timeString}: ${error.message}, using defaults`,
      );
      return { hour: 9, minute: 0 };
    }
  }

  /**
   * Calculate context-aware break duration based on session length
   */
  private calculateBreakDuration(sessionLength: number): number {
    // Dynamic break calculation:
    // - Short sessions (≤60 min): 10 min break
    // - Medium sessions (61-90 min): 15 min break
    // - Long sessions (91-120 min): 20 min break
    // - Very long sessions (>120 min): 25 min break

    if (sessionLength <= 60) return 10;
    if (sessionLength <= 90) return 15;
    if (sessionLength <= 120) return 20;
    return 25;
  }

  /**
   * Enhanced energy mapping that considers user energy patterns and time of day
   */
  private getEnhancedEnergyLevelForTime(
    time: Date,
    userSettings: UserSettings,
  ): EnergyLevel {
    const hour = time.getHours();
    const minute = time.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // Get user's basic energy pattern
    const morningEnergy = userSettings.morningEnergyLevel || EnergyLevel.HIGH;
    const afternoonEnergy =
      userSettings.afternoonEnergyLevel || EnergyLevel.MEDIUM;

    // Enhanced mapping with energy curves throughout the day
    // Early morning (6-8): Gradual ramp up
    if (timeInMinutes < 8 * 60) {
      return this.adjustEnergyForEarlyMorning(morningEnergy);
    }

    // Peak morning (8-11): User's morning energy level
    if (timeInMinutes < 11 * 60) {
      return morningEnergy;
    }

    // Pre-lunch dip (11-12): Slight energy decrease
    if (timeInMinutes < 12 * 60) {
      return this.decreaseEnergyLevel(morningEnergy);
    }

    // Lunch period (12-13): Lower energy
    if (timeInMinutes < 13 * 60) {
      return EnergyLevel.LOW;
    }

    // Post-lunch recovery (13-14): Gradual increase
    if (timeInMinutes < 14 * 60) {
      return this.adjustEnergyForPostLunch(afternoonEnergy);
    }

    // Afternoon peak (14-16): User's afternoon energy level
    if (timeInMinutes < 16 * 60) {
      return afternoonEnergy;
    }

    // Late afternoon decline (16-18): Gradual decrease
    if (timeInMinutes < 18 * 60) {
      return this.decreaseEnergyLevel(afternoonEnergy);
    }

    // Evening (18+): Low energy
    return EnergyLevel.LOW;
  }

  /**
   * Optimized focus type mapping based on energy level and time of day
   */
  private getOptimizedFocusTypes(
    energyLevel: EnergyLevel,
    time: Date,
  ): FocusType[] {
    const hour = time.getHours();

    // Time-aware focus type optimization
    switch (energyLevel) {
      case EnergyLevel.HIGH:
        // High energy: Prefer creative and technical work
        // Morning high energy: Creative peak
        if (hour < 11) {
          return [FocusType.CREATIVE, FocusType.TECHNICAL];
        }
        // Afternoon high energy: Technical focus
        return [FocusType.TECHNICAL, FocusType.CREATIVE];

      case EnergyLevel.MEDIUM:
        // Medium energy: Balanced technical and administrative
        // Early afternoon: Technical work
        if (hour < 15) {
          return [FocusType.TECHNICAL, FocusType.ADMINISTRATIVE];
        }
        // Late afternoon: Administrative tasks
        return [FocusType.ADMINISTRATIVE, FocusType.TECHNICAL];

      case EnergyLevel.LOW:
        // Low energy: Administrative and social tasks
        // Late day: Social interactions and admin
        if (hour >= 16) {
          return [FocusType.SOCIAL, FocusType.ADMINISTRATIVE];
        }
        // Other low energy periods: Admin focus
        return [FocusType.ADMINISTRATIVE, FocusType.SOCIAL];

      default:
        return [FocusType.ADMINISTRATIVE];
    }
  }

  /**
   * Adjust energy level for early morning gradual ramp-up
   */
  private adjustEnergyForEarlyMorning(baseEnergy: EnergyLevel): EnergyLevel {
    // Early morning: One level lower than base morning energy
    switch (baseEnergy) {
      case EnergyLevel.HIGH:
        return EnergyLevel.MEDIUM;
      case EnergyLevel.MEDIUM:
        return EnergyLevel.LOW;
      case EnergyLevel.LOW:
        return EnergyLevel.LOW;
      default:
        return EnergyLevel.LOW;
    }
  }

  /**
   * Adjust energy level for post-lunch recovery period
   */
  private adjustEnergyForPostLunch(baseEnergy: EnergyLevel): EnergyLevel {
    // Post-lunch: One level lower than base afternoon energy
    switch (baseEnergy) {
      case EnergyLevel.HIGH:
        return EnergyLevel.MEDIUM;
      case EnergyLevel.MEDIUM:
        return EnergyLevel.LOW;
      case EnergyLevel.LOW:
        return EnergyLevel.LOW;
      default:
        return EnergyLevel.LOW;
    }
  }

  /**
   * Decrease energy level by one step
   */
  private decreaseEnergyLevel(currentLevel: EnergyLevel): EnergyLevel {
    switch (currentLevel) {
      case EnergyLevel.HIGH:
        return EnergyLevel.MEDIUM;
      case EnergyLevel.MEDIUM:
        return EnergyLevel.LOW;
      case EnergyLevel.LOW:
        return EnergyLevel.LOW;
      default:
        return EnergyLevel.LOW;
    }
  }

  /**
   * Get energy level for specific time based on user settings
   */
  private getEnergyLevelForTime(
    time: Date,
    userSettings: UserSettings,
  ): EnergyLevel {
    const hour = time.getHours();

    if (hour < 12) {
      return userSettings.morningEnergyLevel || EnergyLevel.HIGH;
    } else if (hour < 17) {
      return userSettings.afternoonEnergyLevel || EnergyLevel.MEDIUM;
    } else {
      // Default to LOW energy for evening hours
      return EnergyLevel.LOW;
    }
  }

  /**
   * Get preferred focus types for energy level
   */
  private getPreferredFocusTypes(energyLevel: EnergyLevel): FocusType[] {
    switch (energyLevel) {
      case EnergyLevel.HIGH:
        return [FocusType.CREATIVE, FocusType.TECHNICAL];
      case EnergyLevel.MEDIUM:
        return [FocusType.TECHNICAL, FocusType.ADMINISTRATIVE];
      case EnergyLevel.LOW:
        return [FocusType.ADMINISTRATIVE, FocusType.SOCIAL];
      default:
        return [FocusType.ADMINISTRATIVE];
    }
  }

  /**
   * Check if time slot conflicts with existing commitments
   */
  private hasConflictWithCommitments(
    start: Date,
    end: Date,
    commitments: TimeSlot[],
  ): boolean {
    return commitments.some(
      (commitment) => start < commitment.endTime && end > commitment.startTime,
    );
  }

  /**
   * Get default working hours for a date
   */
  private getWorkingHours(date: Date, _userSettings: UserSettings): TimeSlot[] {
    const startTime = new Date(date);
    startTime.setHours(9, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(17, 0, 0, 0);

    return [
      {
        startTime,
        endTime,
        energyLevel: EnergyLevel.MEDIUM,
        preferredFocusTypes: [FocusType.ADMINISTRATIVE],
        isAvailable: true,
      },
    ];
  }

  /**
   * Assign tasks to optimal time slots
   */
  private assignTasksToSlots(
    tasks: ScoredTask[],
    slots: TimeSlot[],
  ): Map<string, ScheduleAssignment> {
    const assignments = new Map<string, ScheduleAssignment>();
    const usedSlots = new Set<number>();

    for (const task of tasks) {
      const bestSlotIndex = this.findBestSlotForTask(task, slots, usedSlots);

      if (bestSlotIndex !== -1) {
        const slot = slots[bestSlotIndex];
        const energyMatch = this.calculateEnergyMatch(task, slot);
        const focusMatch = this.calculateFocusMatch(task, slot);

        assignments.set(task.id, {
          task,
          timeSlot: slot,
          energyMatch,
          focusMatch,
          reasoning: this.generateSchedulingReasoning(
            task,
            slot,
            energyMatch,
            focusMatch,
          ),
        });

        usedSlots.add(bestSlotIndex);
      }
    }

    return assignments;
  }

  /**
   * Find best available slot for a task
   */
  private findBestSlotForTask(
    task: Task,
    slots: TimeSlot[],
    usedSlots: Set<number>,
  ): number {
    let bestSlotIndex = -1;
    let bestScore = -1;

    for (let i = 0; i < slots.length; i++) {
      if (usedSlots.has(i)) continue;

      const slot = slots[i];
      const energyMatch = this.calculateEnergyMatch(task, slot);
      const focusMatch = this.calculateFocusMatch(task, slot);
      const durationFit = this.calculateDurationFit(task, slot);

      // Composite score for slot fitness
      const score = energyMatch * 0.4 + focusMatch * 0.3 + durationFit * 0.3;

      if (score > bestScore) {
        bestScore = score;
        bestSlotIndex = i;
      }
    }

    return bestSlotIndex;
  }

  /**
   * Calculate how well task energy matches slot energy
   */
  private calculateEnergyMatch(task: Task, slot: TimeSlot): number {
    if (!task.energyLevel) return 0.5; // Neutral match

    return task.energyLevel === slot.energyLevel ? 1.0 : 0.3;
  }

  /**
   * Calculate how well task focus type matches slot preferences
   */
  private calculateFocusMatch(task: Task, slot: TimeSlot): number {
    if (!task.focusType) return 0.5; // Neutral match

    return slot.preferredFocusTypes.includes(task.focusType) ? 1.0 : 0.4;
  }

  /**
   * Calculate how well task duration fits in slot
   */
  private calculateDurationFit(task: Task, slot: TimeSlot): number {
    const taskDuration = task.estimatedMinutes || 30;
    const slotDuration =
      (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60);

    if (taskDuration <= slotDuration) {
      return 1.0; // Perfect fit
    } else {
      return Math.max(0, 1 - (taskDuration - slotDuration) / slotDuration);
    }
  }

  /**
   * Generate human-readable scheduling reasoning
   */
  private generateSchedulingReasoning(
    task: Task,
    slot: TimeSlot,
    energyMatch: number,
    focusMatch: number,
  ): string {
    const reasons = [];

    if (energyMatch > 0.8) {
      reasons.push(`energy level matches (${task.energyLevel})`);
    }

    if (focusMatch > 0.8) {
      reasons.push(`focus type aligns (${task.focusType})`);
    }

    if (task.hardDeadline) {
      reasons.push("deadline consideration");
    }

    if (task.priority && task.priority > 3) {
      reasons.push("high priority");
    }

    return reasons.length > 0
      ? `Scheduled due to: ${reasons.join(", ")}`
      : "Best available slot";
  }

  /**
   * Create schedule blocks from assignments
   */
  private createScheduleBlocks(
    assignments: Map<string, ScheduleAssignment>,
  ): ScheduleBlock[] {
    const blocks: ScheduleBlock[] = [];

    for (const assignment of assignments.values()) {
      blocks.push({
        startTime: assignment.timeSlot.startTime,
        endTime: assignment.timeSlot.endTime,
        task: assignment.task,
        energyMatch: assignment.energyMatch,
        focusMatch: assignment.focusMatch,
        reasoning: assignment.reasoning,
      });
    }

    // Sort by start time
    return blocks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * Calculate optimization metrics for the plan
   */
  private calculateOptimizationMetrics(
    blocks: ScheduleBlock[],
    allTasks: ScoredTask[],
  ): OptimizationResult {
    if (blocks.length === 0) {
      return {
        energyOptimization: 0,
        focusOptimization: 0,
        deadlineRisk: 0,
      };
    }

    // Energy optimization: average energy match
    const energyOptimization =
      blocks.reduce((sum, block) => sum + block.energyMatch, 0) / blocks.length;

    // Focus optimization: average focus match
    const focusOptimization =
      blocks.reduce((sum, block) => sum + block.focusMatch, 0) / blocks.length;

    // Deadline risk: percentage of high-priority deadline tasks not scheduled
    const deadlineTasks = allTasks.filter(
      (t) => t.hardDeadline && t.priority && t.priority > 3,
    );
    const scheduledDeadlineTasks = blocks.filter(
      (b) => b.task.hardDeadline && b.task.priority && b.task.priority > 3,
    ).length;

    const deadlineRisk =
      deadlineTasks.length > 0
        ? 1 - scheduledDeadlineTasks / deadlineTasks.length
        : 0;

    return {
      energyOptimization,
      focusOptimization,
      deadlineRisk,
    };
  }

  /**
   * Transform domain model to DTO
   */
  private transformToDto(plan: DailyPlan): DailyPlanResponseDto {
    return {
      date: plan.date.toISOString().split("T")[0],
      scheduleBlocks: plan.scheduleBlocks.map((block) => ({
        startTime: block.startTime.toISOString(),
        endTime: block.endTime.toISOString(),
        task: {
          id: block.task.id,
          title: block.task.title,
          description: block.task.description,
          energyLevel: block.task.energyLevel,
          focusType: block.task.focusType,
          estimatedMinutes: block.task.estimatedMinutes,
          priority: block.task.priority,
          hardDeadline: block.task.hardDeadline?.toISOString(),
        },
        energyMatch: block.energyMatch,
        focusMatch: block.focusMatch,
        reasoning: block.reasoning,
      })),
      unscheduledTasks: plan.unscheduledTasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        energyLevel: task.energyLevel,
        focusType: task.focusType,
        estimatedMinutes: task.estimatedMinutes,
        priority: task.priority,
        hardDeadline: task.hardDeadline?.toISOString(),
      })),
      totalEstimatedMinutes: plan.totalEstimatedMinutes,
      energyOptimization: plan.energyOptimization,
      focusOptimization: plan.focusOptimization,
      deadlineRisk: plan.deadlineRisk,
    };
  }

  /**
   * Get existing calendar commitments for the specified date
   * Integrates with both Google Calendar and Microsoft Outlook Calendar
   * Converts calendar events into TimeSlot format for planning integration
   */
  private async getExistingCommitments(
    userId: string,
    date: Date,
  ): Promise<TimeSlot[]> {
    const startTime = performance.now();
    
    try {
      this.logger.debug(
        `Starting dual-calendar integration for user ${userId} on ${date.toISOString()}`,
      );

      // Define start and end of day for calendar query
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch calendar events from both sources concurrently
      const [googleEvents, outlookEvents] = await Promise.allSettled([
        this.getGoogleCommitments(userId, startOfDay, endOfDay),
        this.getOutlookCommitments(userId, startOfDay, endOfDay),
      ]);

      const allTimeSlots: TimeSlot[] = [];
      let totalEvents = 0;
      let googleEventCount = 0;
      let outlookEventCount = 0;

      // Process Google Calendar events
      if (googleEvents.status === 'fulfilled') {
        allTimeSlots.push(...googleEvents.value);
        googleEventCount = googleEvents.value.length;
        totalEvents += googleEventCount;
        this.logger.debug(`Successfully fetched ${googleEventCount} Google Calendar events`);
      } else {
        this.logger.warn(`Google Calendar integration failed: ${googleEvents.reason?.message}`);
      }

      // Process Outlook Calendar events
      if (outlookEvents.status === 'fulfilled') {
        allTimeSlots.push(...outlookEvents.value);
        outlookEventCount = outlookEvents.value.length;
        totalEvents += outlookEventCount;
        this.logger.debug(`Successfully fetched ${outlookEventCount} Outlook Calendar events`);
      } else {
        this.logger.warn(`Outlook Calendar integration failed: ${outlookEvents.reason?.message}`);
      }

      // Deduplicate events that might exist in both calendars
      const deduplicatedTimeSlots = this.deduplicateCalendarEvents(allTimeSlots);
      const duplicatesRemoved = allTimeSlots.length - deduplicatedTimeSlots.length;

      const totalTime = performance.now() - startTime;
      this.logger.log(
        `Multi-calendar integration completed for user ${userId}: Google(${googleEventCount}) + Outlook(${outlookEventCount}) = ${totalEvents} events, ${duplicatesRemoved} duplicates removed, final count: ${deduplicatedTimeSlots.length}, total time ${totalTime.toFixed(2)}ms`,
        {
          userId,
          date: date.toISOString(),
          googleEventCount,
          outlookEventCount,
          totalEvents,
          duplicatesRemoved,
          finalEventCount: deduplicatedTimeSlots.length,
          responseTimeMs: totalTime,
        },
      );

      return deduplicatedTimeSlots;
    } catch (error) {
      const totalTime = performance.now() - startTime;
      
      this.logger.error(
        `Multi-calendar integration failed for user ${userId}: ${error.message}`,
        {
          userId,
          date: date.toISOString(),
          errorType: error.constructor.name,
          timeElapsed: totalTime,
          originalError: error.message,
        },
      );

      // Return empty array to allow planning to continue without calendar data
      return [];
    }
  }

  /**
   * Enhanced calendar event fetching with retry logic and error handling
   */
  private async getCalendarEventsWithRetry(
    userId: string,
    calendarId: string,
    timeMin: Date,
    timeMax: Date,
    maxRetries = 3,
  ): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Calendar API attempt ${attempt}/${maxRetries} for user ${userId}`,
        );

        const response = await this.googleService.getCalendarEvents(
          userId,
          calendarId,
          timeMin,
          timeMax,
        );

        if (attempt > 1) {
          this.logger.log(
            `Calendar API succeeded on retry attempt ${attempt} for user ${userId}`,
          );
        }

        return response;
      } catch (error) {
        lastError = error;
        const errorDetails = this.categorizeCalendarError(error);

        this.logger.warn(
          `Calendar API attempt ${attempt}/${maxRetries} failed for user ${userId}: ${errorDetails.message}`,
          {
            userId,
            attempt,
            maxRetries,
            errorType: errorDetails.type,
            errorCode: errorDetails.code,
            retryable: errorDetails.retryable,
          },
        );

        // Don't retry if error is not retryable
        if (!errorDetails.retryable) {
          this.logger.error(
            `Non-retryable error encountered, aborting retry attempts for user ${userId}`,
            {
              userId,
              errorType: errorDetails.type,
              errorCode: errorDetails.code,
            },
          );
          throw error;
        }

        // Don't wait after the last attempt
        if (attempt < maxRetries) {
          const delayMs = this.calculateRetryDelay(attempt);
          this.logger.debug(
            `Waiting ${delayMs}ms before retry attempt ${attempt + 1} for user ${userId}`,
          );
          await this.sleep(delayMs);
        }
      }
    }

    this.logger.error(
      `All ${maxRetries} calendar API attempts failed for user ${userId}`,
      {
        userId,
        maxRetries,
        finalError: lastError.message,
      },
    );

    throw lastError;
  }

  /**
   * Categorize calendar API errors for better handling and monitoring
   */
  private categorizeCalendarError(error: any): {
    type: string;
    code: string | number;
    message: string;
    retryable: boolean;
  } {
    // Handle Google API specific errors
    if (error.response?.data?.error) {
      const googleError = error.response.data.error;
      const code = googleError.code || error.response.status;
      
      switch (code) {
        case 401:
          return {
            type: 'AUTH_EXPIRED',
            code,
            message: 'Authentication token expired or invalid',
            retryable: false, // Requires token refresh
          };
        case 403:
          return {
            type: 'PERMISSION_DENIED',
            code,
            message: 'Insufficient permissions to access calendar',
            retryable: false,
          };
        case 429:
          return {
            type: 'RATE_LIMITED',
            code,
            message: 'Google Calendar API rate limit exceeded',
            retryable: true,
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: 'SERVER_ERROR',
            code,
            message: 'Google Calendar API server error',
            retryable: true,
          };
        default:
          return {
            type: 'API_ERROR',
            code,
            message: googleError.message || 'Unknown Google Calendar API error',
            retryable: false,
          };
      }
    }

    // Handle network and connection errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        type: 'NETWORK_ERROR',
        code: error.code,
        message: 'Network connectivity issue',
        retryable: true,
      };
    }

    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return {
        type: 'TIMEOUT',
        code: error.code || 'TIMEOUT',
        message: 'Request timeout',
        retryable: true,
      };
    }

    // Handle integration configuration errors
    if (error.message?.includes('integration not configured')) {
      return {
        type: 'INTEGRATION_NOT_CONFIGURED',
        code: 'CONFIG_ERROR',
        message: 'Google Calendar integration not configured for user',
        retryable: false,
      };
    }

    // Default categorization for unknown errors
    return {
      type: 'UNKNOWN_ERROR',
      code: error.code || 'UNKNOWN',
      message: error.message || 'Unknown calendar integration error',
      retryable: false,
    };
  }

  /**
   * Calculate exponential backoff delay for retry attempts
   */
  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s with jitter
    const baseDelay = Math.pow(2, attempt - 1) * 1000;
    const jitter = Math.random() * 500; // Add up to 500ms jitter
    return Math.min(baseDelay + jitter, 10000); // Cap at 10 seconds
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Parse a Google Calendar event into a TimeSlot for daily planning
   * Includes intelligent energy level and focus type inference
   */
  private parseCalendarEventToTimeSlot(event: any): TimeSlot | null {
    // Validate required fields
    if (!event.start || !event.end) {
      throw new Error("Event missing start or end time");
    }

    // Parse start and end times
    let startTime: Date;
    let endTime: Date;

    // Handle all-day events
    if (event.start.date && event.end.date) {
      startTime = new Date(event.start.date);
      startTime.setHours(0, 0, 0, 0);

      endTime = new Date(event.end.date);
      endTime.setHours(23, 59, 59, 999);
    }
    // Handle timed events
    else if (event.start.dateTime && event.end.dateTime) {
      startTime = new Date(event.start.dateTime);
      endTime = new Date(event.end.dateTime);
    } else {
      throw new Error("Event has invalid date/time format");
    }

    // Validate date logic
    if (startTime >= endTime) {
      throw new Error("Event end time must be after start time");
    }

    // Infer energy level based on meeting characteristics
    const energyLevel = this.inferEnergyLevel(event);

    // Infer preferred focus types based on event content
    const preferredFocusTypes = this.inferPreferredFocusTypes(event);

    return {
      startTime,
      endTime,
      energyLevel,
      preferredFocusTypes,
      isAvailable: false, // Calendar events block availability
      source: 'google', // Track calendar source
      eventId: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      isAllDay: !!(event.start.date && event.end.date),
    };
  }

  /**
   * Intelligently infer energy level based on calendar event characteristics
   */
  private inferEnergyLevel(event: any): EnergyLevel {
    const summary = (event.summary || "").toLowerCase();
    const attendeeCount = event.attendees?.length || 0;

    // High energy indicators - focus time, deep work
    if (
      summary.includes("focus") ||
      summary.includes("deep work") ||
      summary.includes("coding") ||
      summary.includes("development") ||
      attendeeCount === 0
    ) {
      return EnergyLevel.HIGH;
    }

    // Low energy indicators - large meetings, all-hands, etc.
    if (
      attendeeCount > 8 ||
      summary.includes("all hands") ||
      summary.includes("town hall") ||
      summary.includes("large meeting") ||
      summary.includes("presentation")
    ) {
      return EnergyLevel.LOW;
    }

    // Default to medium energy for regular meetings
    return EnergyLevel.MEDIUM;
  }

  /**
   * Intelligently infer focus types based on calendar event content
   */
  private inferPreferredFocusTypes(event: any): FocusType[] {
    const summary = (event.summary || "").toLowerCase();
    const description = (event.description || "").toLowerCase();
    const content = `${summary} ${description}`;

    const focusTypes: FocusType[] = [];

    // Technical focus indicators
    if (
      content.match(
        /\b(code|tech|review|development|engineering|system|architecture|debug|api)\b/,
      )
    ) {
      focusTypes.push(FocusType.TECHNICAL);
    }

    // Creative focus indicators
    if (
      content.match(
        /\b(design|creative|brainstorm|ideation|workshop|innovation|strategy)\b/,
      )
    ) {
      focusTypes.push(FocusType.CREATIVE);
    }

    // Administrative focus indicators
    if (
      content.match(
        /\b(admin|expense|report|compliance|hr|legal|budget|planning)\b/,
      )
    ) {
      focusTypes.push(FocusType.ADMINISTRATIVE);
    }

    // Social focus indicators (meetings with attendees, 1:1s, etc.)
    if (
      event.attendees?.length > 0 ||
      content.match(/\b(meeting|standup|sync|1:1|one-on-one|team)\b/)
    ) {
      focusTypes.push(FocusType.SOCIAL);
    }

    // Default to social if no specific indicators found and has attendees
    if (focusTypes.length === 0 && event.attendees?.length > 0) {
      focusTypes.push(FocusType.SOCIAL);
    }

    // Default to technical if no indicators and no attendees (assume focus time)
    if (focusTypes.length === 0) {
      focusTypes.push(FocusType.TECHNICAL);
    }

    return focusTypes;
  }

  /**
   * Get Google Calendar commitments for the specified date range
   * Extracted from the original getExistingCommitments for multi-calendar support
   */
  private async getGoogleCommitments(
    userId: string,
    startOfDay: Date,
    endOfDay: Date,
  ): Promise<TimeSlot[]> {
    try {
      this.logger.debug(`Fetching Google Calendar events for user ${userId}`);

      // Fetch calendar events with retry logic (existing method)
      const calendarResponse = await this.getCalendarEventsWithRetry(
        userId,
        "primary",
        startOfDay,
        endOfDay,
      );

      if (!calendarResponse?.items) {
        this.logger.debug(`No Google Calendar events found for user ${userId}`);
        return [];
      }

      // Convert calendar events to TimeSlot format
      const timeSlots: TimeSlot[] = [];
      let parseSuccessCount = 0;
      let parseFailureCount = 0;

      for (const event of calendarResponse.items) {
        try {
          const timeSlot = this.parseCalendarEventToTimeSlot(event);
          if (timeSlot) {
            // Add source tracking for multi-calendar support
            timeSlot.source = 'google';
            timeSlots.push(timeSlot);
            parseSuccessCount++;
          }
        } catch (error) {
          parseFailureCount++;
          this.logger.warn(
            `Failed to parse Google Calendar event ${event.id || 'unknown'}: ${error.message}`,
            {
              userId,
              eventId: event.id,
              eventSummary: event.summary,
              errorType: error.constructor.name,
            },
          );
          continue;
        }
      }

      this.logger.debug(
        `Google Calendar integration: ${parseSuccessCount} events parsed, ${parseFailureCount} failed`,
      );

      return timeSlots;
    } catch (error) {
      this.logger.error(`Google Calendar integration failed for user ${userId}: ${error.message}`);
      throw error; // Re-throw to be handled by Promise.allSettled
    }
  }

  /**
   * Get Outlook Calendar commitments for the specified date range
   * Implements Microsoft Graph calendar integration for dual-calendar support
   */
  private async getOutlookCommitments(
    userId: string,
    startOfDay: Date,
    endOfDay: Date,
  ): Promise<TimeSlot[]> {
    try {
      this.logger.debug(`Fetching Outlook Calendar events for user ${userId}`);

      // Fetch Outlook calendar events with retry logic
      const outlookResponse = await this.getOutlookEventsWithRetry(
        userId,
        "primary",
        startOfDay,
        endOfDay,
      );

      if (!outlookResponse?.value || outlookResponse.value.length === 0) {
        this.logger.debug(`No Outlook Calendar events found for user ${userId}`);
        return [];
      }

      // Convert Outlook calendar events to TimeSlot format
      const timeSlots: TimeSlot[] = [];
      let parseSuccessCount = 0;
      let parseFailureCount = 0;

      for (const event of outlookResponse.value) {
        try {
          const timeSlot = this.parseOutlookEventToTimeSlot(event);
          if (timeSlot) {
            // Add source tracking for multi-calendar support
            timeSlot.source = 'outlook';
            timeSlots.push(timeSlot);
            parseSuccessCount++;
          }
        } catch (error) {
          parseFailureCount++;
          this.logger.warn(
            `Failed to parse Outlook Calendar event ${event.id || 'unknown'}: ${error.message}`,
            {
              userId,
              eventId: event.id,
              eventSubject: event.subject,
              errorType: error.constructor.name,
            },
          );
          continue;
        }
      }

      this.logger.debug(
        `Outlook Calendar integration: ${parseSuccessCount} events parsed, ${parseFailureCount} failed`,
      );

      return timeSlots;
    } catch (error) {
      this.logger.error(`Outlook Calendar integration failed for user ${userId}: ${error.message}`);
      throw error; // Re-throw to be handled by Promise.allSettled
    }
  }

  /**
   * Enhanced Outlook calendar event fetching with retry logic and error handling
   * Mirrors the Google Calendar retry logic for consistency
   */
  private async getOutlookEventsWithRetry(
    userId: string,
    calendarId: string,
    timeMin: Date,
    timeMax: Date,
    maxRetries = 3,
  ): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(
          `Outlook Calendar API attempt ${attempt}/${maxRetries} for user ${userId}`,
        );

        const response = await this.graphService.getCalendarEvents(
          userId,
          calendarId,
          timeMin,
          timeMax,
        );

        if (attempt > 1) {
          this.logger.log(
            `Outlook Calendar API succeeded on retry attempt ${attempt} for user ${userId}`,
          );
        }

        return response;
      } catch (error) {
        lastError = error;
        const errorDetails = this.categorizeOutlookCalendarError(error);

        this.logger.warn(
          `Outlook Calendar API attempt ${attempt}/${maxRetries} failed for user ${userId}: ${errorDetails.message}`,
          {
            userId,
            attempt,
            maxRetries,
            errorType: errorDetails.type,
            errorCode: errorDetails.code,
            retryable: errorDetails.retryable,
          },
        );

        // Don't retry if error is not retryable
        if (!errorDetails.retryable) {
          this.logger.error(
            `Non-retryable Outlook error encountered, aborting retry attempts for user ${userId}`,
            {
              userId,
              errorType: errorDetails.type,
              errorCode: errorDetails.code,
            },
          );
          throw error;
        }

        // Don't wait after the last attempt
        if (attempt < maxRetries) {
          const delayMs = this.calculateRetryDelay(attempt);
          this.logger.debug(
            `Waiting ${delayMs}ms before Outlook retry attempt ${attempt + 1} for user ${userId}`,
          );
          await this.sleep(delayMs);
        }
      }
    }

    this.logger.error(
      `All ${maxRetries} Outlook Calendar API attempts failed for user ${userId}`,
      {
        userId,
        maxRetries,
        finalError: lastError.message,
      },
    );

    throw lastError;
  }

  /**
   * Categorize Outlook/Microsoft Graph calendar API errors
   * Similar to Google Calendar error categorization but adapted for Microsoft Graph API
   */
  private categorizeOutlookCalendarError(error: any): {
    type: string;
    code: string | number;
    message: string;
    retryable: boolean;
  } {
    // Handle Microsoft Graph specific errors
    if (error.response?.status || error.code) {
      const code = error.response?.status || error.code;
      
      switch (code) {
        case 401:
          return {
            type: 'AUTH_EXPIRED',
            code,
            message: 'Microsoft Graph authentication token expired or invalid',
            retryable: false, // Requires token refresh
          };
        case 403:
          return {
            type: 'PERMISSION_DENIED',
            code,
            message: 'Insufficient permissions to access Outlook calendar',
            retryable: false,
          };
        case 429:
          return {
            type: 'RATE_LIMITED',
            code,
            message: 'Microsoft Graph API rate limit exceeded',
            retryable: true,
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            type: 'SERVER_ERROR',
            code,
            message: 'Microsoft Graph API server error',
            retryable: true,
          };
        default:
          return {
            type: 'API_ERROR',
            code,
            message: error.message || 'Unknown Microsoft Graph API error',
            retryable: false,
          };
      }
    }

    // Handle network and connection errors (same as Google Calendar)
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        type: 'NETWORK_ERROR',
        code: error.code,
        message: 'Network connectivity issue',
        retryable: true,
      };
    }

    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return {
        type: 'TIMEOUT',
        code: error.code || 'TIMEOUT',
        message: 'Request timeout',
        retryable: true,
      };
    }

    // Handle integration configuration errors
    if (error.message?.includes('integration not configured')) {
      return {
        type: 'INTEGRATION_NOT_CONFIGURED',
        code: 'CONFIG_ERROR',
        message: 'Microsoft Graph integration not configured for user',
        retryable: false,
      };
    }

    // Default categorization for unknown errors
    return {
      type: 'UNKNOWN_ERROR',
      code: error.code || 'UNKNOWN',
      message: error.message || 'Unknown Outlook calendar integration error',
      retryable: false,
    };
  }

  /**
   * Parse a Microsoft Graph calendar event into a TimeSlot for daily planning
   * Includes intelligent energy level and focus type inference adapted for Outlook events
   */
  private parseOutlookEventToTimeSlot(event: any): TimeSlot | null {
    // Validate required fields
    if (!event.start || !event.end) {
      throw new Error("Outlook event missing start or end time");
    }

    // Parse start and end times
    let startTime: Date;
    let endTime: Date;

    // Handle all-day events
    if (event.isAllDay) {
      startTime = new Date(event.start.dateTime || event.start.date);
      startTime.setHours(0, 0, 0, 0);

      endTime = new Date(event.end.dateTime || event.end.date);
      endTime.setHours(23, 59, 59, 999);
    }
    // Handle timed events
    else if (event.start.dateTime && event.end.dateTime) {
      startTime = new Date(event.start.dateTime);
      endTime = new Date(event.end.dateTime);
    } else {
      throw new Error("Outlook event has invalid date/time format");
    }

    // Validate date logic
    if (startTime >= endTime) {
      throw new Error("Outlook event end time must be after start time");
    }

    // Infer energy level based on Outlook meeting characteristics
    const energyLevel = this.inferOutlookEnergyLevel(event);

    // Infer preferred focus types based on Outlook event content
    const preferredFocusTypes = this.inferOutlookPreferredFocusTypes(event);

    return {
      startTime,
      endTime,
      energyLevel,
      preferredFocusTypes,
      isAvailable: false, // Calendar events block availability
      source: 'outlook', // Track calendar source
      eventId: event.id,
      title: event.subject || 'Untitled Event',
      description: event.bodyPreview || event.body?.content || '',
      isAllDay: !!event.isAllDay,
    };
  }

  /**
   * Intelligently infer energy level based on Outlook calendar event characteristics
   * Adapted for Microsoft Graph event data structure and Outlook-specific fields
   */
  private inferOutlookEnergyLevel(event: any): EnergyLevel {
    const subject = (event.subject || "").toLowerCase();
    const attendeeCount = event.attendees?.length || 0;
    const importance = event.importance || 'normal'; // low, normal, high
    const showAs = event.showAs || 'busy'; // free, tentative, busy, oof, workingElsewhere

    // High energy indicators - focus time, deep work, high importance
    if (
      subject.includes("focus") ||
      subject.includes("deep work") ||
      subject.includes("coding") ||
      subject.includes("development") ||
      importance === 'high' ||
      showAs === 'workingElsewhere' ||
      attendeeCount === 0
    ) {
      return EnergyLevel.HIGH;
    }

    // Low energy indicators - large meetings, all-hands, low importance
    if (
      attendeeCount > 8 ||
      subject.includes("all hands") ||
      subject.includes("town hall") ||
      subject.includes("large meeting") ||
      subject.includes("presentation") ||
      importance === 'low' ||
      showAs === 'tentative'
    ) {
      return EnergyLevel.LOW;
    }

    // Default to medium energy for regular meetings
    return EnergyLevel.MEDIUM;
  }

  /**
   * Intelligently infer focus types based on Outlook calendar event content
   * Adapted for Microsoft Graph event data structure and Outlook categories
   */
  private inferOutlookPreferredFocusTypes(event: any): FocusType[] {
    const subject = (event.subject || "").toLowerCase();
    const body = (event.body?.content || "").toLowerCase();
    const categories = event.categories || [];
    const content = `${subject} ${body} ${categories.join(' ')}`.toLowerCase();

    const focusTypes: FocusType[] = [];

    // Technical focus indicators
    if (
      content.match(
        /\b(code|tech|review|development|engineering|system|architecture|debug|api|technical)\b/,
      ) ||
      categories.some(cat => cat.toLowerCase().includes('technical'))
    ) {
      focusTypes.push(FocusType.TECHNICAL);
    }

    // Creative focus indicators
    if (
      content.match(
        /\b(design|creative|brainstorm|ideation|workshop|innovation|strategy)\b/,
      ) ||
      categories.some(cat => cat.toLowerCase().includes('creative'))
    ) {
      focusTypes.push(FocusType.CREATIVE);
    }

    // Administrative focus indicators
    if (
      content.match(
        /\b(admin|expense|report|compliance|hr|legal|budget|planning)\b/,
      ) ||
      categories.some(cat => cat.toLowerCase().includes('admin'))
    ) {
      focusTypes.push(FocusType.ADMINISTRATIVE);
    }

    // Social focus indicators (meetings with attendees, 1:1s, etc.)
    if (
      event.attendees?.length > 0 ||
      content.match(/\b(meeting|standup|sync|1:1|one-on-one|team)\b/)
    ) {
      focusTypes.push(FocusType.SOCIAL);
    }

    // Default to social if no specific indicators found and has attendees
    if (focusTypes.length === 0 && event.attendees?.length > 0) {
      focusTypes.push(FocusType.SOCIAL);
    }

    // Default to technical if no indicators and no attendees (assume focus time)
    if (focusTypes.length === 0) {
      focusTypes.push(FocusType.TECHNICAL);
    }

    return focusTypes;
  }

  /**
   * Deduplicate calendar events that might exist in both Google and Outlook calendars
   * Uses time overlap and title similarity to identify potential duplicates
   */
  private deduplicateCalendarEvents(timeSlots: TimeSlot[]): TimeSlot[] {
    if (timeSlots.length <= 1) {
      return timeSlots;
    }

    const deduplicated: TimeSlot[] = [];
    const duplicateCount = { removed: 0 };

    for (let i = 0; i < timeSlots.length; i++) {
      const currentSlot = timeSlots[i];
      let isDuplicate = false;

      // Check against already processed slots
      for (const existingSlot of deduplicated) {
        if (this.areTimeSlotsDuplicates(currentSlot, existingSlot)) {
          isDuplicate = true;
          duplicateCount.removed++;

          // Log the duplicate detection for debugging
          this.logger.debug(
            `Duplicate calendar event detected and removed`,
            {
              existingSource: existingSlot.source,
              duplicateSource: currentSlot.source,
              startTime: currentSlot.startTime.toISOString(),
              endTime: currentSlot.endTime.toISOString(),
            },
          );
          break;
        }
      }

      if (!isDuplicate) {
        deduplicated.push(currentSlot);
      }
    }

    if (duplicateCount.removed > 0) {
      this.logger.log(
        `Calendar deduplication completed: ${duplicateCount.removed} duplicates removed from ${timeSlots.length} events`,
      );
    }

    return deduplicated;
  }

  /**
   * Determine if two TimeSlots are likely duplicates based on time overlap
   * Uses a tolerance window to account for slight time differences between calendar systems
   */
  private areTimeSlotsDuplicates(slot1: TimeSlot, slot2: TimeSlot): boolean {
    // Don't consider events from the same source as duplicates
    if (slot1.source === slot2.source) {
      return false;
    }

    // Check for time overlap with tolerance (5 minutes)
    const toleranceMs = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    const slot1Start = slot1.startTime.getTime();
    const slot1End = slot1.endTime.getTime();
    const slot2Start = slot2.startTime.getTime();
    const slot2End = slot2.endTime.getTime();

    // Check if the start times are within tolerance
    const startTimeDiff = Math.abs(slot1Start - slot2Start);
    const endTimeDiff = Math.abs(slot1End - slot2End);

    // Consider duplicate if both start and end times are within tolerance
    const timeMatch = startTimeDiff <= toleranceMs && endTimeDiff <= toleranceMs;

    if (timeMatch) {
      this.logger.debug(
        `Time-based duplicate detected: ${slot1.source} vs ${slot2.source}`,
        {
          startTimeDiff: startTimeDiff / 1000 / 60, // minutes
          endTimeDiff: endTimeDiff / 1000 / 60, // minutes
          toleranceMinutes: toleranceMs / 1000 / 60,
        },
      );
    }

    return timeMatch;
  }
}
