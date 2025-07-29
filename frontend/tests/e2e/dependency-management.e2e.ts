import { test, expect } from '@playwright/test'
import { DashboardPageObject, setupTestData, cleanupTestData } from '../fixtures/pageObjects'
import { mockTasksWithDependencies, testSelectors } from '../fixtures/taskData'

test.describe('Dependency Management Features', () => {
  let dashboardPage: DashboardPageObject

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPageObject(page)
    
    // Setup test data with dependencies
    await page.route('/api/tasks', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTasksWithDependencies)
      })
    })

    await page.route('/api/tasks/*/dependencies', async route => {
      const taskId = route.request().url().split('/').slice(-2, -1)[0]
      const dependencies = mockTasksWithDependencies.find(t => t.id === taskId)?.dependsOn || []
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ dependencies })
      })
    })
  })

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page)
  })

  test('displays task dependencies visually', async ({ page }) => {
    await dashboardPage.goto()

    // Verify dependency visualization
    const taskWithDeps = page.locator('[data-testid="task-card"]').filter({ hasText: 'Create Database Schema' })
    
    // Should show dependency indicator
    await expect(taskWithDeps.locator('[data-testid="dependency-indicator"]')).toBeVisible()
    await expect(taskWithDeps.getByText('Depends on 1 task')).toBeVisible()

    // Verify blocked task indicators
    const blockedTask = page.locator('[data-testid="task-card"]').filter({ hasText: 'Implement API Endpoints' })
    await expect(blockedTask.locator('[data-testid="blocked-indicator"]')).toBeVisible()
    await expect(blockedTask).toHaveClass(/blocked/)
  })

  test('creates new task dependencies', async ({ page }) => {
    await dashboardPage.goto()

    // Open task creation modal
    await page.getByRole('button', { name: /new task/i }).click()

    // Fill basic task info
    await page.getByLabel(/task title/i).fill('New Dependent Task')
    await page.getByLabel(/description/i).fill('This task depends on other tasks')

    // Add dependencies
    await page.getByRole('button', { name: /add dependency/i }).click()
    
    // Search for dependency task
    await page.getByLabel(/search dependencies/i).fill('Setup Development')
    await page.getByText('Setup Development Environment').click()

    // Verify dependency is added
    await expect(page.getByText('Depends on: Setup Development Environment')).toBeVisible()

    // Add another dependency
    await page.getByRole('button', { name: /add another dependency/i }).click()
    await page.getByLabel(/search dependencies/i).fill('Database Schema')
    await page.getByText('Create Database Schema').click()

    // Save task with dependencies
    await page.getByRole('button', { name: /save task/i }).click()

    // Verify task appears with dependency indicators
    const newTask = page.locator('[data-testid="task-card"]').filter({ hasText: 'New Dependent Task' })
    await expect(newTask.getByText('Depends on 2 tasks')).toBeVisible()
    await expect(newTask).toHaveClass(/blocked/) // Should be blocked since dependencies aren't complete
  })

  test('dependency chain visualization', async ({ page }) => {
    await dashboardPage.goto()

    // Click on task with dependencies to view chain
    const dependentTask = page.locator('[data-testid="task-card"]').filter({ hasText: 'Implement API Endpoints' })
    await dependentTask.getByRole('button', { name: /view dependencies/i }).click()

    // Verify dependency chain modal
    const dependencyModal = page.getByRole('dialog', { name: /dependency chain/i })
    await expect(dependencyModal).toBeVisible()

    // Verify chain visualization
    await expect(dependencyModal.getByText('Setup Development Environment')).toBeVisible()
    await expect(dependencyModal.getByText('Create Database Schema')).toBeVisible()
    await expect(dependencyModal.getByText('Implement API Endpoints')).toBeVisible()

    // Verify status indicators in chain
    await expect(dependencyModal.locator('[data-status="completed"]')).toHaveCount(1)
    await expect(dependencyModal.locator('[data-status="in-progress"]')).toHaveCount(1)
    await expect(dependencyModal.locator('[data-status="blocked"]')).toHaveCount(1)

    // Verify dependency arrows/lines
    await expect(dependencyModal.locator('.dependency-line')).toHaveCount(2)
  })

  test('automatic task unblocking when dependencies complete', async ({ page }) => {
    await dashboardPage.goto()

    // Find the in-progress dependency task
    const dependencyTask = page.locator('[data-testid="task-card"]').filter({ hasText: 'Create Database Schema' })
    
    // Complete the dependency
    await dependencyTask.getByRole('button', { name: /complete task/i }).click()
    await page.getByRole('button', { name: /confirm completion/i }).click()

    // Verify dependent task is now unblocked
    const dependentTask = page.locator('[data-testid="task-card"]').filter({ hasText: 'Implement API Endpoints' })
    await expect(dependentTask).not.toHaveClass(/blocked/)
    await expect(dependentTask.locator('[data-testid="blocked-indicator"]')).not.toBeVisible()

    // Verify status changed to available
    await expect(dependentTask.locator('[data-testid="task-status"]')).toContainText('pending')
    
    // Verify notification about unblocking
    await expect(page.getByText('Task "Implement API Endpoints" is now available')).toBeVisible()
  })

  test('prevents circular dependencies', async ({ page }) => {
    await dashboardPage.goto()

    // Try to create circular dependency
    const taskA = page.locator('[data-testid="task-card"]').filter({ hasText: 'Setup Development Environment' })
    await taskA.getByRole('button', { name: /edit/i }).click()

    // Try to add a task that would create a circle
    await page.getByRole('button', { name: /add dependency/i }).click()
    await page.getByLabel(/search dependencies/i).fill('Implement API')
    await page.getByText('Implement API Endpoints').click()

    // Verify circular dependency warning
    await expect(page.getByText('Circular dependency detected')).toBeVisible()
    await expect(page.getByText('This would create a dependency loop')).toBeVisible()

    // Verify save button is disabled
    await expect(page.getByRole('button', { name: /save changes/i })).toBeDisabled()

    // Remove the circular dependency
    await page.getByRole('button', { name: /remove dependency/i }).click()
    await expect(page.getByRole('button', { name: /save changes/i })).toBeEnabled()
  })

  test('dependency impact analysis', async ({ page }) => {
    await dashboardPage.goto()

    // Select a task with many dependents
    const foundationTask = page.locator('[data-testid="task-card"]').filter({ hasText: 'Setup Development Environment' })
    await foundationTask.getByRole('button', { name: /view impact/i }).click()

    // Verify impact analysis modal
    const impactModal = page.getByRole('dialog', { name: /dependency impact/i })
    await expect(impactModal).toBeVisible()

    // Verify impact metrics
    await expect(impactModal.getByText('2 tasks depend on this')).toBeVisible()
    await expect(impactModal.getByText('Blocking 1 task currently')).toBeVisible()

    // Verify list of affected tasks
    await expect(impactModal.getByText('Create Database Schema')).toBeVisible()
    await expect(impactModal.getByText('Implement API Endpoints')).toBeVisible()

    // Test impact of deleting
    await page.getByRole('button', { name: /delete task/i }).click()
    await expect(page.getByText('Warning: Deleting this task will affect 2 other tasks')).toBeVisible()
    await expect(page.getByText('These tasks will need new dependencies')).toBeVisible()
  })

  test('bulk dependency operations', async ({ page }) => {
    await dashboardPage.goto()

    // Select multiple tasks
    await page.getByRole('checkbox', { name: /select task/i }).first().check()
    await page.getByRole('checkbox', { name: /select task/i }).nth(1).check()

    // Open bulk operations menu
    await page.getByRole('button', { name: /bulk actions/i }).click()

    // Add common dependency to all selected
    await page.getByRole('button', { name: /add dependency to all/i }).click()
    await page.getByLabel(/search dependencies/i).fill('Setup Development')
    await page.getByText('Setup Development Environment').click()
    await page.getByRole('button', { name: /apply to selected/i }).click()

    // Verify dependencies were added
    const selectedTasks = page.locator('[data-testid="task-card"] input[type="checkbox"]:checked').locator('..')
    await expect(selectedTasks.first().getByText('Depends on')).toBeVisible()
    await expect(selectedTasks.nth(1).getByText('Depends on')).toBeVisible()
  })

  test('dependency scheduling conflicts', async ({ page }) => {
    await dashboardPage.goto()

    // Navigate to daily planning
    await page.getByRole('button', { name: /daily planning/i }).click()

    // Try to schedule a blocked task
    const blockedTask = page.getByText('Implement API Endpoints')
    const timeSlot = page.locator('[data-testid="time-slot"]').filter({ hasText: '09:00' })
    
    await blockedTask.dragTo(timeSlot)

    // Verify dependency warning
    await expect(page.getByText('Cannot schedule blocked task')).toBeVisible()
    await expect(page.getByText('Complete dependencies first')).toBeVisible()

    // Show dependency requirements
    await expect(page.getByText('Required: Create Database Schema')).toBeVisible()
    
    // Verify task was not scheduled
    await expect(timeSlot.getByText('Implement API Endpoints')).not.toBeVisible()
  })

  test('critical path analysis', async ({ page }) => {
    await dashboardPage.goto()

    // Open project analysis
    await page.getByRole('button', { name: /project analysis/i }).click()

    // Verify critical path is highlighted
    await expect(page.getByText('Critical Path Analysis')).toBeVisible()
    
    // Verify critical path tasks are identified
    const criticalTasks = page.locator('.critical-path-task')
    await expect(criticalTasks).toHaveCount(3) // All tasks in the chain

    // Verify delay impact warnings
    await expect(page.getByText('Delays in critical path will affect project completion')).toBeVisible()
    
    // Show completion timeline
    await expect(page.getByText('Estimated completion: 5 days')).toBeVisible()
    
    // Test what-if scenario
    await page.getByRole('button', { name: /simulate delay/i }).click()
    await page.getByLabel(/delay days/i).fill('2')
    await page.getByRole('button', { name: /calculate impact/i }).click()
    
    await expect(page.getByText('New completion: 7 days')).toBeVisible()
  })

  test('dependency conflict resolution', async ({ page }) => {
    await dashboardPage.goto()

    // Create a dependency conflict scenario
    await page.getByRole('button', { name: /new task/i }).click()
    await page.getByLabel(/task title/i).fill('Conflicting Task')
    
    // Try to add a dependency that would create conflict
    await page.getByRole('button', { name: /add dependency/i }).click()
    await page.getByLabel(/search dependencies/i).fill('Implement API')
    await page.getByText('Implement API Endpoints').click()
    
    // Also add an earlier dependency
    await page.getByRole('button', { name: /add another dependency/i }).click()
    await page.getByLabel(/search dependencies/i).fill('Setup Development')
    await page.getByText('Setup Development Environment').click()

    await page.getByRole('button', { name: /save task/i }).click()

    // System should resolve the redundant dependency
    const newTask = page.locator('[data-testid="task-card"]').filter({ hasText: 'Conflicting Task' })
    await newTask.getByRole('button', { name: /view dependencies/i }).click()

    // Should show only direct dependencies, not redundant ones
    const dependencyModal = page.getByRole('dialog', { name: /dependency chain/i })
    await expect(dependencyModal.getByText('Optimized dependencies')).toBeVisible()
    await expect(dependencyModal.getByText('Removed redundant: Setup Development Environment')).toBeVisible()
  })

  test('dependency templates and presets', async ({ page }) => {
    await dashboardPage.goto()

    // Open dependency templates
    await page.getByRole('button', { name: /dependency templates/i }).click()

    // Verify common templates are available
    await expect(page.getByText('Frontend Development Flow')).toBeVisible()
    await expect(page.getByText('Database Migration Process')).toBeVisible()
    await expect(page.getByText('API Development Cycle')).toBeVisible()

    // Apply a template
    await page.getByRole('button', { name: /apply template/i }).first().click()
    
    // Select tasks to apply template to
    await page.getByLabel(/select tasks for template/i).click()
    await page.getByText('Create Database Schema').click()
    await page.getByText('Implement API Endpoints').click()
    
    await page.getByRole('button', { name: /apply template/i }).click()

    // Verify template was applied
    await expect(page.getByText('Template applied successfully')).toBeVisible()
    await expect(page.getByText('2 dependency relationships created')).toBeVisible()
  })
})

