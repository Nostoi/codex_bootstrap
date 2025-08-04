# Google Calendar Integration Testing Strategy

## Overview

This document outlines the comprehensive testing approach for Google Calendar integration with the daily planning algorithm, ensuring robust functionality across all scenarios.

## Test Structure

### 1. Unit Tests

#### Calendar Event Parsing Tests

```typescript
describe('CalendarEventParser', () => {
  describe('parseCalendarEventToTimeSlot', () => {
    test('should parse regular timed event correctly', () => {
      const mockEvent: GoogleCalendarEvent = {
        id: 'event-1',
        summary: 'Team Meeting',
        start: { dateTime: '2025-07-28T14:00:00-07:00' },
        end: { dateTime: '2025-07-28T15:00:00-07:00' },
        attendees: [{ email: 'user1@example.com' }, { email: 'user2@example.com' }],
      };

      const result = calendarParser.parseCalendarEventToTimeSlot(mockEvent);

      expect(result).toEqual({
        startTime: new Date('2025-07-28T14:00:00-07:00'),
        endTime: new Date('2025-07-28T15:00:00-07:00'),
        energyLevel: EnergyLevel.MEDIUM,
        preferredFocusTypes: [FocusType.SOCIAL],
        isAvailable: false,
      });
    });

    test('should handle all-day events', () => {
      const mockEvent: GoogleCalendarEvent = {
        id: 'event-2',
        summary: 'Company Holiday',
        start: { date: '2025-07-28' },
        end: { date: '2025-07-29' },
      };

      const result = calendarParser.parseCalendarEventToTimeSlot(mockEvent);

      expect(result.startTime.getHours()).toBe(0);
      expect(result.endTime.getHours()).toBe(23);
      expect(result.energyLevel).toBe(EnergyLevel.LOW);
    });

    test('should handle events with no attendees', () => {
      const mockEvent: GoogleCalendarEvent = {
        id: 'event-3',
        summary: 'Focus Time',
        start: { dateTime: '2025-07-28T10:00:00-07:00' },
        end: { dateTime: '2025-07-28T12:00:00-07:00' },
      };

      const result = calendarParser.parseCalendarEventToTimeSlot(mockEvent);

      expect(result.energyLevel).toBe(EnergyLevel.HIGH);
      expect(result.preferredFocusTypes).toContain(FocusType.TECHNICAL);
    });
  });

  describe('inferEnergyLevel', () => {
    test.each([
      ['Focus Time', [], EnergyLevel.HIGH],
      ['Deep Work Session', [], EnergyLevel.HIGH],
      ['Large Team Meeting', new Array(10).fill({ email: 'user@example.com' }), EnergyLevel.LOW],
      ['1:1 with Manager', [{ email: 'manager@example.com' }], EnergyLevel.MEDIUM],
      ['All Hands Meeting', new Array(50).fill({ email: 'user@example.com' }), EnergyLevel.LOW],
    ])('should infer %s as %s energy', (summary, attendees, expectedEnergy) => {
      const event: GoogleCalendarEvent = { summary, attendees };

      const result = calendarParser.inferEnergyLevel(event);

      expect(result).toBe(expectedEnergy);
    });
  });

  describe('inferPreferredFocusTypes', () => {
    test.each([
      ['Standup Meeting', [FocusType.SOCIAL]],
      ['Technical Review', [FocusType.TECHNICAL]],
      ['Creative Brainstorming', [FocusType.CREATIVE]],
      ['Admin: Expense Reports', [FocusType.ADMINISTRATIVE]],
      ['Workshop: Design Thinking', [FocusType.CREATIVE]],
      ['Code Review Session', [FocusType.TECHNICAL]],
    ])('should infer "%s" as %j focus types', (summary, expectedTypes) => {
      const event: GoogleCalendarEvent = { summary };

      const result = calendarParser.inferPreferredFocusTypes(event);

      expect(result).toEqual(expectedTypes);
    });
  });
});
```

#### Error Handling Tests

```typescript
describe('CalendarErrorHandler', () => {
  test('should handle API unavailable error', async () => {
    const error: CalendarError = {
      name: 'CalendarError',
      message: 'Service unavailable',
      type: CalendarErrorType.API_UNAVAILABLE,
      retryable: false,
    };

    const result = await errorHandler.handleError(error);

    expect(result).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Calendar API unavailable'));
  });

  test('should retry on rate limit error', async () => {
    const error: CalendarError = {
      name: 'CalendarError',
      message: 'Rate limit exceeded',
      type: CalendarErrorType.RATE_LIMITED,
      retryable: true,
      retryAfter: 60,
    };

    const shouldRetry = errorHandler.shouldRetry(error);
    const delay = errorHandler.getRetryDelay(1);

    expect(shouldRetry).toBe(true);
    expect(delay).toBeGreaterThan(1000);
  });

  test('should not retry on auth expired error after max attempts', async () => {
    const error: CalendarError = {
      name: 'CalendarError',
      message: 'Token expired',
      type: CalendarErrorType.AUTH_EXPIRED,
      retryable: true,
    };

    // Simulate max retries exceeded
    for (let i = 0; i < 3; i++) {
      errorHandler.recordFailedAttempt();
    }

    const shouldRetry = errorHandler.shouldRetry(error);
    expect(shouldRetry).toBe(false);
  });
});
```

