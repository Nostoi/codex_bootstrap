import { Page } from '@playwright/test';

// Types for mock data
interface MockTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  metadata?: {
    energyLevel?: string;
    focusType?: string;
    priority?: number;
    estimatedDuration?: number;
  };
  createdAt: string;
}

interface MockTaskListResponse {
  tasks: MockTask[];
  total: number;
  page: number;
  limit: number;
}

/**
 * OpenAI API Mock Responses
 */
export const mockOpenAIResponses = {
  taskExtraction: {
    success: {
      choices: [
        {
          message: {
            function_call: {
              name: 'extract_tasks',
              arguments: JSON.stringify({
                tasks: [
                  {
                    title: 'Review quarterly metrics',
                    description: 'Analyze Q4 performance data and prepare summary',
                    energyLevel: 'MEDIUM',
                    focusType: 'ANALYTICAL',
                    priority: 7,
                    estimatedDuration: 90,
                    complexity: 6,
                  },
                  {
                    title: 'Update project timeline',
                    description: 'Revise project milestones based on current progress',
                    energyLevel: 'LOW',
                    focusType: 'ADMINISTRATIVE',
                    priority: 5,
                    estimatedDuration: 30,
                    complexity: 3,
                  },
                ],
              }),
            },
          },
        },
      ],
      usage: {
        prompt_tokens: 250,
        completion_tokens: 150,
        total_tokens: 400,
      },
    },
    rateLimited: {
      error: {
        type: 'rate_limit_exceeded',
        message: 'Rate limit exceeded. Please try again later.',
        code: 'rate_limit_exceeded',
      },
    },
    timeout: {
      error: {
        type: 'timeout',
        message: 'Request timeout after 30 seconds',
        code: 'timeout',
      },
    },
    invalidRequest: {
      error: {
        type: 'invalid_request_error',
        message: 'Invalid request format',
        code: 'invalid_request',
      },
    },
    quotaExceeded: {
      error: {
        type: 'insufficient_quota',
        message: 'You exceeded your current quota',
        code: 'insufficient_quota',
      },
    },
  },

  taskClassification: {
    success: {
      choices: [
        {
          message: {
            function_call: {
              name: 'classify_task',
              arguments: JSON.stringify({
                energyLevel: 'HIGH',
                focusType: 'CREATIVE',
                priority: 8,
                estimatedDuration: 120,
                complexity: 7,
                tags: ['design', 'creative', 'high-focus'],
                suggestedTimeSlot: '09:00-11:00',
              }),
            },
          },
        },
      ],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 80,
        total_tokens: 230,
      },
    },
  },

  dailyPlanGeneration: {
    success: {
      choices: [
        {
          message: {
            function_call: {
              name: 'generate_daily_plan',
              arguments: JSON.stringify({
                timeSlots: [
                  {
                    startTime: '09:00',
                    endTime: '10:30',
                    taskId: 'task-1',
                    energyLevel: 'HIGH',
                    focusType: 'CREATIVE',
                    reasoning: 'Morning hours ideal for creative work',
                  },
                  {
                    startTime: '10:45',
                    endTime: '11:30',
                    taskId: 'task-2',
                    energyLevel: 'MEDIUM',
                    focusType: 'TECHNICAL',
                    reasoning: 'Good focus time for technical tasks',
                  },
                  {
                    startTime: '14:00',
                    endTime: '14:30',
                    taskId: 'task-3',
                    energyLevel: 'LOW',
                    focusType: 'ADMINISTRATIVE',
                    reasoning: 'Post-lunch low energy suitable for admin tasks',
                  },
                ],
                conflicts: [],
                optimizationScore: 85,
                totalPlannedTime: 195,
                energyDistribution: {
                  HIGH: 90,
                  MEDIUM: 45,
                  LOW: 30,
                },
              }),
            },
          },
        },
      ],
    },
  },
};

/**
 * Calendar API Mock Responses
 */
