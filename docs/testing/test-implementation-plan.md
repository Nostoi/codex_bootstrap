# Test Implementation Plan - Helmsman System

> **Related Documentation**:
>
> - [Test Data Factory System](test-data-factory.md) - ADHD-optimized test data generation
> - [Development Setup](../../DEVELOPMENT.md) - Environment setup and testing commands
> - [GitHub Copilot Instructions](../../.github/copilot-instructions.md) - AI testing patterns and accessibility guidelines

## Implementation Roadmap

### Phase 1: Foundation Tests (Week 1-2)

#### 1.1 Critical Backend Unit Tests

```bash
# Priority 1: Core Service Tests
backend/src/ai/ai.service.spec.ts                    # ✅ exists
backend/src/integrations/google/google.service.spec.ts # ⚠️ create
backend/src/integrations/graph/graph.service.spec.ts   # ✅ exists (17 tests passing)
backend/src/tasks/tasks.service.spec.ts               # ⚠️ create
backend/src/planning/daily-planner.service.spec.ts    # ⚠️ create
backend/test/                                         # ✅ comprehensive test data factory system implemented
```

#### 1.2 Essential Frontend Component Tests

```bash
# Priority 1: Core Component Tests
frontend/src/components/Dashboard.spec.tsx            # ⚠️ create
frontend/src/components/ui/TaskCard.spec.tsx         # ⚠️ create
frontend/src/components/ui/FilterBar.spec.tsx        # ⚠️ create
frontend/src/hooks/useApi.spec.ts                    # ⚠️ create
```

#### 1.3 Integration Test Foundation

```bash
# Priority 1: Core Integration Tests
backend/tests/integration/ai-service.integration.spec.ts        # ⚠️ create
backend/tests/integration/oauth-flows.integration.spec.ts       # ⚠️ create
frontend/tests/integration/dashboard-api.integration.spec.ts    # ⚠️ create
```

### Phase 2: Workflow Tests (Week 3-4)

#### 2.1 E2E Workflow Tests

```bash
# Missing E2E Tests to Create
frontend/tests/e2e/calendar-workflows.e2e.ts         # ⚠️ create
frontend/tests/e2e/adhd-features.e2e.ts             # ⚠️ create
frontend/tests/e2e/error-scenarios.e2e.ts           # ⚠️ create
```

#### 2.2 Performance & Accessibility Tests

```bash
# Enhanced Testing Coverage
frontend/tests/e2e/performance-comprehensive.e2e.ts  # ⚠️ create
frontend/tests/e2e/accessibility-wcag.e2e.ts        # ⚠️ create
```

## Test Implementation Templates

### Template 1: Backend Service Unit Test

```typescript
// backend/src/integrations/google/google.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GoogleService } from './google.service';
import { ConfigService } from '@nestjs/config';

describe('GoogleService', () => {
  let service: GoogleService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config = {
                GOOGLE_CLIENT_ID: 'test_client_id',
                GOOGLE_CLIENT_SECRET: 'test_client_secret',
                GOOGLE_CALLBACK_URL: 'http://localhost:3501/auth/google/callback',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GoogleService>(GoogleService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('OAuth Configuration', () => {
    it('should initialize with correct OAuth config', () => {
      expect(service).toBeDefined();
      expect(configService.get('GOOGLE_CLIENT_ID')).toBe('test_client_id');
    });

    it('should generate correct OAuth URL', async () => {
      const authUrl = await service.getAuthUrl();
      expect(authUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain('client_id=test_client_id');
    });
  });

  describe('Calendar Operations', () => {
    it('should fetch calendar events with proper error handling', async () => {
      // Mock authenticated request
      const mockEvents = [
        { id: '1', summary: 'Test Event', start: { dateTime: '2024-01-15T10:00:00Z' } },
      ];

      jest.spyOn(service, 'getCalendarEvents').mockResolvedValue(mockEvents);

      const events = await service.getCalendarEvents('mock_token');
      expect(events).toEqual(mockEvents);
      expect(events).toHaveLength(1);
    });

    it('should handle API rate limiting gracefully', async () => {
      jest.spyOn(service, 'getCalendarEvents').mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(service.getCalendarEvents('mock_token')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid tokens', async () => {
      jest.spyOn(service, 'getCalendarEvents').mockRejectedValue(new Error('Invalid credentials'));

      await expect(service.getCalendarEvents('invalid_token')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should handle network failures', async () => {
      jest.spyOn(service, 'getCalendarEvents').mockRejectedValue(new Error('Network error'));

      await expect(service.getCalendarEvents('mock_token')).rejects.toThrow('Network error');
    });
  });
});
```

