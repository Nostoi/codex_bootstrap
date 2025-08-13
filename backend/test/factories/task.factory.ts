import { faker } from '@faker-js/faker';
import { BaseFactory, FactoryManager } from './base.factory';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Task, TaskStatus, EnergyLevel, FocusType, TaskSource } from '@prisma/client';

/**
 * Task Factory for generating ADHD-optimized test tasks
 * Implements realistic patterns for energy levels, focus types, and task complexity
 */
export class TaskFactory extends BaseFactory<Task> {
  private factoryManager = FactoryManager.getInstance();

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Build a task with realistic ADHD-optimized defaults
   */
  build(overrides: Partial<Task> = {}): Task {
    const complexity = overrides.complexity || this.generateComplexity();
    const energyLevel = (overrides.energyLevel as EnergyLevel) || this.generateEnergyLevel();
    const focusType = (overrides.focusType as FocusType) || this.generateFocusType();
    const priority = overrides.priority || this.generatePriority();
    const estimatedMinutes =
      overrides.estimatedMinutes || this.generateEstimatedMinutes(complexity, energyLevel);
    const deadlines = this.generateDeadlines(priority, complexity);

    return {
      id: this.generateTestId('task'),
      title: overrides.title || this.generateTaskTitle(focusType),
      description: overrides.description || this.generateTaskDescription(focusType, complexity),
      completed: overrides.completed || false,
      status: (overrides.status as TaskStatus) || 'TODO',
      dueDate: overrides.dueDate || this.generateDueDate(priority),
      energyLevel: energyLevel,
      focusType: focusType,
      estimatedMinutes,
      priority,
      softDeadline: overrides.softDeadline || deadlines.softDeadline,
      hardDeadline: overrides.hardDeadline || deadlines.hardDeadline,
      source: (overrides.source as TaskSource) || 'MANUAL',
      aiSuggestion: overrides.aiSuggestion || this.generateAiSuggestion(focusType),
      projectId: overrides.projectId || null,
      ownerId: overrides.ownerId || 'test-user-default',
      createdAt: overrides.createdAt || new Date(),
      updatedAt: overrides.updatedAt || new Date(),
      ...overrides,
    } as Task;
  }

  /**
   * Create and persist a task to database
   */
  async create(overrides: Partial<Task> = {}): Promise<Task> {
    const taskData = this.build(overrides);

    // Remove id to let Prisma generate it
    const { id, ...createData } = taskData;

    const task = await this.prisma.task.create({
      data: createData,
    });

    this.factoryManager.trackEntity('task', task.id);
    return task;
  }

  /**
   * Create task with dependencies
   */
  async createWithDependencies(
    taskData: Partial<Task> = {},
    dependencyIds: string[] = []
  ): Promise<Task> {
    const task = await this.create(taskData);

    // Create task dependencies
    for (const dependencyId of dependencyIds) {
      await this.prisma.taskDependency.create({
        data: {
          taskId: task.id,
          dependsOn: dependencyId,
        },
      });
    }

    return task;
  }

