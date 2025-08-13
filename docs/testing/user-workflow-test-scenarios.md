# User Workflow Test Scenarios - Helmsman System

## Overview

This document defines comprehensive test scenarios for all major user workflows in the Helmsman AI-Augmented Task Management system, with specific focus on ADHD-optimized features and accessibility compliance.

## Critical User Journey Test Scenarios

### Workflow 1: New User Onboarding Journey

#### Scenario 1.1: First-Time User Setup

```typescript
describe('New User Onboarding', () => {
  test('Complete first-time user setup flow', async ({ page }) => {
    // 1. Landing page access
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Helmsman' })).toBeVisible();

    // 2. Authentication selection
    await page.getByRole('button', { name: 'Sign in with Google' }).click();
    // Mock OAuth flow for testing
    await expect(page.url()).toContain('oauth/google');

    // 3. Calendar permission setup
    await page.getByRole('button', { name: 'Grant Calendar Access' }).click();
    await expect(page.getByText('Calendar permissions granted')).toBeVisible();

    // 4. ADHD preference configuration
    await page.getByRole('button', { name: 'Configure ADHD Settings' }).click();
    await page.selectOption('select[name="energyPattern"]', 'morning-person');
    await page.fill('input[name="focusSessionLength"]', '25');
    await page.getByRole('button', { name: 'Save Preferences' }).click();

    // 5. Welcome to dashboard
    await expect(page.getByRole('heading', { name: 'Helmsman Dashboard' })).toBeVisible();
    await expect(page.getByText('Your personalized task management')).toBeVisible();
  });
});
```

#### Scenario 1.2: OAuth Integration Flow

```typescript
describe('OAuth Authentication', () => {
  test('Google OAuth2 complete flow', async ({ page, context }) => {
    // Mock Google OAuth responses
    await context.route('**/auth/google/login', async route => {
      await route.fulfill({
        status: 302,
        headers: { Location: '/auth/google/callback?code=mock_auth_code' },
      });
    });

    await page.goto('/auth/login');
    await page.getByRole('button', { name: 'Continue with Google' }).click();

    // Verify callback handling
    await expect(page.url()).toContain('/dashboard');
    await expect(page.getByText('Successfully authenticated')).toBeVisible();
  });

  test('Microsoft OAuth2 complete flow', async ({ page, context }) => {
    // Similar pattern for Microsoft Graph authentication
    await context.route('**/auth/microsoft/login', async route => {
      await route.fulfill({
        status: 302,
        headers: { Location: '/auth/microsoft/callback?code=mock_auth_code' },
      });
    });

    await page.goto('/auth/login');
    await page.getByRole('button', { name: 'Continue with Microsoft' }).click();

    await expect(page.url()).toContain('/dashboard');
    await expect(page.getByText('Outlook calendar connected')).toBeVisible();
  });
});
```

### Workflow 2: AI-Powered Task Management

#### Scenario 2.1: AI Task Extraction

```typescript
describe('AI Task Extraction Workflow', () => {
  test('Extract tasks from natural language input', async ({ page }) => {
    await page.goto('/dashboard');

    // 1. Open AI assistant
    await page.getByRole('button', { name: 'AI Assistant' }).click();
    await expect(page.getByRole('dialog', { name: 'AI Assistant' })).toBeVisible();

    // 2. Input natural language text
    const inputText = `
      Tomorrow I need to finish the quarterly report, 
      schedule a team meeting for next week, 
      and review the budget proposals. 
      Also need to call the client about the project delay.
    `;
    await page.fill('textarea[name="aiInput"]', inputText);
    await page.getByRole('button', { name: 'Extract Tasks' }).click();

    // 3. Verify AI processing
    await expect(page.getByText('Processing with AI...')).toBeVisible();
    await expect(page.getByText('Processing with AI...')).not.toBeVisible({ timeout: 10000 });

    // 4. Review extracted tasks
    await expect(page.getByText('Found 4 tasks')).toBeVisible();
    await expect(
      page.getByRole('listitem', { name: /finish the quarterly report/i })
    ).toBeVisible();
    await expect(page.getByRole('listitem', { name: /schedule a team meeting/i })).toBeVisible();
    await expect(
      page.getByRole('listitem', { name: /review the budget proposals/i })
    ).toBeVisible();
    await expect(page.getByRole('listitem', { name: /call the client/i })).toBeVisible();

    // 5. Verify AI metadata predictions
    const firstTask = page.getByRole('listitem', { name: /quarterly report/i });
    await expect(firstTask.getByText('Energy: HIGH')).toBeVisible();
    await expect(firstTask.getByText('Focus: TECHNICAL')).toBeVisible();
    await expect(firstTask.getByText('Priority: 4')).toBeVisible();

    // 6. Accept and create tasks
    await page.getByRole('button', { name: 'Create All Tasks' }).click();
    await expect(page.getByText('4 tasks created successfully')).toBeVisible();
  });

  test('Handle AI service errors gracefully', async ({ page }) => {
    // Mock AI service failure
    await page.route('**/api/ai/extract-tasks', route => {
      route.fulfill({ status: 503, body: JSON.stringify({ error: 'Service unavailable' }) });
    });

    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'AI Assistant' }).click();
    await page.fill('textarea[name="aiInput"]', 'Create a task for testing');
    await page.getByRole('button', { name: 'Extract Tasks' }).click();

    // Verify error handling
    await expect(page.getByText('AI service temporarily unavailable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manual Task Creation' })).toBeVisible();
  });
});
```