### Template 2: Frontend Component Test

```typescript
// frontend/src/components/Dashboard.spec.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Dashboard from './Dashboard';
import { useApi } from '../hooks/useApi';

// Mock the useApi hook
vi.mock('../hooks/useApi');
const mockUseApi = vi.mocked(useApi);

// Mock data
const mockTasks = [
  {
    id: '1',
    title: 'Test Task 1',
    description: 'Test description',
    priority: 'high',
    energyLevel: 'high',
    focusType: 'creative',
    completed: false,
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Test Task 2',
    description: 'Another test task',
    priority: 'medium',
    energyLevel: 'medium',
    focusType: 'technical',
    completed: true,
    createdAt: '2024-01-14T15:00:00Z'
  }
];

describe('Dashboard Component', () => {
  beforeEach(() => {
    mockUseApi.mockReturnValue({
      tasks: mockTasks,
      loading: false,
      error: null,
      fetchTasks: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render dashboard with tasks', () => {
      render(<Dashboard />);

      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });

    it('should display loading state', () => {
      mockUseApi.mockReturnValue({
        tasks: [],
        loading: true,
        error: null,
        fetchTasks: vi.fn(),
        createTask: vi.fn(),
        updateTask: vi.fn(),
        deleteTask: vi.fn(),
      });

      render(<Dashboard />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display error state', () => {
      mockUseApi.mockReturnValue({
        tasks: [],
        loading: false,
        error: 'Failed to load tasks',
        fetchTasks: vi.fn(),
        createTask: vi.fn(),
        updateTask: vi.fn(),
        deleteTask: vi.fn(),
      });

      render(<Dashboard />);
      expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument();
    });
  });

  describe('ADHD Features', () => {
    it('should filter tasks by energy level', async () => {
      render(<Dashboard />);

      // Click high energy filter
      const highEnergyFilter = screen.getByLabelText(/high energy/i);
      fireEvent.click(highEnergyFilter);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument();
      });
    });

    it('should filter tasks by focus type', async () => {
      render(<Dashboard />);

      // Click creative focus filter
      const creativeFilter = screen.getByLabelText(/creative/i);
      fireEvent.click(creativeFilter);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument();
      });
    });

    it('should show/hide completed tasks', async () => {
      render(<Dashboard />);

      // Both tasks should be visible initially
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();

      // Hide completed tasks
      const hideCompletedToggle = screen.getByLabelText(/hide completed/i);
      fireEvent.click(hideCompletedToggle);

      await waitFor(() => {
        expect(screen.getByText('Test Task 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Task 2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation', () => {
      render(<Dashboard />);

      const firstTask = screen.getByText('Test Task 1');
      firstTask.focus();
      expect(firstTask).toHaveFocus();

      // Test Tab navigation
      fireEvent.keyDown(firstTask, { key: 'Tab' });
      // Next focusable element should receive focus
    });

    it('should have proper ARIA labels', () => {
      render(<Dashboard />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Task Dashboard');
      expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Task List');
    });

    it('should announce filter changes to screen readers', async () => {
      render(<Dashboard />);

      const highEnergyFilter = screen.getByLabelText(/high energy/i);
      fireEvent.click(highEnergyFilter);

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/filtered by high energy/i);
      });
    });
  });

  describe('Performance', () => {
    it('should virtualize large task lists', () => {
      // Mock large dataset
      const largeMockTasks = Array.from({ length: 1000 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description ${i}`,
        priority: 'medium',
        energyLevel: 'medium',
        focusType: 'technical',
        completed: false,
        createdAt: '2024-01-15T10:00:00Z'
      }));

      mockUseApi.mockReturnValue({
        tasks: largeMockTasks,
        loading: false,
        error: null,
        fetchTasks: vi.fn(),
        createTask: vi.fn(),
        updateTask: vi.fn(),
        deleteTask: vi.fn(),
      });

      render(<Dashboard />);

      // Only visible items should be rendered
      const renderedTasks = screen.getAllByRole('listitem');
      expect(renderedTasks.length).toBeLessThan(100); // Virtual scrolling limit
    });
  });
});
```

### Template 3: E2E Test

```typescript
// frontend/tests/e2e/adhd-features.e2e.ts
import { test, expect } from '@playwright/test';
import { ADHDFeaturesPageObject } from './page-objects/ADHDFeaturesPageObject';