export const mockCalendarResponses = {
  google: {
    events: {
      items: [
        {
          id: 'google-event-1',
          summary: 'Team Standup',
          description: 'Daily team synchronization meeting',
          start: {
            dateTime: '2025-01-15T09:00:00Z',
            timeZone: 'UTC',
          },
          end: {
            dateTime: '2025-01-15T09:30:00Z',
            timeZone: 'UTC',
          },
          attendees: [{ email: 'user@example.com', responseStatus: 'accepted' }],
          location: 'Conference Room A',
          source: 'google',
        },
        {
          id: 'google-event-2',
          summary: 'Project Review',
          description: 'Weekly project status review',
          start: {
            dateTime: '2025-01-15T14:00:00Z',
            timeZone: 'UTC',
          },
          end: {
            dateTime: '2025-01-15T15:00:00Z',
            timeZone: 'UTC',
          },
          attendees: [
            { email: 'user@example.com', responseStatus: 'accepted' },
            { email: 'manager@example.com', responseStatus: 'accepted' },
          ],
          source: 'google',
        },
      ],
    },
  },

  outlook: {
    value: [
      {
        id: 'outlook-event-1',
        subject: 'Client Presentation',
        body: {
          content: 'Quarterly business review with key client',
        },
        start: {
          dateTime: '2025-01-15T10:00:00Z',
          timeZone: 'UTC',
        },
        end: {
          dateTime: '2025-01-15T11:00:00Z',
          timeZone: 'UTC',
        },
        attendees: [
          {
            emailAddress: {
              address: 'user@example.com',
              name: 'Test User',
            },
            status: { response: 'accepted' },
          },
        ],
        location: { displayName: 'Meeting Room B' },
        source: 'outlook',
      },
      {
        id: 'outlook-event-2',
        subject: 'Design Workshop',
        body: {
          content: 'Collaborative design session for new features',
        },
        start: {
          dateTime: '2025-01-15T15:30:00Z',
          timeZone: 'UTC',
        },
        end: {
          dateTime: '2025-01-15T17:00:00Z',
          timeZone: 'UTC',
        },
        attendees: [
          {
            emailAddress: {
              address: 'user@example.com',
              name: 'Test User',
            },
          },
          {
            emailAddress: {
              address: 'designer@example.com',
              name: 'Design Lead',
            },
          },
        ],
        source: 'outlook',
      },
    ],
  },
};

/**
 * Backend API Mock Responses
 */
