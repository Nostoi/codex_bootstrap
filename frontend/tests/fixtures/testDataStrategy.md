# Test Data & Mock Strategy for Helmsman E2E Tests

## Overview

This document outlines the comprehensive test data management and mocking strategy for the Helmsman AI-Augmented Task Management system's E2E test suite.

## Test Data Categories

### 1. Core Task Data

- **Basic Tasks**: Simple tasks with minimal metadata for baseline testing
- **ADHD-Optimized Tasks**: Tasks with energy levels, focus types, and complexity scores
- **Dependency Tasks**: Tasks with complex dependency chains for workflow testing
- **Large Dataset Tasks**: 100+ tasks for performance and virtualization testing

### 2. User & Project Data

- **Test Users**: Various user profiles with different permissions and preferences
- **Project Hierarchies**: Multi-level projects with task organization
- **Collaboration Scenarios**: Multi-user project sharing and task delegation

### 3. Calendar Integration Data

- **Google Calendar Events**: Mock calendar events for integration testing
- **Outlook Calendar Events**: Microsoft Graph calendar data
- **Conflict Scenarios**: Overlapping events and time slot conflicts
- **Time Zone Variations**: Cross-timezone calendar data

### 4. AI Service Data

- **Task Extraction Scenarios**: Email content with expected task extraction results
- **Classification Data**: Task titles/descriptions with expected AI classifications
- **Suggestion Data**: Context scenarios with expected AI recommendations
- **Error Scenarios**: Malformed inputs and API failure conditions

## Mock Strategy

### 1. AI Service Mocking

#### OpenAI API Mocking

```typescript
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
                    description: 'Analyze Q4 performance data',
                    energyLevel: 'MEDIUM',
                    focusType: 'ANALYTICAL',
                    priority: 7,
                    estimatedDuration: 90,
                  },
                ],
              }),
            },
          },
        },
      ],
    },
    rateLimited: {
      error: {
        type: 'rate_limit_exceeded',
        message: 'Rate limit exceeded',
      },
    },
    timeout: {
      error: {
        type: 'timeout',
        message: 'Request timeout',
      },
    },
  },
};
```

#### AI Service Mock Implementation

- **Response Patterns**: Consistent mock responses for different AI operations
- **Error Simulation**: Rate limiting, timeouts, and service unavailability
- **Performance Simulation**: Realistic response times for AI operations
- **Context Preservation**: Maintaining conversation context in mock responses

### 2. Calendar Integration Mocking

#### Google Calendar API

```typescript
export const mockGoogleCalendarEvents = [
  {
    id: 'google-event-1',
    summary: 'Team Meeting',
    start: { dateTime: '2025-01-15T10:00:00Z' },
    end: { dateTime: '2025-01-15T11:00:00Z' },
    source: 'google',
  },
];
```

#### Microsoft Graph API

```typescript
export const mockOutlookCalendarEvents = [
  {
    id: 'outlook-event-1',
    subject: 'Project Review',
    start: { dateTime: '2025-01-15T14:00:00Z' },
    end: { dateTime: '2025-01-15T15:00:00Z' },
    source: 'outlook',
  },
];
```

### 3. Backend API Mocking

#### Task Management APIs

- **CRUD Operations**: Mock responses for task creation, reading, updating, deletion
- **Bulk Operations**: Batch task operations for performance testing
- **Search & Filtering**: Mock filtered results for various query combinations
- **Real-time Updates**: WebSocket mock responses for live updates

#### Daily Planning APIs

```typescript
export const mockDailyPlanResponses = {
  generatePlan: {
    success: {
      timeSlots: [
        {
          startTime: '09:00',
          endTime: '10:30',
          taskId: 'task-1',
          energyLevel: 'HIGH',
          focusType: 'CREATIVE',
        },
      ],
      conflicts: [],
      optimizationScore: 85,
    },
  },
};
```

## Data Setup & Teardown Patterns

### 1. Test Data Lifecycle

#### Setup Phase

```typescript
export async function setupTestData(page: Page, scenario: TestScenario) {
  // 1. Clear existing data
  await clearTestData(page);

  // 2. Load scenario-specific data
  const testData = getTestDataForScenario(scenario);

  // 3. Mock external services
  await setupMockRoutes(page, testData.mocks);

  // 4. Seed database with test data
  await seedTestDatabase(testData.fixtures);

  // 5. Configure user state
  await setupUserSession(page, testData.user);
}
```

#### Teardown Phase

```typescript
export async function cleanupTestData(page: Page) {
  // 1. Clear local storage
  await page.evaluate(() => localStorage.clear());

  // 2. Clear session storage
  await page.evaluate(() => sessionStorage.clear());

  // 3. Remove test database records
  await clearTestDatabase();

  // 4. Reset mock counters
  resetMockCounters();
}
```

### 2. Data Isolation Strategies

#### Database Isolation

- **Unique Test Prefixes**: All test data uses `test_` prefixes for easy identification
- **Sandbox Database**: Separate test database instance for E2E tests
- **Transaction Rollback**: Automatic rollback of test transactions

#### Mock Service Isolation

- **Request Isolation**: Each test gets fresh mock service instances
- **State Reset**: Mock service state cleared between tests
- **Concurrent Safety**: Thread-safe mock implementations

## Reusable Test Utilities

### 1. Data Factories

#### Task Factory

```typescript
export class TaskFactory {
  static createBasicTask(overrides: Partial<Task> = {}): Task {
    return {
      id: generateTestId('task'),
      title: 'Test Task',
      status: 'pending',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  }

  static createADHDTask(energyLevel: EnergyLevel, focusType: FocusType): Task {
    return this.createBasicTask({
      metadata: {
        energyLevel,
        focusType,
        complexity: Math.floor(Math.random() * 10) + 1,
        estimatedDuration: Math.floor(Math.random() * 120) + 30,
      },
    });
  }

  static createLargeDataset(count: number): Task[] {
    return Array.from({ length: count }, (_, i) =>
      this.createBasicTask({ title: `Test Task ${i + 1}` })
    );
  }
}
```