test.describe('Dependency Management Error Handling', () => {
  test('handles invalid dependency operations', async ({ page }) => {
    await page.goto('/dashboard')

    // Try to add dependency to non-existent task
    await page.route('/api/tasks/invalid-id/dependencies', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Task not found' })
      })
    })

    await page.getByRole('button', { name: /new task/i }).click()
    await page.getByLabel(/task title/i).fill('Test Task')
    await page.getByRole('button', { name: /add dependency/i }).click()
    
    // Type invalid task name
    await page.getByLabel(/search dependencies/i).fill('Non-existent Task')
    
    // Verify error handling
    await expect(page.getByText('No matching tasks found')).toBeVisible()
    await expect(page.getByText('Check task name and try again')).toBeVisible()
  })

  test('handles dependency service failures', async ({ page }) => {
    // Mock service failure
    await page.route('/api/dependencies/**', async route => {
      await route.fulfill({ status: 500 })
    })

    await page.goto('/dashboard')

    // Try to view dependencies
    const taskCard = page.locator('[data-testid="task-card"]').first()
    await taskCard.getByRole('button', { name: /view dependencies/i }).click()

    // Verify graceful error handling
    await expect(page.getByText('Unable to load dependencies')).toBeVisible()
    await expect(page.getByText('Dependency service temporarily unavailable')).toBeVisible()
    
    // Verify fallback options
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /continue without dependencies/i })).toBeVisible()
  })
})