#### Scenario 2.2: AI Suggestions and Context

```typescript
describe('AI Contextual Suggestions', () => {
  test('Provide contextual task suggestions', async ({ page }) => {
    await page.goto('/dashboard');

    // Create initial tasks for context
    await createTestTasks(page, [
      { title: 'Review code', focusType: 'TECHNICAL', energyLevel: 'HIGH' },
      { title: 'Team standup', focusType: 'SOCIAL', energyLevel: 'MEDIUM' },
    ]);

    // Open AI suggestions panel
    await page.getByRole('button', { name: 'Get AI Suggestions' }).click();

    // Verify contextual suggestions appear
    await expect(page.getByText('Based on your recent work...')).toBeVisible();
    await expect(page.getByText('Suggested next task: Continue code review')).toBeVisible();
    await expect(
      page.getByText('Energy match: Current HIGH energy optimal for technical work')
    ).toBeVisible();
  });
});
```

### Workflow 3: ADHD-Optimized Daily Planning

#### Scenario 3.1: Energy-Aware Scheduling

```typescript
describe('ADHD Daily Planning', () => {
  test('Generate energy-optimized daily schedule', async ({ page }) => {
    await page.goto('/dashboard');

    // 1. Set user energy preferences
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.selectOption('select[name="morningEnergyLevel"]', 'HIGH');
    await page.selectOption('select[name="afternoonEnergyLevel"]', 'MEDIUM');
    await page.selectOption('select[name="eveningEnergyLevel"]', 'LOW');
    await page.getByRole('button', { name: 'Save Settings' }).click();

    // 2. Create tasks with different energy requirements
    const tasks = [
      { title: 'Deep work coding', energyLevel: 'HIGH', focusType: 'TECHNICAL' },
      { title: 'Email processing', energyLevel: 'LOW', focusType: 'ADMINISTRATIVE' },
      { title: 'Team meeting', energyLevel: 'MEDIUM', focusType: 'SOCIAL' },
      { title: 'Creative brainstorm', energyLevel: 'HIGH', focusType: 'CREATIVE' },
    ];

    for (const task of tasks) {
      await createTaskWithMetadata(page, task);
    }

    // 3. Generate daily plan
    await page.getByRole('button', { name: 'Generate Daily Plan' }).click();
    await expect(page.getByText('Generating optimal schedule...')).toBeVisible();

    // 4. Verify energy-aware scheduling
    const morning9am = page.getByTestId('time-slot-09:00');
    await expect(morning9am.getByText('Deep work coding')).toBeVisible(); // HIGH energy task in morning

    const afternoon2pm = page.getByTestId('time-slot-14:00');
    await expect(afternoon2pm.getByText('Team meeting')).toBeVisible(); // MEDIUM energy task in afternoon

    const evening5pm = page.getByTestId('time-slot-17:00');
    await expect(evening5pm.getByText('Email processing')).toBeVisible(); // LOW energy task in evening

    // 5. Verify optimization metrics
    await expect(page.getByText('Energy Optimization: 95%')).toBeVisible();
    await expect(page.getByText('Focus Batching: 88%')).toBeVisible();
  });

  test('Handle calendar conflicts in daily planning', async ({ page }) => {
    // Mock calendar events
    await page.route('**/api/plans/calendar-events', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          events: [
            {
              id: 'cal-1',
              title: 'Client Meeting',
              startTime: '2024-01-15T10:00:00Z',
              endTime: '2024-01-15T11:00:00Z',
              source: 'google',
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard');
    await createTaskWithMetadata(page, {
      title: 'Important project work',
      energyLevel: 'HIGH',
    });

    await page.getByRole('button', { name: 'Generate Daily Plan' }).click();

    // Verify conflict detection
    const conflictSlot = page.getByTestId('time-slot-10:00');
    await expect(conflictSlot.getByText('Client Meeting')).toBeVisible();
    await expect(conflictSlot.getByRole('img', { name: 'Calendar conflict' })).toBeVisible();

    // Verify task rescheduled around conflict
    const nextSlot = page.getByTestId('time-slot-11:00');
    await expect(nextSlot.getByText('Important project work')).toBeVisible();
  });
});
```

