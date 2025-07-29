import { Page, expect, Locator } from '@playwright/test'
import { mockTasks, mockTasksWithDependencies, mockLargeDashboardTasks, testSelectors } from './taskData'

export class DashboardPageObject {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard')
    await this.waitForLoad()
  }

  async waitForLoad() {
    await expect(this.page.getByRole('heading', { name: /helmsman dashboard/i })).toBeVisible()
    await this.page.waitForLoadState('networkidle')
  }

  // Task Grid interactions
  async getTaskCards() {
    return this.page.locator(testSelectors.taskCard.title).first()
  }

  async getTaskCard(taskTitle: string) {
    return this.page.locator(testSelectors.dashboard.taskCard).filter({ hasText: taskTitle })
  }

  async verifyTaskCardMetadata(taskTitle: string, expectedMetadata: any) {
    const taskCard = await this.getTaskCard(taskTitle)
    await expect(taskCard).toBeVisible()

    if (expectedMetadata.priority) {
      await expect(taskCard.locator(testSelectors.taskCard.priority)).toContainText(expectedMetadata.priority)
    }
    
    if (expectedMetadata.energyLevel) {
      await expect(taskCard.locator(testSelectors.taskCard.energyLevel)).toContainText(expectedMetadata.energyLevel)
    }
    
    if (expectedMetadata.focusType) {
      await expect(taskCard.locator(testSelectors.taskCard.focusType)).toContainText(expectedMetadata.focusType)
    }
  }

  // Filter interactions
  async openFilterBar() {
    const filterBar = this.page.locator(testSelectors.dashboard.filterBar)
    if (!(await filterBar.isVisible())) {
      await this.page.getByRole('button', { name: /filters/i }).click()
    }
  }

  async filterBySearch(searchTerm: string) {
    await this.openFilterBar()
    await this.page.locator(testSelectors.filterBar.searchInput).fill(searchTerm)
    await this.page.waitForTimeout(500) // Debounce delay
  }

  async filterByEnergyLevel(energyLevel: string) {
    await this.openFilterBar()
    await this.page.locator(testSelectors.filterBar.energyFilter).selectOption(energyLevel)
  }

  async filterByFocusType(focusType: string) {
    await this.openFilterBar()
    await this.page.locator(testSelectors.filterBar.focusFilter).selectOption(focusType)
  }

  async filterByStatus(status: string) {
    await this.openFilterBar()
    await this.page.locator(testSelectors.filterBar.statusFilter).selectOption(status)
  }

  async clearFilters() {
    await this.openFilterBar()
    await this.page.locator(testSelectors.filterBar.clearFilters).click()
  }

  // View mode switching
  async switchToFocusView() {
    await this.page.getByRole('button', { name: /focus view/i }).click()
    await expect(this.page.locator(testSelectors.dashboard.focusView)).toBeVisible()
  }

  async switchToGridView() {
    await this.page.getByRole('button', { name: /grid view/i }).click()
    await expect(this.page.locator(testSelectors.dashboard.taskGrid)).toBeVisible()
  }

  // Performance helpers
  async measureLoadTime(): Promise<number> {
    const startTime = Date.now()
    await this.goto()
    return Date.now() - startTime
  }

  async getTaskCount(): Promise<number> {
    return await this.page.locator(testSelectors.dashboard.taskCard).count()
  }
}

export class AIIntegrationPageObject {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard')
    // Look for AI integration component on dashboard
    await this.waitForAIComponent()
  }

  async waitForAIComponent() {
    await expect(this.page.locator(testSelectors.aiIntegration.textInput)).toBeVisible({ timeout: 10000 })
  }

  async extractTasksFromText(text: string) {
    await this.page.locator(testSelectors.aiIntegration.textInput).fill(text)
    await this.page.locator(testSelectors.aiIntegration.extractButton).click()
    
    // Wait for AI processing
    await this.page.waitForSelector(testSelectors.aiIntegration.suggestedTasks, { timeout: 15000 })
  }

  async getSuggestedTasks() {
    return this.page.locator(testSelectors.aiIntegration.suggestedTasks)
  }

  async acceptSuggestion(index: number) {
    await this.page.locator(testSelectors.aiIntegration.acceptSuggestion).nth(index).click()
  }

  async rejectSuggestion(index: number) {
    await this.page.locator(testSelectors.aiIntegration.rejectSuggestion).nth(index).click()
  }

  async verifyTaskExtraction(expectedTaskCount: number) {
    const suggestions = await this.getSuggestedTasks()
    await expect(suggestions.locator('[data-testid="suggested-task"]')).toHaveCount(expectedTaskCount)
  }
}