export const mockBackendResponses = {
  tasks: {
    list: {
      tasks: [
        {
          id: 'task-1',
          title: 'Complete project proposal',
          description: 'Write comprehensive project proposal for Q2 initiative',
          status: 'pending',
          metadata: {
            energyLevel: 'HIGH',
            focusType: 'CREATIVE',
            priority: 8,
            estimatedDuration: 120,
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'task-2',
          title: 'Review code changes',
          description: 'Review pull requests from team members',
          status: 'in-progress',
          metadata: {
            energyLevel: 'MEDIUM',
            focusType: 'TECHNICAL',
            priority: 6,
            estimatedDuration: 45,
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'task-3',
          title: 'Update documentation',
          description: 'Update API documentation with recent changes',
          status: 'pending',
          metadata: {
            energyLevel: 'LOW',
            focusType: 'ADMINISTRATIVE',
            priority: 4,
            estimatedDuration: 30,
          },
          createdAt: new Date().toISOString(),
        },
      ],
      total: 3,
      page: 1,
      limit: 50,
    },
    create: {
      id: 'new-task-id',
      title: 'New Task',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    update: {
      id: 'updated-task-id',
      updatedAt: new Date().toISOString(),
    },
    delete: {
      success: true,
      deletedId: 'deleted-task-id',
    },
  },

  dailyPlan: {
    today: {
      date: new Date().toISOString().split('T')[0],
      timeSlots: [
        {
          startTime: '09:00',
          endTime: '10:30',
          taskId: null,
          energyLevel: 'HIGH',
          available: true,
        },
        {
          startTime: '10:45',
          endTime: '12:00',
          taskId: null,
          energyLevel: 'HIGH',
          available: true,
        },
        {
          startTime: '14:00',
          endTime: '15:30',
          taskId: null,
          energyLevel: 'MEDIUM',
          available: true,
        },
      ],
      calendarEvents: [],
      conflicts: [],
      optimizationScore: 0,
    },
    generate: {
      success: true,
      plan: {
        date: new Date().toISOString().split('T')[0],
        timeSlots: [
          {
            startTime: '09:00',
            endTime: '10:30',
            taskId: 'task-1',
            energyLevel: 'HIGH',
            focusType: 'CREATIVE',
          },
        ],
        optimizationScore: 85,
      },
    },
  },

  notifications: {
    list: {
      notifications: [
        {
          id: 'notif-1',
          type: 'task_reminder',
          title: 'Task Due Soon',
          message: 'Your task "Complete project proposal" is due in 1 hour',
          priority: 'medium',
          createdAt: new Date().toISOString(),
          read: false,
        },
      ],
      unreadCount: 1,
    },
    markRead: {
      success: true,
      readCount: 1,
    },
  },
};

/**
 * Mock Service Class for AI API calls
 */
export class MockAIService {
  private requestCounts: Map<string, number> = new Map();
  private rateLimitThreshold = 10;
  private isServiceDown = false;

  /**
   * Simulate AI service request with realistic delays and error conditions
   */
  async mockAIRequest(endpoint: string, request: any): Promise<any> {
    // Increment request counter
    const currentCount = this.requestCounts.get(endpoint) || 0;
    this.requestCounts.set(endpoint, currentCount + 1);

    // Simulate rate limiting
    if (currentCount >= this.rateLimitThreshold) {
      throw new Error(JSON.stringify(mockOpenAIResponses.taskExtraction.rateLimited));
    }

    // Simulate service downtime
    if (this.isServiceDown) {
      throw new Error('Service temporarily unavailable');
    }

    // Simulate realistic response time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    // Return appropriate mock response based on endpoint
    switch (endpoint) {
      case 'extract-tasks':
        return mockOpenAIResponses.taskExtraction.success;
      case 'classify-task':
        return mockOpenAIResponses.taskClassification.success;
      case 'generate-plan':
        return mockOpenAIResponses.dailyPlanGeneration.success;
      default:
        return { success: true };
    }
  }

  /**
   * Reset request counters (for test isolation)
   */
  resetCounters(): void {
    this.requestCounts.clear();
  }

  /**
   * Set service availability
   */
  setServiceAvailability(isAvailable: boolean): void {
    this.isServiceDown = !isAvailable;
  }

  /**
   * Set rate limit threshold
   */
  setRateLimitThreshold(threshold: number): void {
    this.rateLimitThreshold = threshold;
  }
}

/**
 * Mock Route Builder for Playwright tests
 */
export class MockRouteBuilder {
  private mockAIService = new MockAIService();

  constructor(private page: Page) {}

  /**
   * Setup all mock routes for a comprehensive test
   */
  async setupAllMocks(): Promise<void> {
    await this.mockTaskAPI();
    await this.mockAIAPI();
    await this.mockCalendarAPI();
    await this.mockDailyPlanAPI();
    await this.mockNotificationAPI();
  }

  /**
   * Mock Task Management API
   */
  async mockTaskAPI(): Promise<void> {
    // List tasks
    await this.page.route('**/api/tasks**', async route => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'GET') {
        const searchParams = new URLSearchParams(url.split('?')[1] || '');
        const mockResponse = this.getFilteredTasks(searchParams);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse),
        });
      } else if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(mockBackendResponses.tasks.create),
        });
      } else if (method === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockBackendResponses.tasks.update),
        });
      } else if (method === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockBackendResponses.tasks.delete),
        });
      }
    });
  }

  /**
   * Mock AI Service API
   */
  async mockAIAPI(): Promise<void> {
    await this.page.route('**/api/ai/**', async route => {
      const url = route.request().url();
      const endpoint = this.extractEndpoint(url);

      try {
        const response = await this.mockAIService.mockAIRequest(endpoint, {});

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response),
        });
      } catch (error) {
        const errorResponse =
          error instanceof Error
            ? JSON.parse(error.message)
            : { error: { type: 'unknown_error', message: 'Unknown error occurred' } };

        await route.fulfill({
          status: 429, // Rate limit error
          contentType: 'application/json',
          body: JSON.stringify(errorResponse),
        });
      }
    });
  }

  /**
   * Mock Calendar Integration API
   */
  async mockCalendarAPI(): Promise<void> {
    // Google Calendar
    await this.page.route('**/api/google/calendar/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCalendarResponses.google.events),
      });
    });

    // Outlook Calendar
    await this.page.route('**/api/graph/calendar/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCalendarResponses.outlook),
      });
    });
  }

  /**
   * Mock Daily Planning API
   */
  async mockDailyPlanAPI(): Promise<void> {
    // Get today's plan
    await this.page.route('**/api/plans/today**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBackendResponses.dailyPlan.today),
      });
    });

    // Generate new plan
    await this.page.route('**/api/plans/generate**', async route => {
      // Simulate plan generation delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockBackendResponses.dailyPlan.generate),
      });
    });
  }

  /**
   * Mock Notification API
   */
  async mockNotificationAPI(): Promise<void> {
    await this.page.route('**/api/notifications**', async route => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockBackendResponses.notifications.list),
        });
      } else if (method === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockBackendResponses.notifications.markRead),
        });
      }
    });
  }

  /**
   * Set AI service configuration for testing different scenarios
   */
  configureAIService(config: { isAvailable?: boolean; rateLimitThreshold?: number }): void {
    if (config.isAvailable !== undefined) {
      this.mockAIService.setServiceAvailability(config.isAvailable);
    }
    if (config.rateLimitThreshold !== undefined) {
      this.mockAIService.setRateLimitThreshold(config.rateLimitThreshold);
    }
  }

  /**
   * Reset all mock services to clean state
   */
  resetMocks(): void {
    this.mockAIService.resetCounters();
    this.mockAIService.setServiceAvailability(true);
    this.mockAIService.setRateLimitThreshold(10);
  }

  /**
   * Extract endpoint name from URL
   */
  private extractEndpoint(url: string): string {
    const segments = url.split('/');
    return segments[segments.length - 1] || '';
  }

  /**
   * Get filtered tasks based on query parameters
   */
  private getFilteredTasks(searchParams: URLSearchParams): MockTaskListResponse {
    let tasks: MockTask[] = [...mockBackendResponses.tasks.list.tasks];

    // Apply filters based on search parameters
    const search = searchParams.get('search');
    const energyLevel = searchParams.get('energyLevel');
    const focusType = searchParams.get('focusType');
    const status = searchParams.get('status');

    if (search) {
      tasks = tasks.filter(
        task =>
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          task.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (energyLevel) {
      tasks = tasks.filter(task => task.metadata?.energyLevel === energyLevel);
    }

    if (focusType) {
      tasks = tasks.filter(task => task.metadata?.focusType === focusType);
    }

    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }

    return {
      tasks,
      total: tasks.length,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };
  }
}

