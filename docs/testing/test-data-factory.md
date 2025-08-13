# Test Data Factory System

The Helmsman project includes a comprehensive test data factory system designed to provide consistent, ADHD-optimized test data across all testing scenarios.

## Overview

**Location**: `backend/test/`
**Purpose**: Centralized test data generation with realistic ADHD-focused scenarios
**Implementation**: Complete 8-step factory system with factories, mocks, and utilities

## Architecture

```
backend/test/
├── factories/              # Data factories for consistent test data
│   ├── task.factory.ts     # Task creation with ADHD metadata
│   ├── user.factory.ts     # User profiles and preferences
│   ├── project.factory.ts  # Project organization
│   └── calendar.factory.ts # Calendar events and sync data
├── mocks/                  # Service mocks and stubs
│   ├── ai-service.mock.ts  # OpenAI service mocking
│   ├── graph.mock.ts       # Microsoft Graph API mocks
│   └── google.mock.ts      # Google Calendar API mocks
├── utils/                  # Testing utilities
│   ├── database.utils.ts   # Database setup and teardown
│   ├── auth.utils.ts       # Authentication helpers
│   └── assertions.utils.ts # Custom test assertions
└── README.md              # Detailed implementation guide
```

## Key Features

### ADHD-Optimized Test Data

The factory system generates realistic test data specifically designed for ADHD users:

```typescript
// Task factory with energy levels and focus types
const adhdTask = TaskFactory.create({
  energyLevel: 'HIGH', // Peak focus required
  focusType: 'TECHNICAL', // Coding/debugging work
  estimatedMinutes: 25, // Pomodoro-friendly duration
  complexity: 7, // 1-10 complexity scale
  adhdMetadata: {
    timeOfDay: 'MORNING', // Optimal timing
    breakRequired: true, // Break recommendation
    distractionLevel: 'LOW', // Environment requirements
  },
});
```

### Service Mocking

Comprehensive mocking for external services:

```typescript
// Microsoft Graph API mocking
export const mockGraphService = {
  getCalendarEvents: jest.fn().mockResolvedValue([
    CalendarEventFactory.outlook({
      conflictResolution: 'AUTOMATIC',
      syncStatus: 'SYNCHRONIZED',
    }),
  ]),
  syncEmails: jest.fn().mockResolvedValue([]),
  storeEmailContext: jest.fn().mockResolvedValue(undefined),
};

// AI service mocking for consistent responses
export const mockAiService = {
  extractTasks: jest.fn().mockResolvedValue([
    TaskFactory.createFromAI({
      source: 'AI_EXTRACTED',
      confidence: 0.95,
      extractionMetadata: {
        /* ... */
      },
    }),
  ]),
};
```

### Database Utilities

Streamlined database operations for tests:

```typescript
// Database setup and teardown
export class TestDatabaseUtils {
  static async setupTestDb(): Promise<void> {
    // Clean database state
    // Apply test-specific migrations
    // Seed minimal required data
  }

  static async cleanupTestDb(): Promise<void> {
    // Remove test data
    // Reset sequences
    // Clear caches
  }

  static async createTestUser(): Promise<User> {
    return UserFactory.create({
      adhdProfile: {
        energyPattern: 'MORNING_PERSON',
        focusPreferences: ['TECHNICAL', 'CREATIVE'],
        breakFrequency: 25, // minutes
      },
    });
  }
}
```

## Usage Examples

### Unit Testing

```typescript
describe('TaskService', () => {
  let taskService: TaskService;
  let testUser: User;

  beforeEach(async () => {
    await TestDatabaseUtils.setupTestDb();
    testUser = await TestDatabaseUtils.createTestUser();
  });

  afterEach(async () => {
    await TestDatabaseUtils.cleanupTestDb();
  });

  it('should create ADHD-optimized task', async () => {
    // Arrange
    const taskData = TaskFactory.adhd({
      energyLevel: 'HIGH',
      focusType: 'TECHNICAL',
      userId: testUser.id,
    });

    // Act
    const task = await taskService.create(taskData);

    // Assert
    expect(task).toMatchADHDPattern({
      hasEnergyLevel: true,
      hasFocusType: true,
      hasEstimatedDuration: true,
    });
  });
});
```