#### Scenario 3.2: Focus Type Batching

```typescript
describe('Focus Type Optimization', () => {
  test('Batch similar focus types for cognitive efficiency', async ({ page }) => {
    await page.goto('/dashboard');

    // Create tasks with different focus types
    const tasks = [
      { title: 'Code review 1', focusType: 'TECHNICAL' },
      { title: 'Write documentation', focusType: 'CREATIVE' },
      { title: 'Code review 2', focusType: 'TECHNICAL' },
      { title: 'Design mockups', focusType: 'CREATIVE' },
      { title: 'Process invoices', focusType: 'ADMINISTRATIVE' },
      { title: 'Update spreadsheet', focusType: 'ADMINISTRATIVE' },
    ];

    for (const task of tasks) {
      await createTaskWithMetadata(page, task);
    }

    await page.getByRole('button', { name: 'Generate Daily Plan' }).click();

    // Verify focus type batching
    const technicalBatch = page.getByTestId('focus-batch-technical');
    await expect(technicalBatch.getByText('Code review 1')).toBeVisible();
    await expect(technicalBatch.getByText('Code review 2')).toBeVisible();

    const creativeBatch = page.getByTestId('focus-batch-creative');
    await expect(creativeBatch.getByText('Write documentation')).toBeVisible();
    await expect(creativeBatch.getByText('Design mockups')).toBeVisible();

    const adminBatch = page.getByTestId('focus-batch-administrative');
    await expect(adminBatch.getByText('Process invoices')).toBeVisible();
    await expect(adminBatch.getByText('Update spreadsheet')).toBeVisible();
  });
});
```

### Workflow 4: Calendar Integration

#### Scenario 4.1: Google Calendar Sync

```typescript
describe('Google Calendar Integration', () => {
  test('Sync Google Calendar events with task planning', async ({ page }) => {
    // Mock Google Calendar API responses
    await page.route('**/api/integrations/google/calendar/events', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          events: [
            {
              id: 'google-event-1',
              summary: 'Team Standup',
              start: { dateTime: '2024-01-15T09:00:00-08:00' },
              end: { dateTime: '2024-01-15T09:30:00-08:00' },
              description: 'Daily team sync',
            },
            {
              id: 'google-event-2',
              summary: 'Client Presentation',
              start: { dateTime: '2024-01-15T14:00:00-08:00' },
              end: { dateTime: '2024-01-15T15:00:00-08:00' },
              description: 'Q4 results presentation',
            },
          ],
        }),
      });
    });

    await page.goto('/dashboard');

    // 1. Trigger calendar sync
    await page.getByRole('button', { name: 'Sync Calendar' }).click();
    await expect(page.getByText('Syncing Google Calendar...')).toBeVisible();
    await expect(page.getByText('Calendar sync complete')).toBeVisible();

    // 2. Verify events appear in daily plan
    await page.getByRole('button', { name: 'View Daily Plan' }).click();

    const morningSlot = page.getByTestId('time-slot-09:00');
    await expect(morningSlot.getByText('Team Standup')).toBeVisible();
    await expect(morningSlot.getByText('Google Calendar')).toBeVisible();

    const afternoonSlot = page.getByTestId('time-slot-14:00');
    await expect(afternoonSlot.getByText('Client Presentation')).toBeVisible();

    // 3. Verify planning works around calendar events
    await createTaskWithMetadata(page, { title: 'Project work', energyLevel: 'HIGH' });
    await page.getByRole('button', { name: 'Re-plan Tasks' }).click();

    // Task should be scheduled around calendar events
    const availableSlot = page.getByTestId('time-slot-10:00');
    await expect(availableSlot.getByText('Project work')).toBeVisible();
  });
});
```

#### Scenario 4.2: Calendar Conflict Resolution