### 2. Integration Tests

#### End-to-End Calendar Integration

```typescript
describe('DailyPlannerService Calendar Integration', () => {
  let dailyPlanner: DailyPlannerService;
  let mockGoogleService: jest.Mocked<GoogleService>;

  beforeEach(() => {
    mockGoogleService = createMockGoogleService();
    dailyPlanner = new DailyPlannerService(mockPrismaService, mockTasksService, mockGoogleService);
  });

  test('should generate plan with calendar events blocking time slots', async () => {
    // Setup mock calendar events
    mockGoogleService.getCalendarEvents.mockResolvedValue({
      kind: 'calendar#events',
      items: [
        {
          id: 'event-1',
          summary: 'Team Meeting',
          start: { dateTime: '2025-07-28T14:00:00-07:00' },
          end: { dateTime: '2025-07-28T15:00:00-07:00' },
        },
      ],
    });

    // Setup mock tasks
    mockTasksService.findAll.mockResolvedValue([
      createMockTask({
        id: 'task-1',
        title: 'Complete feature',
        estimatedMinutes: 120,
        energyLevel: EnergyLevel.HIGH,
      }),
    ]);

    const userId = 'test-user';
    const date = new Date('2025-07-28');

    const plan = await dailyPlanner.generatePlan(userId, date);

    // Verify calendar event was fetched
    expect(mockGoogleService.getCalendarEvents).toHaveBeenCalledWith(
      userId,
      'primary',
      expect.any(Date),
      expect.any(Date)
    );

    // Verify task was not scheduled during meeting time
    const conflictingBlocks = plan.scheduleBlocks.filter(
      block =>
        block.startTime < new Date('2025-07-28T15:00:00-07:00') &&
        block.endTime > new Date('2025-07-28T14:00:00-07:00')
    );

    expect(conflictingBlocks).toHaveLength(0);
  });

  test('should handle calendar API failure gracefully', async () => {
    mockGoogleService.getCalendarEvents.mockRejectedValue(new Error('Network timeout'));

    const userId = 'test-user';
    const date = new Date('2025-07-28');

    const plan = await dailyPlanner.generatePlan(userId, date);

    // Plan should still be generated without calendar data
    expect(plan).toBeDefined();
    expect(plan.scheduleBlocks).toBeDefined();

    // Warning should be logged
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Calendar integration failed')
    );
  });

  test('should respect meeting buffers in scheduling', async () => {
    mockGoogleService.getCalendarEvents.mockResolvedValue({
      kind: 'calendar#events',
      items: [
        {
          id: 'event-1',
          summary: 'Important Meeting',
          start: { dateTime: '2025-07-28T14:00:00-07:00' },
          end: { dateTime: '2025-07-28T15:00:00-07:00' },
        },
      ],
    });

    const plan = await dailyPlanner.generatePlan('test-user', new Date('2025-07-28'));

    // Verify no tasks scheduled 10 minutes before or after meeting
    const bufferViolations = plan.scheduleBlocks.filter(block => {
      const meetingStart = new Date('2025-07-28T14:00:00-07:00');
      const meetingEnd = new Date('2025-07-28T15:00:00-07:00');
      const bufferBefore = new Date(meetingStart.getTime() - 10 * 60 * 1000);
      const bufferAfter = new Date(meetingEnd.getTime() + 10 * 60 * 1000);

      return (
        (block.startTime >= bufferBefore && block.startTime < meetingEnd) ||
        (block.endTime > meetingStart && block.endTime <= bufferAfter)
      );
    });

    expect(bufferViolations).toHaveLength(0);
  });
});
```

### 3. Performance Tests

#### Load Testing

```typescript
describe('Calendar Integration Performance', () => {
  test('should handle large calendar datasets efficiently', async () => {
    const largeEventSet = MockCalendarDataFactory.createEvents(200);

    mockGoogleService.getCalendarEvents.mockResolvedValue({
      kind: 'calendar#events',
      items: largeEventSet,
    });

    const startTime = performance.now();

    const plan = await dailyPlanner.generatePlan('test-user', new Date());

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    expect(plan.scheduleBlocks).toBeDefined();
  });

  test('should maintain performance with concurrent requests', async () => {
    const concurrentRequests = 10;
    const requests = Array(concurrentRequests)
      .fill(null)
      .map(() => dailyPlanner.generatePlan(`user-${Math.random()}`, new Date()));

    const startTime = performance.now();
    const results = await Promise.all(requests);
    const endTime = performance.now();

    const averageTime = (endTime - startTime) / concurrentRequests;

    expect(results).toHaveLength(concurrentRequests);
    expect(averageTime).toBeLessThan(3000); // Average under 3 seconds
    expect(results.every(plan => plan !== null)).toBe(true);
  });
});
```