export class DailyPlanningPageObject {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard')
    // Navigate to daily planning section
    await this.page.getByRole('button', { name: /daily planning/i }).click()
    await this.waitForPlanningView()
  }

  async waitForPlanningView() {
    await expect(this.page.locator(testSelectors.dailyPlanning.planHeader)).toBeVisible()
  }

  async generateDailyPlan() {
    await this.page.locator(testSelectors.dailyPlanning.generatePlan).click()
    await this.page.waitForLoadState('networkidle')
  }

  async getTimeSlots() {
    return this.page.locator(testSelectors.dailyPlanning.timeSlot)
  }

  async getScheduledTasks() {
    return this.page.locator(testSelectors.dailyPlanning.scheduledTask)
  }

  async verifyEnergyMatching(timeSlot: string, expectedEnergyLevel: string) {
    const slot = this.page.locator(testSelectors.dailyPlanning.timeSlot).filter({ hasText: timeSlot })
    const energyIndicator = slot.locator(testSelectors.dailyPlanning.energyIndicator)
    await expect(energyIndicator).toContainText(expectedEnergyLevel)
  }

  async dragTaskToTimeSlot(taskTitle: string, timeSlot: string) {
    const task = this.page.getByText(taskTitle)
    const slot = this.page.locator(testSelectors.dailyPlanning.timeSlot).filter({ hasText: timeSlot })
    
    await task.dragTo(slot)
    await this.page.waitForTimeout(500) // Allow for drag animation
  }
}

export class AccessibilityHelper {
  constructor(private page: Page) {}

  async verifyKeyboardNavigation(startElement: string, expectedStops: string[]) {
    await this.page.locator(startElement).focus()
    
    for (const expectedStop of expectedStops) {
      await this.page.keyboard.press('Tab')
      const focused = await this.page.locator(':focus').getAttribute('data-testid')
      expect(focused).toBe(expectedStop)
    }
  }

  async verifyAriaLabels(selectors: string[]) {
    for (const selector of selectors) {
      const element = this.page.locator(selector)
      await expect(element).toHaveAttribute('aria-label', /.+/)
    }
  }

  async verifyColorContrast() {
    // This would typically use axe-playwright for automated contrast testing
    const axeResults = await this.page.evaluate(() => {
      // @ts-ignore - axe is injected by axe-playwright
      return axe.run()
    })
    
    const contrastViolations = axeResults.violations.filter(v => v.id === 'color-contrast')
    expect(contrastViolations).toHaveLength(0)
  }

  async verifyFocusTrapping(containerSelector: string) {
    const container = this.page.locator(containerSelector)
    const focusableElements = container.locator('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    
    const firstElement = focusableElements.first()
    const lastElement = focusableElements.last()
    
    // Focus last element and press Tab - should wrap to first
    await lastElement.focus()
    await this.page.keyboard.press('Tab')
    await expect(firstElement).toBeFocused()
    
    // Focus first element and press Shift+Tab - should wrap to last
    await firstElement.focus()
    await this.page.keyboard.press('Shift+Tab')
    await expect(lastElement).toBeFocused()
  }
}

export async function setupTestData(page: Page) {
  // Mock API responses for consistent testing
  await page.route('/api/tasks', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTasks)
    })
  })

  await page.route('/api/tasks/large-dataset', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockLargeDashboardTasks)
    })
  })

  await page.route('/api/tasks/dependencies', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTasksWithDependencies)
    })
  })
}

export async function cleanupTestData(page: Page) {
  // Clear any test data or reset state
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  
  // Reset any global state if needed
  await page.route('/api/**', route => route.continue())
}

export class PerformanceHelper {
  constructor(private page: Page) {}

  async measurePageLoadTime(url: string): Promise<number> {
    const startTime = Date.now()
    await this.page.goto(url)
    await this.page.waitForLoadState('networkidle')
    return Date.now() - startTime
  }

  async measureTaskRenderTime(taskCount: number): Promise<number> {
    await this.page.route('/api/tasks', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockLargeDashboardTasks.slice(0, taskCount))
      })
    })

    const startTime = Date.now()
    await this.page.reload()
    await this.page.waitForSelector(testSelectors.dashboard.taskCard, { timeout: 30000 })
    return Date.now() - startTime
  }

  async measureFilterResponseTime(filterAction: () => Promise<void>): Promise<number> {
    const startTime = Date.now()
    await filterAction()
    await this.page.waitForLoadState('networkidle')
    return Date.now() - startTime
  }
}