```typescript
describe('Calendar Conflict Resolution', () => {
  test('Detect and resolve scheduling conflicts', async ({ page }) => {
    await page.goto('/dashboard');

    // Create overlapping calendar events
    await page.route('**/api/integrations/google/calendar/events', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          events: [
            {
              id: 'conflict-1',
              summary: 'Meeting A',
              start: { dateTime: '2024-01-15T10:00:00-08:00' },
              end: { dateTime: '2024-01-15T11:00:00-08:00' },
            },
          ],
        }),
      });
    });

    await page.route('**/api/integrations/microsoft/calendar/events', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          events: [
            {
              id: 'conflict-2',
              subject: 'Meeting B',
              start: { dateTime: '2024-01-15T10:30:00-08:00' },
              end: { dateTime: '2024-01-15T11:30:00-08:00' },
            },
          ],
        }),
      });
    });

    await page.getByRole('button', { name: 'Sync All Calendars' }).click();

    // Verify conflict detection
    await expect(page.getByText('Calendar conflicts detected')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Resolve Conflicts' })).toBeVisible();

    // Open conflict resolution dialog
    await page.getByRole('button', { name: 'Resolve Conflicts' }).click();

    const conflictDialog = page.getByRole('dialog', { name: 'Calendar Conflicts' });
    await expect(conflictDialog.getByText('Meeting A vs Meeting B')).toBeVisible();
    await expect(conflictDialog.getByText('Overlap: 30 minutes')).toBeVisible();

    // Resolve by choosing primary meeting
    await conflictDialog.getByRole('button', { name: 'Keep Meeting A' }).click();
    await expect(page.getByText('Conflict resolved')).toBeVisible();
  });
});
```

### Workflow 5: Task Management with Metadata

#### Scenario 5.1: Advanced Task Creation

```typescript
describe('Advanced Task Management', () => {
  test('Create task with complete ADHD metadata', async ({ page }) => {
    await page.goto('/dashboard');

    // 1. Open advanced task creation
    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByRole('button', { name: 'Advanced Options' }).click();

    // 2. Fill in basic information
    await page.fill('input[name="title"]', 'Complete UI redesign project');
    await page.fill(
      'textarea[name="description"]',
      'Redesign the main dashboard with ADHD-friendly patterns'
    );

    // 3. Set ADHD-specific metadata
    await page.selectOption('select[name="energyLevel"]', 'HIGH');
    await page.selectOption('select[name="focusType"]', 'CREATIVE');
    await page.selectOption('select[name="priority"]', '4');
    await page.fill('input[name="estimatedMinutes"]', '180');

    // 4. Set deadlines
    await page.fill('input[name="hardDeadline"]', '2024-01-20');
    await page.fill('input[name="softDeadline"]', '2024-01-18');

    // 5. Add dependencies
    await page.getByRole('button', { name: 'Add Dependency' }).click();
    await page.selectOption('select[name="dependsOn"]', 'existing-task-id');

    // 6. Create task
    await page.getByRole('button', { name: 'Create Task' }).click();

    // 7. Verify task creation and metadata display
    const taskCard = page.getByTestId('task-complete-ui-redesign-project');
    await expect(taskCard.getByText('Complete UI redesign project')).toBeVisible();
    await expect(taskCard.getByText('Energy: HIGH')).toBeVisible();
    await expect(taskCard.getByText('Focus: CREATIVE')).toBeVisible();
    await expect(taskCard.getByText('Priority: 4')).toBeVisible();
    await expect(taskCard.getByText('Est: 3h')).toBeVisible();
    await expect(taskCard.getByRole('img', { name: 'Has dependencies' })).toBeVisible();
  });

  test('Drag and drop task scheduling', async ({ page }) => {
    await page.goto('/dashboard');

    // Create test task
    await createTaskWithMetadata(page, {
      title: 'Review code',
      energyLevel: 'HIGH',
      focusType: 'TECHNICAL',
    });

    // Switch to planning view
    await page.getByRole('button', { name: 'Daily Plan View' }).click();

    // Drag task to time slot
    const sourceTask = page.getByTestId('task-review-code');
    const targetSlot = page.getByTestId('time-slot-09:00');

    await sourceTask.dragTo(targetSlot);

    // Verify task is scheduled
    await expect(targetSlot.getByText('Review code')).toBeVisible();
    await expect(page.getByText('Task scheduled for 9:00 AM')).toBeVisible();

    // Verify ADHD-friendly confirmation
    await expect(page.getByText('High energy task scheduled during peak hours')).toBeVisible();
  });
});
```

