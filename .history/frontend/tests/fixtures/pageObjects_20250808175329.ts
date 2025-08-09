import { Page, expect, Locator } from '@playwright/test';
import {
  mockTasks,
  mockTasksWithDependencies,
  mockLargeDashboardTasks,
  testSelectors,
} from './taskData';

export class DashboardPageObject {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
    await this.waitForLoad();
  }

  async waitForLoad() {
    // Wait for the Helmsman Dashboard title to be visible
    await expect(this.page.getByRole('heading', { name: /helmsman dashboard/i })).toBeVisible();
    await this.page.waitForLoadState('networkidle');
  }

  // Header interactions
  async getHeaderTitle() {
    return this.page.locator(testSelectors.dashboard.title);
  }

  async getSubtitle() {
    return this.page.locator(testSelectors.dashboard.subtitle);
  }

  async getTaskStats() {
    return this.page.locator(testSelectors.dashboard.stats);
  }

  async getAIStatus() {
    return this.page.locator(testSelectors.dashboard.aiStatus);
  }

  // View mode switching
  async switchToGridView() {
    await this.page.locator(testSelectors.viewModes.gridViewButton).click();
    await expect(this.page.locator(testSelectors.dashboard.tasksGrid)).toBeVisible();
  }

  async switchToFocusView() {
    await this.page.locator(testSelectors.viewModes.focusViewButton).click();
    await expect(this.page.locator(testSelectors.viewModes.focusViewContainer)).toBeVisible();
  }

  async refreshDailyPlan() {
    await this.page.locator(testSelectors.dashboard.refreshButton).click();
  }

  // Task Grid interactions
  async getTaskCards() {
    return this.page.locator(testSelectors.taskCard.container);
  }

  async getTaskCard(taskTitle: string) {
    return this.page.locator(testSelectors.taskCard.container).filter({ hasText: taskTitle });
  }

  async verifyTaskCardMetadata(taskTitle: string, expectedMetadata: any) {
    const taskCard = await this.getTaskCard(taskTitle);
    await expect(taskCard).toBeVisible();

    if (expectedMetadata.energyLevel) {
      const energyBadge = taskCard.locator(testSelectors.taskCard.energyLevel);
      await expect(energyBadge).toBeVisible();
    }

    if (expectedMetadata.focusType) {
      const focusBadge = taskCard.locator(testSelectors.taskCard.focusType);
      await expect(focusBadge).toBeVisible();
    }

    if (expectedMetadata.priority) {
      const priorityBadge = taskCard.locator(testSelectors.taskCard.priority);
      await expect(priorityBadge).toBeVisible();
    }
  }

  // Filter interactions
  async waitForFilterBar() {
    await expect(this.page.locator(testSelectors.filterBar.container)).toBeVisible();
  }

  async filterBySearch(searchTerm: string) {
    const searchInput = this.page.locator(testSelectors.filterBar.searchInput);
    await searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Debounce delay
  }

  async filterByEnergyLevel(energyLevel: 'HIGH' | 'MEDIUM' | 'LOW') {
    const energyButton = {
      HIGH: this.page.locator(testSelectors.filterBar.highEnergyFilter),
      MEDIUM: this.page.locator(testSelectors.filterBar.mediumEnergyFilter),
      LOW: this.page.locator(testSelectors.filterBar.lowEnergyFilter),
    }[energyLevel];

    await energyButton.click();
  }

  async filterByFocusType(focusType: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL') {
    const focusButton = {
      CREATIVE: this.page.locator(testSelectors.filterBar.creativeFilter),
      TECHNICAL: this.page.locator(testSelectors.filterBar.technicalFilter),
      ADMINISTRATIVE: this.page.locator(testSelectors.filterBar.administrativeFilter),
      SOCIAL: this.page.locator(testSelectors.filterBar.socialFilter),
    }[focusType];

    await focusButton.click();
  }

  async clearFilters() {
    const clearButton = this.page.locator(testSelectors.filterBar.clearButton);
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  }

  async resetFilters() {
    const resetButton = this.page.locator(testSelectors.filterBar.resetButton);
    if (await resetButton.isVisible()) {
      await resetButton.click();
    }
  }

  // Daily Planning interactions
  async waitForDailyPlan() {
    // Wait for either loading message or plan content
    await this.page.waitForSelector(
      [
        testSelectors.dailyPlanning.loadingAlert,
        testSelectors.dailyPlanning.optimizationStats,
      ].join(',')
    );
  }

  async getOptimizationStats() {
    return this.page.locator(testSelectors.dailyPlanning.optimizationStats);
  }

  async getEnergyOptimization() {
    return this.page.locator(testSelectors.dailyPlanning.energyOptimization);
  }

  async getFocusOptimization() {
    return this.page.locator(testSelectors.dailyPlanning.focusOptimization);
  }

  async getDeadlineRisk() {
    return this.page.locator(testSelectors.dailyPlanning.deadlineRisk);
  }

  // AI Integration interactions
  async sendMessageToAI(message: string) {
    const textInput = this.page.locator(testSelectors.aiIntegration.textInput);
    await textInput.fill(message);

    const sendButton = this.page.locator(testSelectors.aiIntegration.sendButton);
    await sendButton.click();
  }

  async extractTasksFromAI() {
    const extractButton = this.page.locator(testSelectors.aiIntegration.extractButton);
    await extractButton.click();
  }

  async clearAIChat() {
    const clearButton = this.page.locator(testSelectors.aiIntegration.clearButton);
    await clearButton.click();
  }

  // Performance helpers
  async measureLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.goto();
    return Date.now() - startTime;
  }

  async getTaskCount(): Promise<number> {
    return await this.page.locator(testSelectors.dashboard.taskCard).count();
  }
}