### Integration Testing

```typescript
describe('Microsoft Graph Integration', () => {
  beforeEach(() => {
    // Setup Graph service mocks
    jest.clearAllMocks();
    mockGraphService.setup();
  });

  it('should sync calendar events with conflict resolution', async () => {
    // Arrange
    const calendarEvents = CalendarEventFactory.createBatch(5, {
      source: 'MICROSOFT_GRAPH',
      hasConflicts: true,
    });

    mockGraphService.getCalendarEvents.mockResolvedValue(calendarEvents);

    // Act
    const result = await graphSyncService.syncCalendar(testUser.id);

    // Assert
    expect(result.conflictsResolved).toBeGreaterThan(0);
    expect(result.syncStatus).toBe('SUCCESS');
  });
});
```

### E2E Testing

```typescript
describe('Dashboard E2E', () => {
  beforeEach(async () => {
    // Setup comprehensive test scenario
    await TestDatabaseUtils.setupTestDb();

    const user = await UserFactory.createWithADHDProfile();
    const tasks = await TaskFactory.createADHDBatch(10, {
      userId: user.id,
      energyDistribution: 'REALISTIC', // Mix of energy levels
      timeDistribution: 'DAILY', // Spread across day
    });

    await CalendarEventFactory.createSyncedEvents(tasks);
  });

  it('should display ADHD-optimized task dashboard', async () => {
    // Test implementation using realistic data
  });
});
```

## Factory Types

### Task Factory

- **Basic Tasks**: Standard task creation
- **ADHD Tasks**: Enhanced with energy/focus metadata
- **AI-Extracted Tasks**: Simulated AI extraction results
- **Batch Creation**: Multiple related tasks
- **Template-Based**: Common task patterns

### User Factory

- **ADHD Profiles**: Realistic user preferences and patterns
- **Authentication**: OAuth and session data
- **Preferences**: Customized settings and configurations
- **Energy Patterns**: Morning/evening person profiles

### Calendar Factory

- **Microsoft Graph Events**: Outlook calendar integration
- **Google Calendar Events**: Google Calendar integration
- **Conflict Scenarios**: Overlapping events and resolutions
- **Sync States**: Various synchronization statuses

### Project Factory

- **ADHD Projects**: Project structures optimized for ADHD workflows
- **Collaboration**: Multi-user project scenarios
- **Task Hierarchies**: Parent-child task relationships

## Best Practices

### Test Data Consistency

1. **Use Factories**: Always use factories instead of manual object creation
2. **Realistic Data**: Generate data that reflects actual ADHD user patterns
3. **Isolation**: Each test should use fresh, isolated data
4. **Cleanup**: Always clean up test data to prevent interference

### Performance Optimization

1. **Batch Operations**: Use batch creation for multiple objects
2. **Selective Cleanup**: Clean only necessary data between tests
3. **Mock External Services**: Use mocks for API calls and external dependencies
4. **Database Transactions**: Use transactions for test isolation

### ADHD-Specific Testing

1. **Energy Patterns**: Test across different energy levels and times
2. **Focus Types**: Validate behavior across all focus type scenarios
3. **Accessibility**: Ensure generated data supports accessibility testing
4. **Performance**: Test with realistic data volumes that ADHD users might accumulate

## Integration with Testing Tools

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testEnvironment: 'node',
  moduleNameMapping: {
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
};
```

### Playwright Integration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'http://localhost:3500',
    extraHTTPHeaders: {
      'X-Test-Data-Factory': 'enabled',
    },
  },
  globalSetup: './test/global-setup.ts', // Setup test data factory
});
```

## Maintenance and Updates

### Adding New Factories

1. Create factory file in `backend/test/factories/`
2. Implement factory interface with realistic data generation
3. Add corresponding mock services if needed
4. Update test utilities for new data types
5. Document usage patterns and examples

### Updating Existing Factories

1. Maintain backward compatibility for existing tests
2. Add new properties with sensible defaults
3. Update related mocks and utilities
4. Validate against real-world ADHD usage patterns

For implementation details and complete API reference, see [`backend/test/README.md`](../../backend/test/README.md).

For integration testing strategies, see [Test Implementation Plan](test-implementation-plan.md).