  /**
   * Create a project with multiple related tasks
   */
  async createProjectTasks(projectId: string, ownerId: string, count: number = 5): Promise<Task[]> {
    const tasks = [];

    for (let i = 0; i < count; i++) {
      const task = await this.create({
        projectId,
        ownerId,
        title: `Project Task ${i + 1}`,
        // Vary complexity and focus types for realistic project
        focusType: i % 2 === 0 ? 'TECHNICAL' : 'ADMINISTRATIVE',
        energyLevel: i < 2 ? 'HIGH' : i < 4 ? 'MEDIUM' : 'LOW',
        priority: Math.max(1, Math.min(10, 5 + (i - 2))), // Center around priority 5
      });
      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Create ADHD-specific task scenarios
   */
  async createAdhdScenarios(): Promise<{
    highEnergyTasks: Task[];
    lowEnergyTasks: Task[];
    creativeTasks: Task[];
    technicalTasks: Task[];
    urgentTasks: Task[];
    backlogTasks: Task[];
  }> {
    const [
      highEnergyTasks,
      lowEnergyTasks,
      creativeTasks,
      technicalTasks,
      urgentTasks,
      backlogTasks,
    ] = await Promise.all([
      this.createMany(3, { energyLevel: 'HIGH', priority: 8 }),
      this.createMany(3, { energyLevel: 'LOW', priority: 3 }),
      this.createMany(3, { focusType: 'CREATIVE' }),
      this.createMany(3, { focusType: 'TECHNICAL' }),
      this.createMany(2, { priority: 10, hardDeadline: faker.date.soon({ days: 1 }) }),
      this.createMany(5, { priority: 2, completed: false }),
    ]);

    return {
      highEnergyTasks,
      lowEnergyTasks,
      creativeTasks,
      technicalTasks,
      urgentTasks,
      backlogTasks,
    };
  }

  /**
   * Cleanup created tasks
   */
  async cleanup(): Promise<void> {
    const taskIds = this.factoryManager.getCreatedEntities('task');

    if (taskIds.length > 0) {
      // Delete dependencies first
      await this.prisma.taskDependency.deleteMany({
        where: {
          OR: [{ taskId: { in: taskIds } }, { dependsOn: { in: taskIds } }],
        },
      });

      // Delete tasks
      await this.prisma.task.deleteMany({
        where: { id: { in: taskIds } },
      });
    }

    this.factoryManager.clearTracking('task');
  }

  // Private helper methods

  private generateTaskTitle(focusType: FocusType): string {
    const titleTemplates = {
      CREATIVE: [
        'Design new user interface mockup',
        'Brainstorm feature concepts',
        'Write product documentation',
        'Create marketing content',
        'Plan team workshop',
      ],
      TECHNICAL: [
        'Implement user authentication',
        'Fix database query performance',
        'Refactor legacy code module',
        'Set up CI/CD pipeline',
        'Debug production issue',
      ],
      ADMINISTRATIVE: [
        'Update project documentation',
        'Review team performance metrics',
        'Schedule client meetings',
        'Process expense reports',
        'Prepare quarterly report',
      ],
      SOCIAL: [
        'Conduct team standup meeting',
        'Present project updates',
        'Client requirements gathering',
        'Onboard new team member',
        'Facilitate design review',
      ],
    };

    return faker.helpers.arrayElement(titleTemplates[focusType]);
  }

  private generateTaskDescription(focusType: FocusType, complexity: number): string {
    const baseDescriptions = {
      CREATIVE: 'Creative task requiring innovative thinking and design skills.',
      TECHNICAL: 'Technical implementation task requiring focused coding and problem-solving.',
      ADMINISTRATIVE: 'Administrative task involving organization and process management.',
      SOCIAL: 'Collaborative task requiring communication and interpersonal skills.',
    };

    let description = baseDescriptions[focusType];

    if (complexity > 7) {
      description +=
        ' This is a complex task that may require breaking down into smaller subtasks.';
    } else if (complexity < 4) {
      description += ' This is a straightforward task suitable for low-energy periods.';
    }

    return description;
  }

  private generatePriority(): number {
    // Weighted toward medium priorities (3-7) for realistic distribution
    const weights = [1, 2, 4, 6, 8, 6, 4, 2, 1, 1]; // Indices 0-9 for priorities 1-10
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    let random = faker.number.float({ min: 0, max: totalWeight });

    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return i + 1;
      }
    }

    return 5; // fallback
  }

  private generateDueDate(priority: number): Date | null {
    // Higher priority tasks more likely to have due dates
    const hasDueDate = faker.number.float({ min: 0, max: 1 }) < priority / 15 + 0.3;

    if (!hasDueDate) return null;

    // Due date range based on priority
    const daysFromNow = Math.max(1, 21 - priority * 2);
    return faker.date.future({ days: daysFromNow });
  }

  private generateAiSuggestion(focusType: FocusType): string | null {
    // 30% of tasks have AI suggestions
    if (faker.number.float({ min: 0, max: 1 }) > 0.3) return null;

    const suggestions = {
      CREATIVE: [
        'Consider using design thinking methodology for this creative task.',
        'Schedule this during your peak creative hours (usually morning).',
        'Break this into smaller brainstorming sessions to maintain flow.',
      ],
      TECHNICAL: [
        'This technical task pairs well with high-energy periods.',
        'Consider test-driven development approach for this implementation.',
        'Review similar code patterns before starting implementation.',
      ],
      ADMINISTRATIVE: [
        'Batch this with other administrative tasks for efficiency.',
        'Consider delegating parts of this task if possible.',
        'Use templates or automation to speed up completion.',
      ],
      SOCIAL: [
        'Schedule this task when you have social energy available.',
        'Prepare agenda items in advance for better outcomes.',
        'Consider asynchronous alternatives if energy is low.',
      ],
    };

    return faker.helpers.arrayElement(suggestions[focusType]);
  }
}
