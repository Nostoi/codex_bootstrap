import { PrismaService } from '../../src/prisma/prisma.service';
import { TaskFactory } from '../factories/task.factory';
import { UserFactory } from '../factories/user.factory';
import { ProjectFactory } from '../factories/project.factory';
import { MockOpenAIService } from '../mocks/openai.mock';
import { MockMicrosoftGraphService } from '../mocks/microsoft-graph.mock';
import { MockGoogleService } from '../mocks/google.mock';

/**
 * Database utilities for test data management and isolation
 * Provides setup, teardown, and transaction management for tests
 */
export class TestDatabaseUtils {
  private static instance: TestDatabaseUtils;
  private readonly prisma: PrismaService;
  private readonly factories: TestFactories;
  private readonly mocks: TestMocks;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
    this.factories = new TestFactories(prisma);
    this.mocks = new TestMocks();
  }

  static getInstance(prisma: PrismaService): TestDatabaseUtils {
    if (!TestDatabaseUtils.instance) {
      TestDatabaseUtils.instance = new TestDatabaseUtils(prisma);
    }
    return TestDatabaseUtils.instance;
  }

  /**
   * Get factory instances for test data creation
   */
  getFactories(): TestFactories {
    return this.factories;
  }

  /**
   * Get mock service instances
   */
  getMocks(): TestMocks {
    return this.mocks;
  }

  /**
   * Setup test database with clean state
   */
  async setupTestDatabase(): Promise<void> {
    await this.cleanDatabase();
    await this.seedBaseData();
  }

  /**
   * Clean up all test data
   */
  async cleanDatabase(): Promise<void> {
    // Clean up in dependency order to avoid foreign key constraints
    await this.prisma.taskDependency.deleteMany();
    await this.prisma.notification.deleteMany();
    await this.prisma.calendarSyncConflict.deleteMany();
    await this.prisma.calendarEvent.deleteMany();
    await this.prisma.task.deleteMany();
    await this.prisma.project.deleteMany();
    await this.prisma.user.deleteMany();

    // Clear factory tracking
    await this.factories.cleanup();
    this.mocks.clearAll();
  }

  /**
   * Seed minimal base data for tests
   */
  async seedBaseData(): Promise<void> {
    // Create a default test user
    const defaultUser = await this.factories.user.create({
      id: 'test-user-default',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
    });

    // Create a default test project
    const defaultProject = await this.factories.project.create({
      id: 'test-project-default',
      name: 'Default Test Project',
      ownerId: defaultUser.id,
    });
  }

  /**
   * Create comprehensive test scenario with multiple users, projects, and tasks
   */
  async createComprehensiveTestScenario(): Promise<TestScenario> {
    // Create ADHD user personas
    const userCohort = await this.factories.user.createAdhdTestCohort();

    // Create ADHD project scenarios
    const projectScenarios = await this.factories.project.createAdhdProjectScenarios();

    // Create task scenarios for the high achiever user
    const taskScenarios = await this.factories.task.createAdhdScenarios();

    // Update tasks to belong to projects and users
    const projectTasks = await this.factories.task.createProjectTasks(
      projectScenarios.workProject.id,
      userCohort.highAchiever.id,
      8
    );

    return {
      users: userCohort,
      projects: projectScenarios,
      tasks: {
        ...taskScenarios,
        projectTasks,
      },
      metadata: {
        createdAt: new Date(),
        scenario: 'comprehensive',
        userCount: Object.keys(userCohort).length,
        projectCount: Object.keys(projectScenarios).length,
        taskCount: Object.values(taskScenarios).flat().length + projectTasks.length,
      },
    };
  }

  /**
   * Create scenario for testing AI services
   */
  async createAiTestScenario(): Promise<AiTestScenario> {
    const user = await this.factories.user.createAdhdPersona('TECHNICAL');
    const project = await this.factories.project.create({
      name: 'AI Testing Project',
      ownerId: user.id,
    });

    // Create tasks that will trigger AI suggestions
    const tasks = await Promise.all([
      this.factories.task.create({
        title: 'Implement user authentication system',
        projectId: project.id,
        ownerId: user.id,
        energyLevel: 'HIGH',
        focusType: 'TECHNICAL',
        priority: 8,
      }),
      this.factories.task.create({
        title: 'Review documentation updates',
        projectId: project.id,
        ownerId: user.id,
        energyLevel: 'LOW',
        focusType: 'ADMINISTRATIVE',
        priority: 3,
      }),
      this.factories.task.create({
        title: 'Design new dashboard layout',
        projectId: project.id,
        ownerId: user.id,
        energyLevel: 'MEDIUM',
        focusType: 'CREATIVE',
        priority: 6,
      }),
    ]);

    // Set up AI mock responses
    this.mocks.openai.setMockResponse(
      'extract:Implement user authentication with OAuth2 and JWT tokens',
      [
        {
          title: 'Set up OAuth2 provider configuration',
          description: 'Configure Google and Microsoft OAuth providers',
          energyLevel: 'MEDIUM',
          focusType: 'TECHNICAL',
          estimatedMinutes: 45,
          priority: 7,
          source: 'AI_EXTRACTED',
          confidence: 0.92,
          originalText: 'Implement user authentication with OAuth2 and JWT tokens',
        },
        {
          title: 'Implement JWT token management',
          description: 'Create token generation, validation, and refresh logic',
          energyLevel: 'HIGH',
          focusType: 'TECHNICAL',
          estimatedMinutes: 90,
          priority: 8,
          source: 'AI_EXTRACTED',
          confidence: 0.88,
          originalText: 'Implement user authentication with OAuth2 and JWT tokens',
        },
      ]
    );

    return {
      user,
      project,
      tasks,
      aiResponses: {
        extractionSample: 'Implement user authentication with OAuth2 and JWT tokens',
        classificationSample: tasks[0].title,
      },
    };
  }

  /**
   * Create scenario for testing calendar integration
   */
  async createCalendarTestScenario(): Promise<CalendarTestScenario> {
    const user = await this.factories.user.create({
      googleId: 'google-test-user',
      microsoftId: 'microsoft-test-user',
      preferences: {
        calendarSync: true,
        peakEnergyHours: 'MORNING',
        autoScheduling: true,
      },
    });

    // Mock calendar events from both providers
    const googleEvents = await this.mocks.google.getCalendarEvents(
      user.id,
      'primary',
      new Date(),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
    );

    const microsoftEvents = await this.mocks.microsoftGraph.getCalendarEvents(
      user.id,
      new Date(),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    // Create calendar events in database
    const calendarEvents = await Promise.all([
      ...googleEvents.slice(0, 3).map(event =>
        this.prisma.calendarEvent.create({
          data: {
            externalId: event.id,
            title: event.summary,
            description: event.description,
            startTime: new Date(event.start.dateTime || event.start.date || ''),
            endTime: new Date(event.end.dateTime || event.end.date || ''),
            provider: 'GOOGLE',
            userId: user.id,
            metadata: event,
          },
        })
      ),
      ...microsoftEvents.slice(0, 3).map(event =>
        this.prisma.calendarEvent.create({
          data: {
            externalId: event.id,
            title: event.subject,
            description: event.body.content,
            startTime: new Date(event.start.dateTime),
            endTime: new Date(event.end.dateTime),
            provider: 'MICROSOFT',
            userId: user.id,
            metadata: event,
          },
        })
      ),
    ]);

    return {
      user,
      calendarEvents,
      googleEvents,
      microsoftEvents,
      syncStatus: {
        google: await this.mocks.google.getSyncStatus(user.id),
        microsoft: await this.mocks.microsoftGraph.getSyncStatus(user.id),
      },
    };
  }

  /**
   * Transaction wrapper for test isolation
   */
  async withTransaction<T>(callback: (prisma: PrismaService) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async tx => {
      return callback(tx as PrismaService);
    });
  }

  /**
   * Get database statistics for test validation
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    const [userCount, projectCount, taskCount, notificationCount, calendarEventCount] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.project.count(),
        this.prisma.task.count(),
        this.prisma.notification.count(),
        this.prisma.calendarEvent.count(),
      ]);

    return {
      userCount,
      projectCount,
      taskCount,
      notificationCount,
      calendarEventCount,
      totalRecords: userCount + projectCount + taskCount + notificationCount + calendarEventCount,
    };
  }

  /**
   * Validate test data integrity
   */
  async validateDataIntegrity(): Promise<DataIntegrityReport> {
    const issues: string[] = [];

    // Check for orphaned tasks
    const orphanedTasks = await this.prisma.task.findMany({
      where: {
        ownerId: {
          notIn: await this.prisma.user
            .findMany({ select: { id: true } })
            .then(users => users.map(u => u.id)),
        },
      },
    });

    if (orphanedTasks.length > 0) {
      issues.push(`Found ${orphanedTasks.length} orphaned tasks without valid users`);
    }

    // Check for tasks with invalid project references
    const tasksWithInvalidProjects = await this.prisma.task.findMany({
      where: {
        projectId: {
          not: null,
          notIn: await this.prisma.project
            .findMany({ select: { id: true } })
            .then(projects => projects.map(p => p.id)),
        },
      },
    });

    if (tasksWithInvalidProjects.length > 0) {
      issues.push(`Found ${tasksWithInvalidProjects.length} tasks with invalid project references`);
    }

    // Check for circular task dependencies
    const dependencies = await this.prisma.taskDependency.findMany();
    const circularDeps = this.detectCircularDependencies(dependencies);

    if (circularDeps.length > 0) {
      issues.push(`Found ${circularDeps.length} circular task dependencies`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      checkedAt: new Date(),
    };
  }

  /**
   * Reset all mock services to default state
   */
  resetMocks(): void {
    this.mocks.clearAll();
  }

  // Private helper methods

  private detectCircularDependencies(
    dependencies: Array<{ taskId: string; dependsOn: string }>
  ): string[] {
    const graph: Record<string, string[]> = {};
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];

    // Build adjacency list
    dependencies.forEach(({ taskId, dependsOn }) => {
      if (!graph[taskId]) graph[taskId] = [];
      graph[taskId].push(dependsOn);
    });

    // DFS to detect cycles
    const dfs = (node: string, path: string[]): boolean => {
      if (recursionStack.has(node)) {
        cycles.push(path.join(' -> ') + ' -> ' + node);
        return true;
      }

      if (visited.has(node)) return false;

      visited.add(node);
      recursionStack.add(node);

      const neighbors = graph[node] || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor, [...path, node])) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    // Check all nodes
    Object.keys(graph).forEach(node => {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    });

    return cycles;
  }
}