#### Cache Performance Tests

```typescript
describe('Calendar Cache Performance', () => {
  test('should improve performance on repeated requests', async () => {
    const userId = 'test-user';
    const date = new Date('2025-07-28');

    // First request (cache miss)
    const start1 = performance.now();
    await dailyPlanner.generatePlan(userId, date);
    const duration1 = performance.now() - start1;

    // Second request (cache hit)
    const start2 = performance.now();
    await dailyPlanner.generatePlan(userId, date);
    const duration2 = performance.now() - start2;

    expect(duration2).toBeLessThan(duration1 * 0.5); // 50% faster with cache
  });

  test('should handle cache eviction properly', async () => {
    const cacheManager = new CalendarCacheManager();
    const userId = 'test-user';
    const date = new Date('2025-07-28');

    // Fill cache
    cacheManager.set(userId, date, []);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock expiration
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 20 * 60 * 1000);

    const cached = cacheManager.get(userId, date);
    expect(cached).toBeNull();
  });
});
```

### 4. Error Scenario Tests

#### API Failure Scenarios

```typescript
describe('Calendar API Failure Scenarios', () => {
  test.each([
    ['Network timeout', { code: 'ENOTFOUND' }],
    ['Rate limit exceeded', { code: 429 }],
    ['Service unavailable', { code: 503 }],
    ['Authentication failed', { code: 401 }],
    ['Forbidden access', { code: 403 }],
  ])('should handle %s gracefully', async (scenario, error) => {
    mockGoogleService.getCalendarEvents.mockRejectedValue(error);

    await expect(dailyPlanner.generatePlan('test-user', new Date())).resolves.toBeDefined();

    expect(logger.warn).toHaveBeenCalled();
  });

  test('should retry transient failures', async () => {
    let callCount = 0;
    mockGoogleService.getCalendarEvents.mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        throw { code: 503, message: 'Service temporarily unavailable' };
      }
      return Promise.resolve({ kind: 'calendar#events', items: [] });
    });

    await dailyPlanner.generatePlan('test-user', new Date());

    expect(callCount).toBe(3);
  });
});
```

### 5. Edge Case Tests

#### Calendar Data Edge Cases

```typescript
describe('Calendar Data Edge Cases', () => {
  test('should handle malformed calendar events', async () => {
    mockGoogleService.getCalendarEvents.mockResolvedValue({
      kind: 'calendar#events',
      items: [
        { id: 'event-1' }, // Missing required fields
        {
          id: 'event-2',
          summary: 'Valid Event',
          start: { dateTime: 'invalid-date' }, // Invalid date
        },
        {
          id: 'event-3',
          summary: 'Another Valid Event',
          start: { dateTime: '2025-07-28T14:00:00-07:00' },
          end: { dateTime: '2025-07-28T13:00:00-07:00' }, // End before start
        },
      ],
    });

    const plan = await dailyPlanner.generatePlan('test-user', new Date('2025-07-28'));

    // Should filter out invalid events and continue
    expect(plan).toBeDefined();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid calendar event'));
  });

  test('should handle timezone mismatches', async () => {
    mockGoogleService.getCalendarEvents.mockResolvedValue({
      kind: 'calendar#events',
      items: [
        {
          id: 'event-1',
          summary: 'Cross-timezone Meeting',
          start: {
            dateTime: '2025-07-28T14:00:00+00:00', // UTC
            timeZone: 'UTC',
          },
          end: {
            dateTime: '2025-07-28T15:00:00+00:00', // UTC
            timeZone: 'UTC',
          },
        },
      ],
    });

    // User in Pacific timezone
    const userSettings = createMockUserSettings({
      timezone: 'America/Los_Angeles',
    });

    const plan = await dailyPlanner.generatePlan('test-user', new Date('2025-07-28'));

    expect(plan.scheduleBlocks).toBeDefined();
    // Verify proper timezone conversion occurred
  });

  test('should handle empty calendar response', async () => {
    mockGoogleService.getCalendarEvents.mockResolvedValue({
      kind: 'calendar#events',
      items: [],
    });

    const plan = await dailyPlanner.generatePlan('test-user', new Date('2025-07-28'));

    expect(plan).toBeDefined();
    expect(plan.scheduleBlocks.length).toBeGreaterThan(0); // Should still have task blocks
  });
});
```