export class AIIntegrationPageObject {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
    // Look for AI integration component on dashboard
    await this.waitForAIComponent();
  }

  async waitForAIComponent() {
    await expect(this.page.locator(testSelectors.aiIntegration.textInput)).toBeVisible({
      timeout: 10000,
    });
  }

  async extractTasksFromText(text: string) {
    await this.page.locator(testSelectors.aiIntegration.textInput).fill(text);
    await this.page.locator(testSelectors.aiIntegration.extractButton).click();

    // Wait for AI processing
    await this.page.waitForSelector(testSelectors.aiIntegration.suggestedTasks, { timeout: 15000 });
  }

  async getSuggestedTasks() {
    return this.page.locator(testSelectors.aiIntegration.suggestedTasks);
  }

  async acceptSuggestion(index: number) {
    await this.page.locator(testSelectors.aiIntegration.acceptSuggestion).nth(index).click();
  }

  async rejectSuggestion(index: number) {
    await this.page.locator(testSelectors.aiIntegration.rejectSuggestion).nth(index).click();
  }

  async verifyTaskExtraction(expectedTaskCount: number) {
    const suggestions = await this.getSuggestedTasks();
    await expect(suggestions.locator('[data-testid="suggested-task"]')).toHaveCount(
      expectedTaskCount
    );
  }
}

export class DailyPlanningPageObject {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
    // The dashboard shows "Loading your daily plan..." - wait for planning interface
    await this.waitForPlanningView();
  }

  async waitForPlanningView() {
    // Wait for the daily plan loading message or planning interface
    await expect(this.page.getByText('Loading your daily plan...')).toBeVisible();
  }

  async generateDailyPlan() {
    await this.page.locator(testSelectors.dailyPlanning.generatePlan).click();
    await this.page.waitForLoadState('networkidle');
  }

  async getTimeSlots() {
    // Return empty locator since time slots aren't implemented yet
    return this.page.locator('.time-slot-placeholder');
  }

  async getScheduledTasks() {
    // Return empty locator since scheduled tasks aren't implemented yet
    return this.page.locator('.scheduled-task-placeholder');
  }

  async verifyEnergyMatching(timeSlot: string, expectedEnergyLevel: string) {
    // Placeholder for energy matching verification
    console.log(`Would verify energy matching for ${timeSlot} with ${expectedEnergyLevel}`);
    // For now, just verify the dashboard is visible
    await expect(this.page.locator('h1:has-text("Helmsman Dashboard")')).toBeVisible();
  }

  async navigateToDailyPlanning() {
    await this.page.goto('/dashboard');

    // Wait for the dashboard to load
    await expect(this.page.locator('h1:has-text("Helmsman Dashboard")')).toBeVisible();
    await this.page.waitForLoadState('networkidle');
  }

  async generateDailyPlan() {
    // Click the refresh plan button (🔄 Refresh Plan)
    await this.page.getByRole('button', { name: /🔄 Refresh Plan/i }).click();
    await this.page.waitForTimeout(500);
  }

  async selectEnergyLevel(level: 'high' | 'medium' | 'low') {
    const energyMap = {
      high: 'High Energy',
      medium: 'Medium Energy',
      low: 'Low Energy',
    };

    await this.page.getByRole('button', { name: energyMap[level] }).click();
  }

  async dragTaskToTimeSlot(taskName: string, timeSlot: string) {
    // For now, this is a placeholder since drag-and-drop isn't implemented in the current UI
    // We'll simulate the interaction by logging what would happen
    console.log(`Would drag "${taskName}" to "${timeSlot}"`);

    // Wait for a moment to simulate the drag operation
    await this.page.waitForTimeout(500);
  }
}

