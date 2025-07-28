import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { 
  Task, 
  UserSettings, 
  EnergyLevel, 
  FocusType, 
  TaskStatus 
} from '@prisma/client';
import {
  PlanningInput,
  TimeSlot,
  ScoredTask,
  ScheduleAssignment,
  ScheduleBlock,
  DailyPlan,
  OptimizationResult,
  DependencyGraph
} from './types';
import { DailyPlanResponseDto } from './dto';

@Injectable()
export class DailyPlannerService {
  private readonly logger = new Logger(DailyPlannerService.name);

  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService,
  ) {}

  /**
   * Generate optimized daily plan for a user
   */
  async generatePlan(userId: string, date: Date): Promise<DailyPlanResponseDto> {
    try {
      this.logger.log(`Generating plan for user ${userId} on ${date.toISOString()}`);

      // 1. Gather required data
      const input = await this.gatherPlanningData(userId, date);
      
      // 2. Filter ready tasks (resolve dependencies)
      const readyTasks = await this.filterReadyTasks(input.availableTasks);
      
      // 3. Score tasks based on multiple factors
      const scoredTasks = this.scoreTasks(readyTasks, date, input.userSettings);
      
      // 4. Generate available time slots
      const timeSlots = this.generateTimeSlots(date, input.userSettings, input.existingCommitments);
      
      // 5. Assign tasks to optimal time slots
      const assignments = this.assignTasksToSlots(scoredTasks, timeSlots);
      
      // 6. Create schedule blocks
      const scheduleBlocks = this.createScheduleBlocks(assignments);
      
      // 7. Calculate optimization metrics
      const optimization = this.calculateOptimizationMetrics(scheduleBlocks, scoredTasks);

      const plan: DailyPlan = {
        date,
        scheduleBlocks,
        unscheduledTasks: scoredTasks.filter(t => !assignments.has(t.id)),
        totalEstimatedMinutes: scheduleBlocks.reduce((sum, block) => 
          sum + (block.task.estimatedMinutes || 30), 0
        ),
        ...optimization
      };

      return this.transformToDto(plan);
    } catch (error) {
      this.logger.error(`Failed to generate plan: ${error.message}`, error.stack);
      throw new BadRequestException(`Plan generation failed: ${error.message}`);
    }
  }

  /**
   * Gather all data needed for planning
   */
  private async gatherPlanningData(userId: string, date: Date): Promise<PlanningInput> {
    // Get user's pending tasks
    const tasks = await this.tasksService.findAll(userId);
    const availableTasks = tasks.filter(task => 
      task.status !== TaskStatus.DONE && 
      task.status !== TaskStatus.BLOCKED
    );

    // Get user settings or create defaults
    let userSettings = await this.prisma.userSettings.findUnique({
      where: { userId }
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
        }
      });
    }

    // Get working hours for the date
    const workingHours = this.getWorkingHours(date, userSettings);
    
    // TODO: Get existing commitments from calendar integration
    const existingCommitments: TimeSlot[] = [];

    return {
      userId,
      date,
      availableTasks,
      userSettings,
      workingHours,
      existingCommitments
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
      const isReady = Array.from(dependencies).every(depId => {
        const depTask = dependencyGraph.nodes.get(depId);
        return depTask?.status === TaskStatus.DONE;
      });
      
      if (isReady) {
        readyTasks.push(task);
      }
    }

    this.logger.log(`Filtered ${readyTasks.length} ready tasks from ${tasks.length} total`);
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
      const dependencies = await this.tasksService.findTaskDependencies(task.id);
      
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
          `Circular dependency detected involving task ${nodeId}. Please resolve dependencies manually.`
        );
      }
    }
  }

  /**
   * Score tasks based on weighted factors
   */
  private scoreTasks(tasks: Task[], targetDate: Date, userSettings: UserSettings): ScoredTask[] {
    return tasks.map(task => {
      const scores = this.calculateTaskScore(task, targetDate, userSettings);
      return {
        ...task,
        score: scores.total,
        priorityScore: scores.priority,
        deadlineScore: scores.deadline,
        energyScore: scores.energy,
        focusScore: scores.focus
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate weighted task score
   */
  private calculateTaskScore(task: Task, targetDate: Date, _userSettings: UserSettings) {
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
      const daysUntilDeadline = Math.max(0, 
        (task.hardDeadline.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      deadlineScore = Math.max(0, 30 - (daysUntilDeadline * 5));
    }

    // Energy level bonus (20% - up to 20 points)
    const energyBonus = {
      [EnergyLevel.HIGH]: 20,
      [EnergyLevel.MEDIUM]: 15,
      [EnergyLevel.LOW]: 10
    };
    energyScore = energyBonus[task.energyLevel || EnergyLevel.MEDIUM];

    // Focus type clustering bonus (10% - up to 10 points)
    const focusBonus = {
      [FocusType.CREATIVE]: 8,
      [FocusType.TECHNICAL]: 8,
      [FocusType.ADMINISTRATIVE]: 6,
      [FocusType.SOCIAL]: 10
    };
    focusScore = focusBonus[task.focusType || FocusType.ADMINISTRATIVE];

    const total = priorityScore + deadlineScore + energyScore + focusScore;

    return {
      total,
      priority: priorityScore,
      deadline: deadlineScore,
      energy: energyScore,
      focus: focusScore
    };
  }

  /**
   * Generate time slots based on user settings
   */
  private generateTimeSlots(date: Date, userSettings: UserSettings, commitments: TimeSlot[]): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startHour = 9; // Default work start
    const endHour = 17; // Default work end
    const slotDuration = userSettings.focusSessionLength || 90; // minutes

    let currentTime = new Date(date);
    currentTime.setHours(startHour, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, 0, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
      
      if (slotEnd <= endTime) {
        const energyLevel = this.getEnergyLevelForTime(currentTime, userSettings);
        const preferredFocusTypes = this.getPreferredFocusTypes(energyLevel);

        slots.push({
          startTime: new Date(currentTime),
          endTime: slotEnd,
          energyLevel,
          preferredFocusTypes,
          isAvailable: !this.hasConflictWithCommitments(currentTime, slotEnd, commitments)
        });
      }

      // Move to next slot with break (default 15 minutes)
      currentTime = new Date(slotEnd.getTime() + 15 * 60000);
    }

    return slots.filter(slot => slot.isAvailable);
  }

  /**
   * Get energy level for specific time based on user settings
   */
  private getEnergyLevelForTime(time: Date, userSettings: UserSettings): EnergyLevel {
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
  private hasConflictWithCommitments(start: Date, end: Date, commitments: TimeSlot[]): boolean {
    return commitments.some(commitment => 
      (start < commitment.endTime && end > commitment.startTime)
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

    return [{
      startTime,
      endTime,
      energyLevel: EnergyLevel.MEDIUM,
      preferredFocusTypes: [FocusType.ADMINISTRATIVE],
      isAvailable: true
    }];
  }

  /**
   * Assign tasks to optimal time slots
   */
  private assignTasksToSlots(tasks: ScoredTask[], slots: TimeSlot[]): Map<string, ScheduleAssignment> {
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
          reasoning: this.generateSchedulingReasoning(task, slot, energyMatch, focusMatch)
        });
        
        usedSlots.add(bestSlotIndex);
      }
    }

    return assignments;
  }

  /**
   * Find best available slot for a task
   */
  private findBestSlotForTask(task: Task, slots: TimeSlot[], usedSlots: Set<number>): number {
    let bestSlotIndex = -1;
    let bestScore = -1;

    for (let i = 0; i < slots.length; i++) {
      if (usedSlots.has(i)) continue;

      const slot = slots[i];
      const energyMatch = this.calculateEnergyMatch(task, slot);
      const focusMatch = this.calculateFocusMatch(task, slot);
      const durationFit = this.calculateDurationFit(task, slot);
      
      // Composite score for slot fitness
      const score = (energyMatch * 0.4) + (focusMatch * 0.3) + (durationFit * 0.3);
      
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
    const slotDuration = (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60);
    
    if (taskDuration <= slotDuration) {
      return 1.0; // Perfect fit
    } else {
      return Math.max(0, 1 - ((taskDuration - slotDuration) / slotDuration));
    }
  }

  /**
   * Generate human-readable scheduling reasoning
   */
  private generateSchedulingReasoning(task: Task, slot: TimeSlot, energyMatch: number, focusMatch: number): string {
    const reasons = [];
    
    if (energyMatch > 0.8) {
      reasons.push(`energy level matches (${task.energyLevel})`);
    }
    
    if (focusMatch > 0.8) {
      reasons.push(`focus type aligns (${task.focusType})`);
    }
    
    if (task.hardDeadline) {
      reasons.push('deadline consideration');
    }
    
    if (task.priority && task.priority > 3) {
      reasons.push('high priority');
    }

    return reasons.length > 0 
      ? `Scheduled due to: ${reasons.join(', ')}`
      : 'Best available slot';
  }

  /**
   * Create schedule blocks from assignments
   */
  private createScheduleBlocks(assignments: Map<string, ScheduleAssignment>): ScheduleBlock[] {
    const blocks: ScheduleBlock[] = [];
    
    for (const assignment of assignments.values()) {
      blocks.push({
        startTime: assignment.timeSlot.startTime,
        endTime: assignment.timeSlot.endTime,
        task: assignment.task,
        energyMatch: assignment.energyMatch,
        focusMatch: assignment.focusMatch,
        reasoning: assignment.reasoning
      });
    }

    // Sort by start time
    return blocks.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * Calculate optimization metrics for the plan
   */
  private calculateOptimizationMetrics(blocks: ScheduleBlock[], allTasks: ScoredTask[]): OptimizationResult {
    if (blocks.length === 0) {
      return {
        energyOptimization: 0,
        focusOptimization: 0,
        deadlineRisk: 0
      };
    }

    // Energy optimization: average energy match
    const energyOptimization = blocks.reduce((sum, block) => sum + block.energyMatch, 0) / blocks.length;
    
    // Focus optimization: average focus match
    const focusOptimization = blocks.reduce((sum, block) => sum + block.focusMatch, 0) / blocks.length;
    
    // Deadline risk: percentage of high-priority deadline tasks not scheduled
    const deadlineTasks = allTasks.filter(t => t.hardDeadline && t.priority && t.priority > 3);
    const scheduledDeadlineTasks = blocks.filter(b => 
      b.task.hardDeadline && b.task.priority && b.task.priority > 3
    ).length;
    
    const deadlineRisk = deadlineTasks.length > 0 
      ? 1 - (scheduledDeadlineTasks / deadlineTasks.length)
      : 0;

    return {
      energyOptimization,
      focusOptimization,
      deadlineRisk
    };
  }

  /**
   * Transform domain model to DTO
   */
  private transformToDto(plan: DailyPlan): DailyPlanResponseDto {
    return {
      date: plan.date.toISOString().split('T')[0],
      scheduleBlocks: plan.scheduleBlocks.map(block => ({
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
          hardDeadline: block.task.hardDeadline?.toISOString()
        },
        energyMatch: block.energyMatch,
        focusMatch: block.focusMatch,
        reasoning: block.reasoning
      })),
      unscheduledTasks: plan.unscheduledTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        energyLevel: task.energyLevel,
        focusType: task.focusType,
        estimatedMinutes: task.estimatedMinutes,
        priority: task.priority,
        hardDeadline: task.hardDeadline?.toISOString()
      })),
      totalEstimatedMinutes: plan.totalEstimatedMinutes,
      energyOptimization: plan.energyOptimization,
      focusOptimization: plan.focusOptimization,
      deadlineRisk: plan.deadlineRisk
    };
  }
}
