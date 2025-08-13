import {
  TestTask,
  TestUser,
  TestProject,
  TestCalendarEvent,
  EnergyLevel,
  FocusType,
  Priority,
  TaskStatus,
} from '../types/testTypes';

/**
 * Utility function to generate consistent test IDs
 */
export function generateTestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Factory for creating test user data with ADHD-friendly defaults
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    id: generateTestId('user'),
    email: 'test@example.com',
    name: 'Test User',
    preferences: {
      theme: 'corporate',
      energyPattern: 'night-owl',
      defaultView: 'grid',
      notificationsEnabled: true,
      calendarIntegration: {
        google: true,
        outlook: true,
      },
      emailIntegration: {
        gmail: true,
        outlook: true,
      },
      aiFeatures: {
        taskExtraction: true,
        smartSuggestions: true,
        proactiveReminders: true,
      },
    },
    ...overrides,
  };
}

/**
 * Task Factory for generating test task data
 */
export class TaskFactory {
  private static counter = 0;

  /**
   * Create a basic task with minimal metadata
   */
  static createBasicTask(overrides: Partial<TestTask> = {}): TestTask {
    this.counter++;

    return {
      id: generateTestId('task'),
      title: `Test Task ${this.counter}`,
      description: `Description for test task ${this.counter}`,
      status: 'pending',
      priority: 'medium' as Priority,
      projectId: 'test-project-1',
      userId: 'test-user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: null,
      completedAt: null,
      tags: [],
      ...overrides,
    };
  }

  /**
   * Create an ADHD-optimized task with energy level and focus type
   */
  static createADHDTask(
    energyLevel: EnergyLevel,
    focusType: FocusType,
    overrides: Partial<TestTask> = {}
  ): TestTask {
    const complexityByEnergy = {
      HIGH: Math.floor(Math.random() * 3) + 8, // 8-10
      MEDIUM: Math.floor(Math.random() * 4) + 4, // 4-7
      LOW: Math.floor(Math.random() * 4) + 1, // 1-4
    };

    const durationByEnergy = {
      HIGH: Math.floor(Math.random() * 120) + 60, // 60-180 minutes
      MEDIUM: Math.floor(Math.random() * 90) + 30, // 30-120 minutes
      LOW: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
    };

    return this.createBasicTask({
      title: `${energyLevel} Energy ${focusType} Task`,
      description: `A ${energyLevel.toLowerCase()} energy task requiring ${focusType.toLowerCase()} focus`,
      metadata: {
        energyLevel,
        focusType,
        complexity: complexityByEnergy[energyLevel],
        estimatedDuration: durationByEnergy[energyLevel],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
      },
      tags: [energyLevel.toLowerCase(), focusType.toLowerCase()],
      ...overrides,
    });
  }

  /**
   * Create a task with dependencies
   */
  static createDependentTask(dependsOn: string[], overrides: Partial<TestTask> = {}): TestTask {
    return this.createBasicTask({
      title: 'Dependent Task',
      description: 'A task that depends on other tasks',
      metadata: {
        dependsOn,
        complexity: 6,
      },
      ...overrides,
    });
  }

  /**
   * Create a large dataset of tasks for performance testing
   */
  static createLargeDataset(count: number): TestTask[] {
    const energyLevels: EnergyLevel[] = ['HIGH', 'MEDIUM', 'LOW'];
    const focusTypes: FocusType[] = ['CREATIVE', 'TECHNICAL', 'ADMINISTRATIVE', 'SOCIAL'];
    const statuses: TaskStatus[] = ['pending', 'in-progress', 'completed', 'blocked'];
    const priorities: Priority[] = ['low', 'medium', 'high'];

    return Array.from({ length: count }, (_, i) => {
      const energyLevel = energyLevels[i % energyLevels.length];
      const focusType = focusTypes[i % focusTypes.length];
      const status = statuses[i % statuses.length];
      const priority = priorities[i % priorities.length];

      return this.createADHDTask(energyLevel, focusType, {
        title: `Performance Test Task ${i + 1}`,
        status,
        priority,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
      });
    });
  }

  /**
   * Create tasks with complex dependency chains
   */
  static createDependencyChain(length: number): TestTask[] {
    const tasks: TestTask[] = [];

    // Create root task
    const rootTask = this.createBasicTask({
      title: 'Root Task',
      description: 'Starting point of dependency chain',
    });
    tasks.push(rootTask);

    // Create dependent tasks
    for (let i = 1; i < length; i++) {
      const dependentTask = this.createDependentTask([tasks[i - 1].id], {
        title: `Dependent Task ${i}`,
        description: `Task ${i} in dependency chain`,
      });
      tasks.push(dependentTask);
    }

    return tasks;
  }

  /**
   * Reset counter for consistent test runs
   */
  static resetCounter(): void {
    this.counter = 0;
  }

