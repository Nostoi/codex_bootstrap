import { test, expect } from '@playwright/test'
import { DashboardPageObject, setupTestData, cleanupTestData } from '../fixtures/pageObjects'
import { mockTasks, testSelectors } from '../fixtures/taskData'

test.describe('Task Metadata Display and Interaction', () => {
  let dashboardPage: DashboardPageObject

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPageObject(page)
    await setupTestData(page)
  })

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page)
  })

  test('displays all task metadata fields correctly', async ({ page }) => {
    await dashboardPage.goto()

    // Verify high energy creative task
    await dashboardPage.verifyTaskCardMetadata('High Energy Creative Task', {
      priority: 'high',
      energyLevel: 'high',
      focusType: 'creative'
    })

    // Verify task card shows deadline
    const creativeTaskCard = await dashboardPage.getTaskCard('High Energy Creative Task')
    await expect(creativeTaskCard.locator(testSelectors.taskCard.deadline)).toContainText('Jan 15')
    
    // Verify estimated duration is displayed
    await expect(creativeTaskCard.locator(testSelectors.taskCard.duration)).toContainText('2h')
    
    // Verify complexity indicator
    await expect(creativeTaskCard.locator(testSelectors.taskCard.complexity)).toContainText('8/10')
  })

  test('task creation with metadata fields', async ({ page }) => {
    await dashboardPage.goto()

    // Click create new task button
    await page.getByRole('button', { name: /new task/i }).click()

    // Fill in basic task information
    await page.getByLabel(/task title/i).fill('Test Task with Metadata')
    await page.getByLabel(/description/i).fill('A comprehensive test task with all metadata fields')

    // Set metadata fields
    await page.getByLabel(/priority/i).selectOption('high')
    await page.getByLabel(/energy level/i).selectOption('medium')
    await page.getByLabel(/focus type/i).selectOption('analytical')
    
    // Set deadline
    await page.getByLabel(/deadline/i).fill('2025-01-20')
    
    // Set estimated duration (in minutes)
    await page.getByLabel(/estimated duration/i).fill('90')
    
    // Set complexity using slider or input
    await page.getByLabel(/complexity/i).fill('6')

    // Save the task
    await page.getByRole('button', { name: /save task/i }).click()

    // Verify the task appears in the task list with correct metadata
    await expect(page.getByText('Test Task with Metadata')).toBeVisible()
    
    await dashboardPage.verifyTaskCardMetadata('Test Task with Metadata', {
      priority: 'high',
      energyLevel: 'medium',
      focusType: 'analytical'
    })
  })

  test('task metadata editing and updates', async ({ page }) => {
    await dashboardPage.goto()

    // Find and click edit on an existing task
    const taskCard = await dashboardPage.getTaskCard('Medium Energy Analysis Task')
    await taskCard.getByRole('button', { name: /edit/i }).click()

    // Modify metadata fields
    await page.getByLabel(/priority/i).selectOption('high')
    await page.getByLabel(/energy level/i).selectOption('high')
    await page.getByLabel(/complexity/i).fill('8')

    // Save changes
    await page.getByRole('button', { name: /save changes/i }).click()

    // Verify updated metadata is displayed
    await dashboardPage.verifyTaskCardMetadata('Medium Energy Analysis Task', {
      priority: 'high',
      energyLevel: 'high'
    })

    // Verify complexity was updated
    const updatedCard = await dashboardPage.getTaskCard('Medium Energy Analysis Task')
    await expect(updatedCard.locator(testSelectors.taskCard.complexity)).toContainText('8/10')
  })

  test('energy level color coding', async ({ page }) => {
    await dashboardPage.goto()

    // Verify high energy tasks have green styling
    const highEnergyTask = await dashboardPage.getTaskCard('High Energy Creative Task')
    const highEnergyBadge = highEnergyTask.locator(testSelectors.taskCard.energyLevel)
    await expect(highEnergyBadge).toHaveClass(/bg-green/)

    // Verify medium energy tasks have amber styling
    const mediumEnergyTask = await dashboardPage.getTaskCard('Medium Energy Analysis Task')
    const mediumEnergyBadge = mediumEnergyTask.locator(testSelectors.taskCard.energyLevel)
    await expect(mediumEnergyBadge).toHaveClass(/bg-amber/)

    // Verify low energy tasks have indigo styling
    const lowEnergyTask = await dashboardPage.getTaskCard('Low Energy Administrative Task')
    const lowEnergyBadge = lowEnergyTask.locator(testSelectors.taskCard.energyLevel)
    await expect(lowEnergyBadge).toHaveClass(/bg-indigo/)
  })

  test('priority indicators and sorting', async ({ page }) => {
    await dashboardPage.goto()

    // Verify priority badges are displayed correctly
    const highPriorityTask = await dashboardPage.getTaskCard('High Priority Technical Debugging')
    await expect(highPriorityTask.locator(testSelectors.taskCard.priority)).toHaveClass(/bg-red/)

    // Test priority sorting
    await page.getByRole('button', { name: /sort by priority/i }).click()

    // Verify high priority tasks appear first
    const firstTask = page.locator(testSelectors.dashboard.taskCard).first()
    await expect(firstTask.locator(testSelectors.taskCard.priority)).toContainText('high')
  })

  test('focus type icons and descriptions', async ({ page }) => {
    await dashboardPage.goto()

    // Verify focus type icons are displayed
    const analyticalTask = await dashboardPage.getTaskCard('Medium Energy Analysis Task')
    const analyticalIcon = analyticalTask.locator(testSelectors.taskCard.focusType)
    await expect(analyticalIcon).toHaveAttribute('data-focus-type', 'analytical')

    const creativeTask = await dashboardPage.getTaskCard('High Energy Creative Task')
    const creativeIcon = creativeTask.locator(testSelectors.taskCard.focusType)
    await expect(creativeIcon).toHaveAttribute('data-focus-type', 'creative')

    // Verify focus type tooltips
    await analyticalIcon.hover()
    await expect(page.getByText('Analytical tasks require logical thinking and data analysis')).toBeVisible()
  })

  test('deadline indicators and overdue warnings', async ({ page }) => {
    // Mock current date to test overdue functionality
    await page.addInitScript(() => {
      const mockDate = new Date('2025-01-16T10:00:00Z')
      Date.now = () => mockDate.getTime()
    })

    await dashboardPage.goto()

    // Find task with deadline in the past (should be overdue)
    const overdueTask = await dashboardPage.getTaskCard('Medium Energy Analysis Task') // Deadline: Jan 10
    const deadlineBadge = overdueTask.locator(testSelectors.taskCard.deadline)
    
    // Verify overdue styling
    await expect(deadlineBadge).toHaveClass(/text-red/)
    await expect(deadlineBadge).toContainText('overdue')

    // Verify upcoming deadline styling
    const upcomingTask = await dashboardPage.getTaskCard('High Energy Creative Task') // Deadline: Jan 15
    const upcomingDeadline = upcomingTask.locator(testSelectors.taskCard.deadline)
    await expect(upcomingDeadline).toHaveClass(/text-amber/)
  })

  test('task complexity visualization', async ({ page }) => {
    await dashboardPage.goto()

    // Verify complexity is shown as a visual indicator
    const complexTask = await dashboardPage.getTaskCard('High Priority Technical Debugging')
    const complexityIndicator = complexTask.locator(testSelectors.taskCard.complexity)
    
    // Should show complexity as a progress bar or number
    await expect(complexityIndicator).toContainText('9/10')
    
    // High complexity tasks should have visual emphasis
    await expect(complexityIndicator).toHaveClass(/high-complexity/)

    // Low complexity task for comparison
    const simpleTask = await dashboardPage.getTaskCard('Low Energy Administrative Task')
    const simpleComplexity = simpleTask.locator(testSelectors.taskCard.complexity)
    await expect(simpleComplexity).toContainText('3/10')
  })

  test('task status workflows', async ({ page }) => {
    await dashboardPage.goto()

    // Test status change from pending to in-progress
    const pendingTask = await dashboardPage.getTaskCard('High Energy Creative Task')
    await pendingTask.getByRole('button', { name: /start task/i }).click()
    
    // Verify status updated
    await expect(pendingTask.locator('[data-testid="task-status"]')).toContainText('in-progress')

    // Test marking task as blocked
    await pendingTask.getByRole('button', { name: /mark blocked/i }).click()
    await page.getByLabel(/block reason/i).fill('Waiting for design approval')
    await page.getByRole('button', { name: /confirm block/i }).click()

    // Verify blocked status and reason
    await expect(pendingTask.locator('[data-testid="task-status"]')).toContainText('blocked')
    await expect(pendingTask.getByText('Waiting for design approval')).toBeVisible()

    // Test completing task
    const inProgressTask = await dashboardPage.getTaskCard('Medium Energy Analysis Task')
    await inProgressTask.getByRole('button', { name: /complete task/i }).click()
    
    // Verify completed status
    await expect(inProgressTask.locator('[data-testid="task-status"]')).toContainText('completed')
  })

  test('metadata validation and error handling', async ({ page }) => {
    await dashboardPage.goto()

    // Try to create task with invalid metadata
    await page.getByRole('button', { name: /new task/i }).click()

    // Fill minimal required fields
    await page.getByLabel(/task title/i).fill('Invalid Metadata Test')

    // Try invalid deadline format
    await page.getByLabel(/deadline/i).fill('invalid-date')
    await page.getByRole('button', { name: /save task/i }).click()

    // Verify validation error
    await expect(page.getByText('Please enter a valid deadline')).toBeVisible()

    // Try invalid duration
    await page.getByLabel(/deadline/i).fill('2025-01-20')
    await page.getByLabel(/estimated duration/i).fill('-10')
    await page.getByRole('button', { name: /save task/i }).click()

    await expect(page.getByText('Duration must be a positive number')).toBeVisible()

    // Try invalid complexity
    await page.getByLabel(/estimated duration/i).fill('60')
    await page.getByLabel(/complexity/i).fill('15') // Should be 1-10
    await page.getByRole('button', { name: /save task/i }).click()

    await expect(page.getByText('Complexity must be between 1 and 10')).toBeVisible()
  })

  test('bulk metadata operations', async ({ page }) => {
    await dashboardPage.goto()

    // Select multiple tasks
    await page.getByRole('checkbox', { name: /select task/i }).first().check()
    await page.getByRole('checkbox', { name: /select task/i }).nth(1).check()

    // Bulk edit metadata
    await page.getByRole('button', { name: /bulk edit/i }).click()
    
    // Change priority for all selected tasks
    await page.getByLabel(/priority/i).selectOption('high')
    await page.getByRole('button', { name: /apply to selected/i }).click()

    // Verify both tasks now have high priority
    const firstSelectedTask = page.locator(testSelectors.dashboard.taskCard).first()
    const secondSelectedTask = page.locator(testSelectors.dashboard.taskCard).nth(1)
    
    await expect(firstSelectedTask.locator(testSelectors.taskCard.priority)).toContainText('high')
    await expect(secondSelectedTask.locator(testSelectors.taskCard.priority)).toContainText('high')
  })
})