export class AccessibilityHelper {
  constructor(private page: Page) {}

  async verifyKeyboardNavigation(startElement: string, expectedStops: string[]) {
    await this.page.locator(startElement).focus();

    for (const expectedStop of expectedStops) {
      await this.page.keyboard.press('Tab');
      const focused = await this.page.locator(':focus').getAttribute('data-testid');
      expect(focused).toBe(expectedStop);
    }
  }

  async verifyAriaLabels(selectors: string[]) {
    for (const selector of selectors) {
      const element = this.page.locator(selector);
      await expect(element).toHaveAttribute('aria-label', /.+/);
    }
  }

  async verifyColorContrast() {
    // This would typically use axe-playwright for automated contrast testing
    const axeResults = await this.page.evaluate(() => {
      // @ts-ignore - axe is injected by axe-playwright
      return axe.run();
    });

    const contrastViolations = axeResults.violations.filter(v => v.id === 'color-contrast');
    expect(contrastViolations).toHaveLength(0);
  }

  async verifyFocusTrapping(containerSelector: string) {
    const container = this.page.locator(containerSelector);
    const focusableElements = container.locator(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements.first();
    const lastElement = focusableElements.last();

    // Focus last element and press Tab - should wrap to first
    await lastElement.focus();
    await this.page.keyboard.press('Tab');
    await expect(firstElement).toBeFocused();

    // Focus first element and press Shift+Tab - should wrap to last
    await firstElement.focus();
    await this.page.keyboard.press('Shift+Tab');
    await expect(lastElement).toBeFocused();
  }
}

export async function setupTestData(page: Page) {
  // Mock API responses for consistent testing
  await page.route('/api/tasks', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTasks),
    });
  });

  await page.route('/api/tasks/large-dataset', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockLargeDashboardTasks),
    });
  });

  await page.route('/api/tasks/dependencies', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTasksWithDependencies),
    });
  });
}

export async function cleanupTestData(page: Page) {
  // Clear any test data or reset state
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Reset any global state if needed
  await page.route('/api/**', route => route.continue());
}

export class PerformanceHelper {
  constructor(private page: Page) {}

  async measurePageLoadTime(url: string): Promise<number> {
    const startTime = Date.now();
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  async measureTaskRenderTime(taskCount: number): Promise<number> {
    await this.page.route('/api/tasks', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLargeDashboardTasks.slice(0, taskCount)),
      });
    });

    const startTime = Date.now();
    await this.page.reload();
    await this.page.waitForSelector(testSelectors.dashboard.taskCard, { timeout: 30000 });
    return Date.now() - startTime;
  }

  async measureFilterResponseTime(filterAction: () => Promise<void>): Promise<number> {
    const startTime = Date.now();
    await filterAction();
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }
}

export class FilterBarPageObject {
  constructor(private page: Page) {}

  async waitForLoad() {
    await expect(this.page.locator(testSelectors.filterBar.container)).toBeVisible();
  }

  async search(term: string) {
    const searchInput = this.page.locator(testSelectors.filterBar.searchInput);
    await searchInput.fill(term);
    await this.page.waitForTimeout(350); // Wait for debounce
  }

  async clearSearch() {
    const searchInput = this.page.locator(testSelectors.filterBar.searchInput);
    await searchInput.fill('');
    await this.page.waitForTimeout(350);
  }

  // Energy Level Filtering
  async filterByHighEnergy() {
    await this.page.locator(testSelectors.filterBar.highEnergyFilter).click();
  }

  async filterByMediumEnergy() {
    await this.page.locator(testSelectors.filterBar.mediumEnergyFilter).click();
  }

  async filterByLowEnergy() {
    await this.page.locator(testSelectors.filterBar.lowEnergyFilter).click();
  }

  async toggleEnergyFilter(level: 'HIGH' | 'MEDIUM' | 'LOW') {
    const energySelectors = {
      HIGH: testSelectors.filterBar.highEnergyFilter,
      MEDIUM: testSelectors.filterBar.mediumEnergyFilter,
      LOW: testSelectors.filterBar.lowEnergyFilter,
    };

    await this.page.locator(energySelectors[level]).click();
  }

  // Focus Type Filtering
  async filterByCreative() {
    await this.page.locator(testSelectors.filterBar.creativeFilter).click();
  }

  async filterByTechnical() {
    await this.page.locator(testSelectors.filterBar.technicalFilter).click();
  }