  /**
   * Create task with specific energy level (alias for createADHDTask)
   */
  static createWithEnergyLevel(energyLevel: EnergyLevel): TestTask {
    const focusTypes: FocusType[] = ['CREATIVE', 'TECHNICAL', 'ADMINISTRATIVE', 'SOCIAL'];
    const focusType = focusTypes[Math.floor(Math.random() * focusTypes.length)];
    return this.createADHDTask(energyLevel, focusType);
  }

  /**
   * Create task with specific metadata
   */
  static createWithMetadata(overrides: Partial<TestTask>): TestTask {
    return this.createBasicTask(overrides);
  }

  /**
   * Create batch of tasks
   */
  static createBatch(count: number, template: Partial<TestTask> = {}): TestTask[] {
    const tasks: TestTask[] = [];

    for (let i = 0; i < count; i++) {
      tasks.push(
        this.createBasicTask({
          title: `Batch Task ${i + 1}`,
          ...template,
        })
      );
    }

    return tasks;
  }
}

/**
 * User Factory for generating test user data
 */
export class UserFactory {
  /**
   * Create a test user with default preferences
   */
  static createTestUser(overrides: Partial<TestUser> = {}): TestUser {
    return {
      id: generateTestId('user'),
      email: 'test@example.com',
      name: 'Test User',
      avatar: null,
      preferences: {
        theme: 'corporate',
        energyPattern: 'morning-person',
        defaultView: 'grid',
        notificationsEnabled: true,
        calendarIntegration: {
          google: false,
          outlook: false,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Create an ADHD user with optimized preferences
   */
  static createADHDUser(overrides: Partial<TestUser> = {}): TestUser {
    return this.createTestUser({
      name: 'ADHD Test User',
      preferences: {
        theme: 'corporate',
        energyPattern: 'morning-person',
        defaultView: 'focus',
        notificationsEnabled: true,
        reducedMotion: true,
        highContrast: false,
        batchNotifications: true,
        focusMode: {
          enabled: true,
          duration: 25, // Pomodoro-style
          breakDuration: 5,
        },
        calendarIntegration: {
          google: true,
          outlook: false,
        },
      },
      ...overrides,
    });
  }

  /**
   * Create a power user with all integrations enabled
   */
  static createPowerUser(overrides: Partial<TestUser> = {}): TestUser {
    return this.createTestUser({
      name: 'Power User',
      preferences: {
        theme: 'corporate',
        energyPattern: 'night-owl',
        defaultView: 'grid',
        notificationsEnabled: true,
        calendarIntegration: {
          google: true,
          outlook: true,
        },
        emailIntegration: {
          gmail: true,
          outlook: true,
        },
        aiFeatures: {
          taskExtraction: true,
          smartSuggestions: true,
          proactiveReminders: true,
        },
      },
      ...overrides,
    });
  }

  /**
   * Create user with specific profile
   */
  static createWithProfile(profile: 'basic' | 'adhd' | 'power'): TestUser {
    switch (profile) {
      case 'adhd':
        return this.createADHDUser();
      case 'power':
        return this.createPowerUser();
      case 'basic':
      default:
        return this.createTestUser();
    }
  }
}

/**
 * Project Factory for generating test project data
 */
export class ProjectFactory {
  /**
   * Create a basic test project
   */
  static createTestProject(overrides: Partial<Project> = {}): Project {
    return {
      id: generateTestId('project'),
      name: 'Test Project',
      description: 'A test project for E2E testing',
      ownerId: 'test-user-1',
      members: ['test-user-1'],
      settings: {
        defaultEnergyLevel: 'MEDIUM',
        defaultFocusType: 'TECHNICAL',
        enableAI: true,
        enableCalendarSync: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Create a multi-user collaborative project
   */
  static createCollaborativeProject(memberCount: number = 3): Project {
    const members = Array.from({ length: memberCount }, (_, i) => generateTestId(`user_${i + 1}`));

    return this.createTestProject({
      name: 'Collaborative Project',
      description: 'A project with multiple team members',
      members,
      settings: {
        defaultEnergyLevel: 'MEDIUM',
        defaultFocusType: 'TECHNICAL',
        enableAI: true,
        enableCalendarSync: true,
        allowMemberTaskCreation: true,
        requireApprovalForChanges: false,
      },
    });
  }
}

/**
 * Calendar Event Factory for generating test calendar data
 */
export class CalendarEventFactory {
  /**
   * Create a Google Calendar event
   */
  static createGoogleEvent(overrides: any = {}): any {
    return {
      id: generateTestId('google_event'),
      summary: 'Test Google Meeting',
      description: 'A test meeting from Google Calendar',
      start: {
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        timeZone: 'UTC',
      },
      attendees: [{ email: 'test@example.com', responseStatus: 'accepted' }],
      source: 'google',
      ...overrides,
    };
  }

  /**
   * Create an Outlook Calendar event
   */
  static createOutlookEvent(overrides: any = {}): any {
    return {
      id: generateTestId('outlook_event'),
      subject: 'Test Outlook Meeting',
      body: { content: 'A test meeting from Outlook Calendar' },
      start: {
        dateTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        timeZone: 'UTC',
      },
      attendees: [{ emailAddress: { address: 'test@example.com' } }],
      source: 'outlook',
      ...overrides,
    };
  }

  /**
   * Create conflicting calendar events for testing conflict resolution
   */
  static createConflictingEvents(): any[] {
    const baseTime = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now

    return [
      this.createGoogleEvent({
        summary: 'Google Meeting (Conflicting)',
        start: { dateTime: baseTime.toISOString() },
        end: { dateTime: new Date(baseTime.getTime() + 60 * 60 * 1000).toISOString() },
      }),
      this.createOutlookEvent({
        subject: 'Outlook Meeting (Conflicting)',
        start: { dateTime: new Date(baseTime.getTime() + 30 * 60 * 1000).toISOString() }, // 30 min overlap
        end: { dateTime: new Date(baseTime.getTime() + 90 * 60 * 1000).toISOString() },
      }),
    ];
  }
}

/**
 * Test data scenarios for different testing contexts
 */
export class TestDataScenarios {
  /**
   * Basic dashboard scenario with minimal data
   */
  static createBasicDashboard() {
    return {
      user: UserFactory.createTestUser(),
      project: ProjectFactory.createTestProject(),
      tasks: [
        TaskFactory.createADHDTask('HIGH', 'CREATIVE'),
        TaskFactory.createADHDTask('MEDIUM', 'TECHNICAL'),
        TaskFactory.createADHDTask('LOW', 'ADMINISTRATIVE'),
      ],
    };
  }

  /**
   * Performance testing scenario with large dataset
   */
  static createPerformanceScenario(taskCount: number = 1000) {
    return {
      user: UserFactory.createPowerUser(),
      project: ProjectFactory.createTestProject(),
      tasks: TaskFactory.createLargeDataset(taskCount),
    };
  }

  /**
   * Calendar integration scenario
   */
  static createCalendarScenario() {
    return {
      user: UserFactory.createPowerUser({
        preferences: {
          calendarIntegration: {
            google: true,
            outlook: true,
          },
        },
      }),
      project: ProjectFactory.createTestProject(),
      tasks: TaskFactory.createLargeDataset(20),
      calendarEvents: [
        ...Array.from({ length: 5 }, () => CalendarEventFactory.createGoogleEvent()),
        ...Array.from({ length: 5 }, () => CalendarEventFactory.createOutlookEvent()),
      ],
    };
  }

  /**
   * ADHD-focused testing scenario
   */
  static createADHDScenario() {
    const energyLevels: EnergyLevel[] = ['HIGH', 'MEDIUM', 'LOW'];
    const focusTypes: FocusType[] = ['CREATIVE', 'TECHNICAL', 'ADMINISTRATIVE', 'SOCIAL'];

    const tasks: Task[] = [];

    // Create tasks for all energy/focus combinations
    energyLevels.forEach(energy => {
      focusTypes.forEach(focus => {
        tasks.push(TaskFactory.createADHDTask(energy, focus));
      });
    });

    return {
      user: UserFactory.createADHDUser(),
      project: ProjectFactory.createTestProject(),
      tasks,
    };
  }

  /**
   * Dependency testing scenario
   */
  static createDependencyScenario() {
    const dependencyChain = TaskFactory.createDependencyChain(5);
    const independentTasks = Array.from({ length: 10 }, () => TaskFactory.createBasicTask());

    return {
      user: UserFactory.createTestUser(),
      project: ProjectFactory.createTestProject(),
      tasks: [...dependencyChain, ...independentTasks],
    };
  }
}

/**
 * Utility functions for test data management
 */
export class TestDataUtils {
  /**
   * Reset all factory counters
   */
  static resetFactories(): void {
    TaskFactory.resetCounter();
  }

  /**
   * Generate consistent test data for a scenario
   */
  static generateScenarioData(scenario: keyof typeof TestDataScenarios): any {
    this.resetFactories();

    switch (scenario) {
      case 'createBasicDashboard':
        return TestDataScenarios.createBasicDashboard();
      case 'createPerformanceScenario':
        return TestDataScenarios.createPerformanceScenario();
      case 'createCalendarScenario':
        return TestDataScenarios.createCalendarScenario();
      case 'createADHDScenario':
        return TestDataScenarios.createADHDScenario();
      case 'createDependencyScenario':
        return TestDataScenarios.createDependencyScenario();
      default:
        return TestDataScenarios.createBasicDashboard();
    }
  }

  /**
   * Validate test data integrity
   */
  static validateTestData(data: any): boolean {
    // Check required fields
    if (!data.user || !data.project || !data.tasks) {
      return false;
    }

    // Validate task structure
    return data.tasks.every((task: Task) => task.id && task.title && task.status && task.priority);
  }
}