/**
 * Mock Service Factory for creating configured mock services
 */
export class MockServiceFactory {
  /**
   * Create AI service with error simulation
   */
  static createAIServiceWithErrors(): MockAIService {
    const service = new MockAIService();
    service.setRateLimitThreshold(3); // Lower threshold for testing
    return service;
  }

  /**
   * Create AI service with service downtime
   */
  static createDownAIService(): MockAIService {
    const service = new MockAIService();
    service.setServiceAvailability(false);
    return service;
  }

  /**
   * Create mock route builder with specific configuration
   */
  static createMockRouteBuilder(page: Page, config?: any): MockRouteBuilder {
    const builder = new MockRouteBuilder(page);

    if (config?.aiService) {
      builder.configureAIService(config.aiService);
    }

    return builder;
  }
}

/**
 * Test scenario configurations for different mock setups
 */
export const mockScenarios = {
  normal: {
    aiService: {
      isAvailable: true,
      rateLimitThreshold: 10,
    },
  },
  aiDown: {
    aiService: {
      isAvailable: false,
      rateLimitThreshold: 10,
    },
  },
  rateLimited: {
    aiService: {
      isAvailable: true,
      rateLimitThreshold: 2,
    },
  },
  slowNetwork: {
    networkDelay: 3000,
    aiService: {
      isAvailable: true,
      rateLimitThreshold: 10,
    },
  },
};