test.describe('ADHD-Optimized Features', () => {
  let adhdFeatures: ADHDFeaturesPageObject;

  test.beforeEach(async ({ page }) => {
    adhdFeatures = new ADHDFeaturesPageObject(page);
    await adhdFeatures.goto();
    await adhdFeatures.login();
  });

  test.describe('Energy Management', () => {
    test('should respect energy pattern preferences', async () => {
      // Set morning peak energy pattern
      await adhdFeatures.setEnergyPattern('morning-peak');

      // Generate daily plan
      await adhdFeatures.generateDailyPlan();

      // Verify high-energy tasks scheduled in morning
      const morningTasks = await adhdFeatures.getTasksInTimeSlot('9:00', '12:00');
      const highEnergyTasks = morningTasks.filter(task => task.energyLevel === 'high');

      expect(highEnergyTasks.length).toBeGreaterThan(0);
    });

    test('should suggest energy-appropriate tasks', async () => {
      // Set current energy to low
      await adhdFeatures.setCurrentEnergy('low');

      // Request task suggestions
      const suggestions = await adhdFeatures.getTaskSuggestions();

      // Verify only low-energy tasks suggested
      suggestions.forEach(task => {
        expect(task.energyLevel).toBe('low');
      });
    });
  });

  test.describe('Focus Type Optimization', () => {
    test('should group tasks by focus type', async () => {
      await adhdFeatures.enableFocusGrouping();

      const focusGroups = await adhdFeatures.getFocusGroups();
      expect(focusGroups).toContain('Creative Tasks');
      expect(focusGroups).toContain('Technical Tasks');
      expect(focusGroups).toContain('Administrative Tasks');
    });

    test('should prevent focus type switching too frequently', async () => {
      // Schedule creative task
      await adhdFeatures.createTask({
        title: 'Design mockups',
        focusType: 'creative',
        scheduledTime: '10:00',
      });

      // Try to schedule technical task immediately after
      await adhdFeatures.createTask({
        title: 'Code review',
        focusType: 'technical',
        scheduledTime: '10:30',
      });

      // Should show warning about context switching
      const warning = await adhdFeatures.getContextSwitchingWarning();
      expect(warning).toContain('frequent context switching');
    });
  });

  test.describe('Distraction Management', () => {
    test('should enter focus mode successfully', async () => {
      await adhdFeatures.startFocusMode();

      // Verify focus mode UI changes
      expect(await adhdFeatures.isFocusModeActive()).toBe(true);
      expect(await adhdFeatures.areNotificationsBlocked()).toBe(true);
      expect(await adhdFeatures.isNavigationMinimized()).toBe(true);
    });

    test('should block distracting notifications in focus mode', async () => {
      await adhdFeatures.startFocusMode();

      // Simulate notification
      await adhdFeatures.triggerTestNotification();

      // Notification should be queued, not displayed
      expect(await adhdFeatures.isNotificationVisible()).toBe(false);
      expect(await adhdFeatures.getQueuedNotificationCount()).toBe(1);
    });

    test('should provide gentle focus reminders', async () => {
      await adhdFeatures.createTask({
        title: 'Important deadline task',
        priority: 'high',
        deadline: '2024-01-15T17:00:00Z',
      });

      // Wait for gentle reminder (should appear 30 minutes before)
      await adhdFeatures.waitForGentleReminder();

      const reminder = await adhdFeatures.getActiveReminder();
      expect(reminder.tone).toBe('gentle');
      expect(reminder.message).toContain('approaching deadline');
    });
  });

  test.describe('Cognitive Load Management', () => {
    test('should limit simultaneous tasks', async () => {
      // Set cognitive load limit to 3
      await adhdFeatures.setCognitiveLoadLimit(3);

      // Try to add 5 tasks to today
      for (let i = 0; i < 5; i++) {
        await adhdFeatures.createTask({
          title: `Task ${i + 1}`,
          scheduledDate: 'today',
        });
      }

      // Should warn about cognitive overload
      const warning = await adhdFeatures.getCognitiveLoadWarning();
      expect(warning).toContain('cognitive overload');
    });

    test('should suggest task postponement when overloaded', async () => {
      await adhdFeatures.setCognitiveLoadLimit(2);

      // Add tasks exceeding limit
      await adhdFeatures.createTask({ title: 'Task 1', scheduledDate: 'today' });
      await adhdFeatures.createTask({ title: 'Task 2', scheduledDate: 'today' });
      await adhdFeatures.createTask({ title: 'Task 3', scheduledDate: 'today' });

      const suggestions = await adhdFeatures.getOverloadSuggestions();
      expect(suggestions).toContain('postpone lower priority tasks');
      expect(suggestions).toContain('break large tasks into smaller ones');
    });
  });

  test.describe('Visual Accessibility', () => {
    test('should support reduced motion preferences', async () => {
      await adhdFeatures.setReducedMotion(true);

      // Verify animations are disabled
      const animations = await adhdFeatures.getActiveAnimations();
      expect(animations.length).toBe(0);

      // Transitions should be instant
      await adhdFeatures.switchToCalendarView();
      const transitionDuration = await adhdFeatures.getTransitionDuration();
      expect(transitionDuration).toBeLessThan(100); // < 100ms
    });

    test('should maintain high contrast in dark mode', async () => {
      await adhdFeatures.enableDarkMode();

      const contrastRatios = await adhdFeatures.getContrastRatios();

      // All text should meet WCAG AA standards (4.5:1 for normal text)
      contrastRatios.forEach(ratio => {
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });
});
```

### Template 4: Page Object Model

```typescript
// frontend/tests/e2e/page-objects/ADHDFeaturesPageObject.ts
import { Page, Locator } from '@playwright/test';

export class ADHDFeaturesPageObject {
  private page: Page;

  // Locators
  private energyLevelSelector: Locator;
  private focusTypeSelector: Locator;
  private focusModeButton: Locator;
  private cognitiveLoadWarning: Locator;
  private taskList: Locator;
  private dailyPlanButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.energyLevelSelector = page.getByTestId('energy-level-selector');
    this.focusTypeSelector = page.getByTestId('focus-type-selector');
    this.focusModeButton = page.getByTestId('focus-mode-button');
    this.cognitiveLoadWarning = page.getByTestId('cognitive-load-warning');
    this.taskList = page.getByTestId('task-list');
    this.dailyPlanButton = page.getByTestId('generate-daily-plan');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async login() {
    // Mock authentication or use test credentials
    await this.page.goto('/dashboard?testAuth=true');
  }

  async setEnergyPattern(
    pattern: 'morning-peak' | 'afternoon-peak' | 'evening-peak' | 'consistent'
  ) {
    await this.page.getByTestId('settings-button').click();
    await this.page.getByTestId('energy-pattern-selector').selectOption(pattern);
    await this.page.getByTestId('save-settings').click();
  }

  async setCurrentEnergy(level: 'low' | 'medium' | 'high') {
    await this.energyLevelSelector.selectOption(level);
  }

  async generateDailyPlan() {
    await this.dailyPlanButton.click();
    await this.page.waitForSelector('[data-testid="daily-plan-generated"]');
  }

  async getTasksInTimeSlot(startTime: string, endTime: string) {
    const tasks = await this.page.$$eval(
      '[data-testid="scheduled-task"]',
      (elements, { start, end }) => {
        return elements
          .filter(el => {
            const time = el.getAttribute('data-scheduled-time');
            return time && time >= start && time <= end;
          })
          .map(el => ({
            title: el.textContent,
            energyLevel: el.getAttribute('data-energy-level'),
            focusType: el.getAttribute('data-focus-type'),
          }));
      },
      { start: startTime, end: endTime }
    );
    return tasks;
  }

  async getTaskSuggestions() {
    await this.page.getByTestId('get-suggestions-button').click();
    await this.page.waitForSelector('[data-testid="task-suggestions"]');

    return await this.page.$$eval('[data-testid="suggested-task"]', elements =>
      elements.map(el => ({
        title: el.textContent,
        energyLevel: el.getAttribute('data-energy-level'),
        focusType: el.getAttribute('data-focus-type'),
      }))
    );
  }

  async enableFocusGrouping() {
    await this.page.getByTestId('focus-grouping-toggle').click();
  }

  async getFocusGroups() {
    return await this.page.$$eval('[data-testid="focus-group"]', elements =>
      elements.map(el => el.textContent)
    );
  }

  async createTask(task: {
    title: string;
    description?: string;
    priority?: string;
    energyLevel?: string;
    focusType?: string;
    scheduledTime?: string;
    scheduledDate?: string;
    deadline?: string;
  }) {
    await this.page.getByTestId('add-task-button').click();

    await this.page.getByTestId('task-title-input').fill(task.title);

    if (task.description) {
      await this.page.getByTestId('task-description-input').fill(task.description);
    }

    if (task.priority) {
      await this.page.getByTestId('task-priority-select').selectOption(task.priority);
    }

    if (task.energyLevel) {
      await this.page.getByTestId('task-energy-select').selectOption(task.energyLevel);
    }

    if (task.focusType) {
      await this.page.getByTestId('task-focus-type-select').selectOption(task.focusType);
    }

    if (task.scheduledTime) {
      await this.page.getByTestId('task-time-input').fill(task.scheduledTime);
    }

    if (task.scheduledDate) {
      await this.page.getByTestId('task-date-input').fill(task.scheduledDate);
    }

    if (task.deadline) {
      await this.page.getByTestId('task-deadline-input').fill(task.deadline);
    }

    await this.page.getByTestId('save-task-button').click();
    await this.page.waitForSelector('[data-testid="task-created-confirmation"]');
  }

  async getContextSwitchingWarning() {
    return await this.page.getByTestId('context-switching-warning').textContent();
  }

  async startFocusMode() {
    await this.focusModeButton.click();
    await this.page.waitForSelector('[data-testid="focus-mode-active"]');
  }

  async isFocusModeActive() {
    return await this.page.getByTestId('focus-mode-active').isVisible();
  }

  async areNotificationsBlocked() {
    const notificationStatus = await this.page.getByTestId('notification-status').textContent();
    return notificationStatus?.includes('blocked');
  }

  async isNavigationMinimized() {
    const nav = await this.page.getByTestId('main-navigation');
    return (await nav.getAttribute('data-minimized')) === 'true';
  }

  async triggerTestNotification() {
    await this.page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('test-notification', {
          detail: { message: 'Test notification', type: 'info' },
        })
      );
    });
  }

  async isNotificationVisible() {
    return await this.page.getByTestId('active-notification').isVisible();
  }

  async getQueuedNotificationCount() {
    const countText = await this.page.getByTestId('queued-notifications-count').textContent();
    return parseInt(countText || '0');
  }

  async waitForGentleReminder() {
    await this.page.waitForSelector('[data-testid="gentle-reminder"]', { timeout: 60000 });
  }

  async getActiveReminder() {
    const reminderEl = this.page.getByTestId('gentle-reminder');
    return {
      tone: await reminderEl.getAttribute('data-tone'),
      message: await reminderEl.textContent(),
    };
  }

  async setCognitiveLoadLimit(limit: number) {
    await this.page.getByTestId('settings-button').click();
    await this.page.getByTestId('cognitive-load-limit-input').fill(limit.toString());
    await this.page.getByTestId('save-settings').click();
  }

  async getCognitiveLoadWarning() {
    return await this.cognitiveLoadWarning.textContent();
  }

  async getOverloadSuggestions() {
    const suggestions = await this.page.$$eval('[data-testid="overload-suggestion"]', elements =>
      elements.map(el => el.textContent)
    );
    return suggestions;
  }

  async setReducedMotion(enabled: boolean) {
    await this.page.addInitScript(reduced => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)' ? reduced : false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    }, enabled);
  }

  async getActiveAnimations() {
    return await this.page.$$eval('[data-testid*="animation"]', elements =>
      elements.filter(el => {
        const computed = getComputedStyle(el);
        return computed.animationName !== 'none' || computed.transitionDuration !== '0s';
      })
    );
  }

  async switchToCalendarView() {
    const startTime = Date.now();
    await this.page.getByTestId('calendar-view-button').click();
    await this.page.waitForSelector('[data-testid="calendar-view-active"]');
    return Date.now() - startTime;
  }

  async getTransitionDuration() {
    // Implementation depends on how transitions are measured
    return 0; // Placeholder
  }

  async enableDarkMode() {
    await this.page.getByTestId('dark-mode-toggle').click();
    await this.page.waitForSelector('[data-theme="dark"]');
  }

  async getContrastRatios() {
    return await this.page.evaluate(() => {
      // Implementation would use color analysis library
      // Return mock data for template
      return [4.8, 5.2, 4.6, 7.1]; // Example contrast ratios
    });
  }
}
```

## Quick Implementation Command Sequence

```bash
# Create test directory structure
mkdir -p backend/tests/integration
mkdir -p frontend/tests/integration
mkdir -p frontend/tests/e2e/page-objects

# Create priority unit tests
touch backend/src/integrations/google/google.service.spec.ts
touch backend/src/tasks/tasks.service.spec.ts
touch frontend/src/components/Dashboard.spec.tsx
touch frontend/src/components/ui/TaskCard.spec.tsx
touch frontend/src/hooks/useApi.spec.ts

# Create integration tests
touch backend/tests/integration/ai-service.integration.spec.ts
touch backend/tests/integration/oauth-flows.integration.spec.ts
touch frontend/tests/integration/dashboard-api.integration.spec.ts

# Create E2E tests
touch frontend/tests/e2e/adhd-features.e2e.ts
touch frontend/tests/e2e/calendar-workflows.e2e.ts
touch frontend/tests/e2e/error-scenarios.e2e.ts

# Create page objects
touch frontend/tests/e2e/page-objects/ADHDFeaturesPageObject.ts
touch frontend/tests/e2e/page-objects/CalendarWorkflowsPageObject.ts
```

## Success Validation

### Test Coverage Metrics

- **Unit Tests**: 50+ test suites covering core services and components
- **Integration Tests**: 15+ test suites covering API workflows and data flow
- **E2E Tests**: 25+ test scenarios covering complete user workflows
- **Performance**: Core Web Vitals compliance across all major workflows
- **Accessibility**: WCAG 2.2 AA compliance validation for ADHD users

### Quality Gates

- All tests pass in CI/CD pipeline
- Code coverage targets met (85% backend, 80% frontend)
- Performance budgets maintained
- Zero accessibility violations
- Test execution time under 15 minutes

This comprehensive test implementation plan ensures robust validation of the Helmsman system while maintaining focus on ADHD-optimized features and accessibility standards.