#### User Factory

```typescript
export class UserFactory {
  static createTestUser(overrides: Partial<User> = {}): User {
    return {
      id: generateTestId('user'),
      email: 'test@example.com',
      name: 'Test User',
      preferences: {
        theme: 'corporate',
        energyPattern: 'morning-person',
        defaultView: 'grid',
      },
      ...overrides,
    };
  }
}
```

### 2. Mock Service Utilities

#### Mock Route Builder

```typescript
export class MockRouteBuilder {
  constructor(private page: Page) {}

  async mockTaskAPI() {
    await this.page.route('**/api/tasks**', async route => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(getTaskMockData(url)),
        });
      }
      // Handle other methods...
    });
  }

  async mockAIAPI() {
    await this.page.route('**/api/ai/**', async route => {
      const endpoint = this.extractEndpoint(route.request().url());
      const response = getAIMockResponse(endpoint);

      // Simulate realistic AI response times
      await new Promise(resolve => setTimeout(resolve, 800));

      await route.fulfill({
        status: response.status,
        contentType: 'application/json',
        body: JSON.stringify(response.data),
      });
    });
  }
}
```

### 3. Test State Management

#### Test Context

```typescript
export class TestContext {
  private static instance: TestContext;
  private testData: Map<string, any> = new Map();
  private mockCounters: Map<string, number> = new Map();

  static getInstance(): TestContext {
    if (!this.instance) {
      this.instance = new TestContext();
    }
    return this.instance;
  }

  setTestData(key: string, data: any): void {
    this.testData.set(key, data);
  }

  getTestData(key: string): any {
    return this.testData.get(key);
  }

  incrementMockCounter(endpoint: string): number {
    const current = this.mockCounters.get(endpoint) || 0;
    const newCount = current + 1;
    this.mockCounters.set(endpoint, newCount);
    return newCount;
  }

  reset(): void {
    this.testData.clear();
    this.mockCounters.clear();
  }
}
```

## Performance Testing Data

### 1. Large Dataset Generation

- **1000+ Tasks**: Performance testing for dashboard virtualization
- **Complex Dependencies**: Multi-level task dependency trees
- **Calendar Integration**: 100+ calendar events for sync testing
- **Real-time Updates**: High-frequency WebSocket message simulation

### 2. ADHD-Specific Test Scenarios

- **Energy Level Distribution**: Balanced mix of HIGH/MEDIUM/LOW energy tasks
- **Focus Type Variety**: All four focus types (Creative, Technical, Administrative, Social)
- **Cognitive Load Testing**: Maximum information density without overwhelming interface
- **Interaction Timing**: 300ms delays and reduced motion preference testing

## Error Scenario Coverage

### 1. Network Conditions

- **Slow Connections**: Simulated slow network for loading state testing
- **Intermittent Connectivity**: Connection drops and recovery testing
- **Offline Mode**: Service worker cache and offline functionality

### 2. Service Failures

- **AI Service Downtime**: OpenAI API unavailability scenarios
- **Calendar Sync Failures**: Google/Outlook API errors
- **Database Connection Issues**: Backend service degradation
- **Authentication Failures**: OAuth token expiration and refresh

## Implementation Guidelines

### 1. File Organization

```
frontend/tests/
├── fixtures/
│   ├── data/
│   │   ├── tasks.ts           # Task test data
│   │   ├── users.ts           # User test data
│   │   ├── calendar.ts        # Calendar event data
│   │   └── ai-responses.ts    # AI mock responses
│   ├── mocks/
│   │   ├── ai-service.ts      # AI service mocks
│   │   ├── calendar-api.ts    # Calendar API mocks
│   │   └── backend-api.ts     # Backend API mocks
│   ├── factories/
│   │   ├── task-factory.ts    # Task data factory
│   │   ├── user-factory.ts    # User data factory
│   │   └── calendar-factory.ts # Calendar data factory
│   └── utils/
│       ├── test-context.ts    # Test state management
│       ├── mock-builder.ts    # Mock route utilities
│       └── data-setup.ts      # Setup/teardown utilities
```

### 2. Naming Conventions

- **Test Data**: `mock{EntityName}` (e.g., `mockTasks`, `mockUsers`)
- **Factories**: `{EntityName}Factory` (e.g., `TaskFactory`, `UserFactory`)
- **Mock Services**: `mock{ServiceName}` (e.g., `mockAIService`, `mockGoogleAPI`)
- **Test IDs**: `test_{entity}_{uuid}` (e.g., `test_task_abc123`)

### 3. Data Consistency Rules

- **Timestamps**: All test data uses consistent timezone (UTC)
- **IDs**: Predictable test IDs for reliable test assertions
- **Relationships**: Proper foreign key relationships in test data
- **Validation**: Test data passes same validation as production data

## Quality Assurance

### 1. Mock Fidelity

- **API Compatibility**: Mocks match real API response schemas exactly
- **Error Conditions**: Mock error responses match real service errors
- **Performance Characteristics**: Mock response times simulate real services
- **State Consistency**: Mock state changes reflect real service behavior

### 2. Test Data Maintenance

- **Schema Evolution**: Test data updates with schema changes
- **Data Freshness**: Regular updates to reflect current feature set
- **Coverage Tracking**: Ensure all data scenarios have test coverage
- **Documentation**: Clear documentation for all test data scenarios

This comprehensive test data and mock strategy ensures reliable, maintainable, and comprehensive E2E testing for the Helmsman system.