test.describe('Task Metadata Filtering and Search', () => {
  let dashboardPage: DashboardPageObject

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPageObject(page)
    await setupTestData(page)
  })

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page)
  })

  test('metadata-based filtering works correctly', async ({ page }) => {
    await dashboardPage.goto()

    // Filter by energy level
    await dashboardPage.filterByEnergyLevel('high')
    
    // Verify only high energy tasks are shown
    const visibleTasks = page.locator(testSelectors.dashboard.taskCard)
    await expect(visibleTasks).toHaveCount(2) // Only high energy tasks

    // Filter by focus type
    await dashboardPage.filterByFocusType('technical')
    
    // Should show only high energy + technical tasks
    await expect(visibleTasks).toHaveCount(1)
    await expect(page.getByText('High Priority Technical Debugging')).toBeVisible()

    // Clear filters
    await dashboardPage.clearFilters()
    await expect(visibleTasks.first()).toBeVisible()
  })

  test('metadata search functionality', async ({ page }) => {
    await dashboardPage.goto()

    // Search by metadata keywords
    await dashboardPage.filterBySearch('creative')
    
    // Should find tasks with creative focus type or creative in description
    const searchResults = page.locator(testSelectors.dashboard.taskCard)
    await expect(searchResults).toHaveCount(1)
    await expect(page.getByText('High Energy Creative Task')).toBeVisible()

    // Search by deadline date
    await dashboardPage.filterBySearch('January 15')
    await expect(page.getByText('High Energy Creative Task')).toBeVisible()

    // Search by complexity
    await dashboardPage.filterBySearch('complexity:9')
    await expect(page.getByText('High Priority Technical Debugging')).toBeVisible()
  })
})