### Workflow 6: Accessibility and ADHD Features

#### Scenario 6.1: Keyboard Navigation

```typescript
describe('Accessibility Compliance', () => {
  test('Complete keyboard navigation workflow', async ({ page }) => {
    await page.goto('/dashboard');

    // Test keyboard navigation through main interface
    await page.keyboard.press('Tab'); // Focus on first interactive element
    await expect(page.getByRole('button', { name: 'New Task' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'AI Assistant' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'High Energy' })).toBeFocused();

    // Test keyboard task creation
    await page.keyboard.press('Shift+Tab'); // Go back to New Task
    await page.keyboard.press('Enter'); // Activate New Task button

    await expect(page.getByRole('dialog', { name: 'Create New Task' })).toBeVisible();

    // Navigate within dialog using keyboard
    await page.keyboard.type('Keyboard navigation test task');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Testing keyboard accessibility');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Create task

    await expect(page.getByText('Keyboard navigation test task')).toBeVisible();
  });

  test('Screen reader compatibility', async ({ page }) => {
    await page.goto('/dashboard');

    // Test ARIA labels and descriptions
    const energyFilter = page.getByRole('button', { name: 'High Energy' });
    await expect(energyFilter).toHaveAttribute('aria-describedby');

    const taskCard = page.getByRole('article', { name: /task card/i }).first();
    await expect(taskCard).toHaveAttribute('aria-label');

    // Test live regions for dynamic updates
    await page.getByRole('button', { name: 'Generate Daily Plan' }).click();
    const liveRegion = page.getByRole('status');
    await expect(liveRegion).toContainText('Generating optimal schedule');
  });
});
```

#### Scenario 6.2: ADHD-Specific Features

```typescript
describe('ADHD Feature Validation', () => {
  test('Cognitive load management', async ({ page }) => {
    await page.goto('/dashboard');

    // Verify color system compliance (max 3 colors)
    const colorCount = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const colors = new Set();

      elements.forEach(el => {
        const style = getComputedStyle(el);
        if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          colors.add(style.backgroundColor);
        }
        if (style.color !== 'rgba(0, 0, 0, 0)') {
          colors.add(style.color);
        }
      });

      return colors.size;
    });

    expect(colorCount).toBeLessThanOrEqual(3);

    // Test predictable interaction patterns
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const boundingBox = await button.boundingBox();

      // Verify minimum touch target size (44px)
      expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
      expect(boundingBox?.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('Reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });
    });

    await page.goto('/dashboard');

    // Verify animations are disabled
    const animatedElement = page.getByTestId('task-card').first();
    const animationDuration = await animatedElement.evaluate(el => {
      return getComputedStyle(el).animationDuration;
    });

    expect(animationDuration).toBe('0s');
  });
});
```

## Edge Case Test Scenarios

### Network and Performance Edge Cases

#### Scenario E1: Network Failure Handling

```typescript
describe('Network Failure Scenarios', () => {
  test('Handle complete network failure gracefully', async ({ page, context }) => {
    await page.goto('/dashboard');

    // Simulate network failure
    await context.setOffline(true);

    // Attempt to create task offline
    await page.getByRole('button', { name: 'New Task' }).click();
    await page.fill('input[name="title"]', 'Offline task');
    await page.getByRole('button', { name: 'Create Task' }).click();

    // Verify offline handling
    await expect(
      page.getByText('Working offline - changes will sync when connected')
    ).toBeVisible();
    await expect(page.getByText('Offline task')).toBeVisible();

    // Restore network and verify sync
    await context.setOffline(false);
    await expect(page.getByText('Connection restored - syncing changes')).toBeVisible();
    await expect(page.getByText('All changes synced')).toBeVisible();
  });

  test('Handle API timeout scenarios', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/ai/extract-tasks', async route => {
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10s delay
      await route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'AI Assistant' }).click();
    await page.fill('textarea[name="aiInput"]', 'Test timeout');
    await page.getByRole('button', { name: 'Extract Tasks' }).click();

    // Verify timeout handling
    await expect(page.getByText('Processing is taking longer than expected...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel Request' })).toBeVisible();
  });
});
```

#### Scenario E2: Large Data Set Performance