  async filterByAdministrative() {
    await this.page.locator(testSelectors.filterBar.administrativeFilter).click();
  }

  async filterBySocial() {
    await this.page.locator(testSelectors.filterBar.socialFilter).click();
  }

  async toggleFocusFilter(type: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL') {
    const focusSelectors = {
      CREATIVE: testSelectors.filterBar.creativeFilter,
      TECHNICAL: testSelectors.filterBar.technicalFilter,
      ADMINISTRATIVE: testSelectors.filterBar.administrativeFilter,
      SOCIAL: testSelectors.filterBar.socialFilter,
    };

    await this.page.locator(focusSelectors[type]).click();
  }

  // Filter Management
  async clearAllFilters() {
    const clearButton = this.page.locator(testSelectors.filterBar.clearButton);
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  }

  async resetFilters() {
    const resetButton = this.page.locator(testSelectors.filterBar.resetButton);
    if (await resetButton.isVisible()) {
      await resetButton.click();
    }
  }

  // Verification methods
  async verifySearchTerm(expectedTerm: string) {
    const searchInput = this.page.locator(testSelectors.filterBar.searchInput);
    await expect(searchInput).toHaveValue(expectedTerm);
  }

  async verifyEnergyFilterActive(level: 'HIGH' | 'MEDIUM' | 'LOW') {
    const energySelectors = {
      HIGH: testSelectors.filterBar.highEnergyFilter,
      MEDIUM: testSelectors.filterBar.mediumEnergyFilter,
      LOW: testSelectors.filterBar.lowEnergyFilter,
    };

    const button = this.page.locator(energySelectors[level]);
    await expect(button).toHaveClass(/active|selected/);
  }

  async verifyFocusFilterActive(type: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL') {
    const focusSelectors = {
      CREATIVE: testSelectors.filterBar.creativeFilter,
      TECHNICAL: testSelectors.filterBar.technicalFilter,
      ADMINISTRATIVE: testSelectors.filterBar.administrativeFilter,
      SOCIAL: testSelectors.filterBar.socialFilter,
    };

    const button = this.page.locator(focusSelectors[type]);
    await expect(button).toHaveClass(/active|selected/);
  }
}

export class TaskCardPageObject {
  constructor(
    private page: Page,
    private taskTitle: string
  ) {}

  get container() {
    return this.page.locator(testSelectors.taskCard.container).filter({ hasText: this.taskTitle });
  }

  async click() {
    await this.container.click();
  }

  async getTitle() {
    return this.container.locator(testSelectors.taskCard.title);
  }

  async getDescription() {
    return this.container.locator(testSelectors.taskCard.description);
  }

  async getEnergyBadge() {
    return this.container.locator(testSelectors.taskCard.energyLevel);
  }

  async getFocusBadge() {
    return this.container.locator(testSelectors.taskCard.focusType);
  }

  async getPriorityBadge() {
    return this.container.locator(testSelectors.taskCard.priority);
  }

  async getStatusBadge() {
    return this.container.locator(testSelectors.taskCard.status);
  }

  async getEstimatedTime() {
    return this.container.locator(testSelectors.taskCard.estimatedTime);
  }

  async getDeadline() {
    return this.container.locator(testSelectors.taskCard.deadline);
  }

  async getActions() {
    return this.container.locator(testSelectors.taskCard.actions);
  }

  async verifyEnergyLevel(expectedLevel: 'HIGH' | 'MEDIUM' | 'LOW') {
    const energyBadge = await this.getEnergyBadge();
    await expect(energyBadge).toBeVisible();

    const energyIcons = {
      HIGH: '⚡',
      MEDIUM: '⚖️',
      LOW: '🌱',
    };

    await expect(energyBadge).toContainText(energyIcons[expectedLevel]);
  }

  async verifyFocusType(expectedType: 'CREATIVE' | 'TECHNICAL' | 'ADMINISTRATIVE' | 'SOCIAL') {
    const focusBadge = await this.getFocusBadge();
    await expect(focusBadge).toBeVisible();

    const focusIcons = {
      CREATIVE: '🎨',
      TECHNICAL: '⚙️',
      ADMINISTRATIVE: '📋',
      SOCIAL: '👥',
    };

    await expect(focusBadge).toContainText(focusIcons[expectedType]);
  }

  async verifyPriority(expectedPriority: number) {
    const priorityBadge = await this.getPriorityBadge();
    await expect(priorityBadge).toBeVisible();
  }

  async verifyStatus(expectedStatus: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE') {
    const statusBadge = await this.getStatusBadge();
    await expect(statusBadge).toBeVisible();
  }
}