/**
 * Aggregated factory instances for convenience
 */
export class TestFactories {
  public readonly task: TaskFactory;
  public readonly user: UserFactory;
  public readonly project: ProjectFactory;

  constructor(prisma: PrismaService) {
    this.task = new TaskFactory(prisma);
    this.user = new UserFactory(prisma);
    this.project = new ProjectFactory(prisma);
  }

  async cleanup(): Promise<void> {
    await Promise.all([this.task.cleanup(), this.user.cleanup(), this.project.cleanup()]);
  }
}

/**
 * Aggregated mock service instances
 */
export class TestMocks {
  public readonly openai: MockOpenAIService;
  public readonly microsoftGraph: MockMicrosoftGraphService;
  public readonly google: MockGoogleService;

  constructor() {
    this.openai = MockOpenAIService.getInstance();
    this.microsoftGraph = MockMicrosoftGraphService.getInstance();
    this.google = MockGoogleService.getInstance();
  }

  clearAll(): void {
    this.openai.clearMockResponses();
    this.microsoftGraph.clearMockResponses();
    this.google.clearMockResponses();
  }
}

// Type definitions for test scenarios

export interface TestScenario {
  users: Awaited<ReturnType<UserFactory['createAdhdTestCohort']>>;
  projects: Awaited<ReturnType<ProjectFactory['createAdhdProjectScenarios']>>;
  tasks: {
    highEnergyTasks: any[];
    lowEnergyTasks: any[];
    creativeTasks: any[];
    technicalTasks: any[];
    urgentTasks: any[];
    backlogTasks: any[];
    projectTasks: any[];
  };
  metadata: {
    createdAt: Date;
    scenario: string;
    userCount: number;
    projectCount: number;
    taskCount: number;
  };
}

export interface AiTestScenario {
  user: any;
  project: any;
  tasks: any[];
  aiResponses: {
    extractionSample: string;
    classificationSample: string;
  };
}

export interface CalendarTestScenario {
  user: any;
  calendarEvents: any[];
  googleEvents: any[];
  microsoftEvents: any[];
  syncStatus: {
    google: any;
    microsoft: any;
  };
}

export interface DatabaseStats {
  userCount: number;
  projectCount: number;
  taskCount: number;
  notificationCount: number;
  calendarEventCount: number;
  totalRecords: number;
}

export interface DataIntegrityReport {
  isValid: boolean;
  issues: string[];
  checkedAt: Date;
}