```typescript
describe('Performance with Large Datasets', () => {
  test('Handle 100+ tasks without performance degradation', async ({ page }) => {
    await page.goto('/dashboard');

    // Create large number of tasks
    for (let i = 0; i < 100; i++) {
      await createTaskWithMetadata(page, {
        title: `Task ${i + 1}`,
        energyLevel: ['HIGH', 'MEDIUM', 'LOW'][i % 3],
        focusType: ['TECHNICAL', 'CREATIVE', 'ADMINISTRATIVE', 'SOCIAL'][i % 4],
      });
    }

    // Measure rendering performance
    const startTime = Date.now();
    await page.getByRole('button', { name: 'View All Tasks' }).click();
    await page.waitForSelector('[data-testid="task-list"]');
    const endTime = Date.now();

    // Verify acceptable performance (< 2s for ADHD users)
    expect(endTime - startTime).toBeLessThan(2000);

    // Test filtering performance
    const filterStartTime = Date.now();
    await page.getByRole('button', { name: 'High Energy' }).click();
    await page.waitForSelector('[data-testid="task-list"] [data-energy="HIGH"]');
    const filterEndTime = Date.now();

    expect(filterEndTime - filterStartTime).toBeLessThan(500);
  });
});
```

### Data Integrity Edge Cases

#### Scenario E3: Concurrent User Scenarios

```typescript
describe('Concurrent User Data Handling', () => {
  test('Handle simultaneous task updates', async ({ browser }) => {
    // Create two browser contexts for concurrent users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Both users navigate to same task
    await page1.goto('/dashboard');
    await page2.goto('/dashboard');

    const taskSelector = '[data-testid="task-shared-task"]';

    // User 1 starts editing
    await page1.getByTestId('task-shared-task').getByRole('button', { name: 'Edit' }).click();
    await page1.fill('input[name="title"]', 'Updated by User 1');

    // User 2 also starts editing same task
    await page2.getByTestId('task-shared-task').getByRole('button', { name: 'Edit' }).click();
    await page2.fill('input[name="title"]', 'Updated by User 2');

    // User 1 saves first
    await page1.getByRole('button', { name: 'Save' }).click();

    // User 2 saves second, should detect conflict
    await page2.getByRole('button', { name: 'Save' }).click();
    await expect(
      page2.getByText('Conflict detected: Task was modified by another user')
    ).toBeVisible();
    await expect(page2.getByRole('button', { name: 'Review Changes' })).toBeVisible();
  });
});
```

## Test Data Management

### Reusable Test Fixtures

```typescript
// Shared test utilities
export async function createTestTasks(page: Page, tasks: TaskData[]) {
  for (const task of tasks) {
    await createTaskWithMetadata(page, task);
  }
}

export async function createTaskWithMetadata(page: Page, task: TaskData) {
  await page.getByRole('button', { name: 'New Task' }).click();
  await page.fill('input[name="title"]', task.title);

  if (task.energyLevel) {
    await page.selectOption('select[name="energyLevel"]', task.energyLevel);
  }

  if (task.focusType) {
    await page.selectOption('select[name="focusType"]', task.focusType);
  }

  await page.getByRole('button', { name: 'Create Task' }).click();
  await expect(page.getByText(task.title)).toBeVisible();
}

export const mockAIResponse = {
  tasks: [
    {
      title: 'Review quarterly metrics',
      description: 'Analyze Q4 performance data',
      energyLevel: 'MEDIUM',
      focusType: 'TECHNICAL',
      priority: 3,
      estimatedMinutes: 60,
    },
  ],
};

export const mockCalendarEvents = [
  {
    id: 'cal-1',
    title: 'Team Meeting',
    startTime: '2024-01-15T09:00:00Z',
    endTime: '2024-01-15T10:00:00Z',
    source: 'google',
  },
];
```

## Performance Benchmarks

### ADHD-Optimized Performance Targets

- **Task List Loading**: < 1.5 seconds (100+ tasks)
- **AI Task Extraction**: < 3 seconds (typical response)
- **Calendar Sync**: < 2 seconds (50+ events)
- **Daily Plan Generation**: < 2 seconds (complex schedules)
- **Filter Operations**: < 500ms (any filter combination)
- **Drag and Drop**: < 100ms response time (300ms delay for ADHD users)

### Accessibility Benchmarks

- **WCAG 2.2 AA Compliance**: 100% automated test coverage
- **Keyboard Navigation**: All features accessible without mouse
- **Screen Reader Support**: All content properly announced
- **Color Contrast**: Minimum 4.5:1 ratio for all text
- **Touch Targets**: Minimum 44px × 44px for all interactive elements

This comprehensive workflow testing approach ensures that all critical user journeys are validated while maintaining focus on ADHD-specific features and accessibility compliance.