### 6. Mock Helpers and Utilities

```typescript
// Test utilities for consistent mocking
export class CalendarTestUtils {
  static createMockGoogleService(): jest.Mocked<GoogleService> {
    return {
      getCalendarEvents: jest.fn(),
      createCalendarEvent: jest.fn(),
      getDriveFiles: jest.fn(),
      createDriveFile: jest.fn(),
      getSheetData: jest.fn(),
      createSheet: jest.fn(),
      saveIntegrationConfig: jest.fn(),
    } as jest.Mocked<GoogleService>;
  }

  static createMockCalendarEvent(
    overrides: Partial<GoogleCalendarEvent> = {}
  ): GoogleCalendarEvent {
    return {
      id: 'mock-event-id',
      summary: 'Mock Event',
      start: { dateTime: '2025-07-28T14:00:00-07:00' },
      end: { dateTime: '2025-07-28T15:00:00-07:00' },
      attendees: [{ email: 'attendee@example.com' }],
      ...overrides,
    };
  }

  static createMockTimeSlot(overrides: Partial<TimeSlot> = {}): TimeSlot {
    return {
      startTime: new Date('2025-07-28T14:00:00-07:00'),
      endTime: new Date('2025-07-28T15:00:00-07:00'),
      energyLevel: EnergyLevel.MEDIUM,
      preferredFocusTypes: [FocusType.SOCIAL],
      isAvailable: false,
      ...overrides,
    };
  }

  static setupBasicMocks(googleService: jest.Mocked<GoogleService>): void {
    googleService.getCalendarEvents.mockResolvedValue({
      kind: 'calendar#events',
      items: [],
    });
  }
}

// Custom Jest matchers for calendar testing
expect.extend({
  toBeWithinTimeRange(received: Date, start: Date, end: Date) {
    const pass = received >= start && received <= end;

    return {
      message: () =>
        `expected ${received.toISOString()} ${pass ? 'not ' : ''}to be within ${start.toISOString()} and ${end.toISOString()}`,
      pass,
    };
  },

  toHaveNoTimeConflicts(received: ScheduleBlock[], calendarEvents: TimeSlot[]) {
    const conflicts = received.filter(block =>
      calendarEvents.some(
        event => block.startTime < event.endTime && event.startTime < block.endTime
      )
    );

    return {
      message: () =>
        `expected schedule blocks to have no conflicts with calendar events, but found ${conflicts.length} conflicts`,
      pass: conflicts.length === 0,
    };
  },
});
```

## Test Execution Strategy

### 1. Test Pyramid

```
        /\
       /  \
      / E2E \     ← Few, comprehensive integration tests
     /______\
    /        \
   / Integration \  ← Moderate, service integration tests
  /______________\
 /                \
/ Unit Tests       \  ← Many, fast, isolated tests
/____________________\
```

### 2. Continuous Integration

```yaml
# .github/workflows/calendar-integration-tests.yml
name: Calendar Integration Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:unit:calendar

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:integration:calendar
        env:
          GOOGLE_CALENDAR_TEST_CREDENTIALS: ${{ secrets.GOOGLE_TEST_CREDENTIALS }}

  performance-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:performance:calendar
```

### 3. Test Data Management

```typescript
// Centralized test data management
class CalendarTestDataManager {
  private static readonly TEST_DATES = {
    NORMAL_WORKDAY: new Date('2025-07-28'),
    WEEKEND: new Date('2025-07-26'),
    HOLIDAY: new Date('2025-12-25'),
    HIGH_VOLUME_DAY: new Date('2025-07-29'),
  };

  static getTestScenarios(): CalendarTestScenario[] {
    return [
      {
        name: 'Normal Work Day',
        description: 'Typical day with 3-4 meetings',
        mockEvents: MockCalendarDataFactory.createStandardWorkDay(),
        expectedTimeSlots: 3,
        expectedEnergyLevels: [EnergyLevel.MEDIUM, EnergyLevel.HIGH, EnergyLevel.MEDIUM],
        expectedFocusTypes: [[FocusType.SOCIAL], [FocusType.TECHNICAL], [FocusType.SOCIAL]],
      },
      {
        name: 'Meeting-Heavy Day',
        description: 'Back-to-back meetings all day',
        mockEvents: MockCalendarDataFactory.createHighVolumeDay(),
        expectedTimeSlots: 8,
        expectedEnergyLevels: Array(8).fill(EnergyLevel.LOW),
        expectedFocusTypes: Array(8).fill([FocusType.SOCIAL]),
      },
    ];
  }
}
```

This comprehensive testing strategy ensures robust calendar integration that handles real-world scenarios, edge cases, and performance requirements while maintaining high code quality and reliability.
