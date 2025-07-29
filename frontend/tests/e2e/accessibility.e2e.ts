import { test, expect } from '@playwright/test'
import { AccessibilityHelper, setupTestData, cleanupTestData } from '../fixtures/pageObjects'
import { testSelectors } from '../fixtures/taskData'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Features', () => {
  let a11yHelper: AccessibilityHelper

  test.beforeEach(async ({ page }) => {
    a11yHelper = new AccessibilityHelper(page)
    await setupTestData(page)
  })

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page)
  })

  test('dashboard meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/dashboard')
    
    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    expect(axeResults.violations).toEqual([])
  })

  test('keyboard navigation works throughout the application', async ({ page }) => {
    await page.goto('/dashboard')

    // Test keyboard navigation sequence
    const expectedTabStops = [
      'filter-search-input',
      'energy-filter',
      'focus-filter',
      'status-filter',
      'task-card-1',
      'task-card-2',
      'task-card-3',
      'new-task-button'
    ]

    await a11yHelper.verifyKeyboardNavigation('body', expectedTabStops)
  })

  test('screen reader announcements work correctly', async ({ page }) => {
    await page.goto('/dashboard')

    // Test live region announcements
    await page.getByRole('button', { name: /new task/i }).click()
    
    // Verify announcement for modal opening
    const announcement = page.locator('[aria-live="polite"]')
    await expect(announcement).toContainText('Task creation modal opened')

    // Test task completion announcement
    await page.locator('[data-testid="task-card"]').first().getByRole('button', { name: /complete/i }).click()
    await expect(announcement).toContainText('Task marked as completed')

    // Test filter application announcement
    await page.locator(testSelectors.filterBar.energyFilter).selectOption('high')
    await expect(announcement).toContainText('Showing 2 tasks with high energy level')
  })

  test('focus management in modal dialogs', async ({ page }) => {
    await page.goto('/dashboard')

    // Open task creation modal
    await page.getByRole('button', { name: /new task/i }).click()

    // Verify focus is moved to modal
    await expect(page.getByLabel(/task title/i)).toBeFocused()

    // Test focus trapping
    await a11yHelper.verifyFocusTrapping('[role="dialog"]')

    // Test escape key closes modal and returns focus
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
    await expect(page.getByRole('button', { name: /new task/i })).toBeFocused()
  })

  test('color contrast meets accessibility standards', async ({ page }) => {
    await page.goto('/dashboard')

    // Test color contrast using axe
    const axeResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze()

    expect(axeResults.violations).toEqual([])

    // Test specific ADHD color scheme
    const highEnergyBadge = page.locator('[data-energy="high"]')
    const mediumEnergyBadge = page.locator('[data-energy="medium"]')
    const lowEnergyBadge = page.locator('[data-energy="low"]')

    // Verify adequate contrast ratios are maintained
    await expect(highEnergyBadge).toHaveCSS('color', 'rgb(0, 0, 0)') // Dark text on green
    await expect(mediumEnergyBadge).toHaveCSS('color', 'rgb(0, 0, 0)') // Dark text on amber
    await expect(lowEnergyBadge).toHaveCSS('color', 'rgb(255, 255, 255)') // Light text on indigo
  })

  test('ARIA labels and descriptions are comprehensive', async ({ page }) => {
    await page.goto('/dashboard')

    // Verify task cards have proper ARIA labels
    const taskCards = page.locator('[data-testid="task-card"]')
    await expect(taskCards.first()).toHaveAttribute('aria-label', /High Energy Creative Task.*priority.*energy level/)

    // Verify filter controls have labels
    await a11yHelper.verifyAriaLabels([
      testSelectors.filterBar.searchInput,
      testSelectors.filterBar.energyFilter,
      testSelectors.filterBar.focusFilter,
      testSelectors.filterBar.statusFilter
    ])

    // Verify progress indicators have accessible descriptions
    const progressBar = page.locator('[role="progressbar"]').first()
    await expect(progressBar).toHaveAttribute('aria-label', /Task progress/)
    await expect(progressBar).toHaveAttribute('aria-valuenow')
    await expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    await expect(progressBar).toHaveAttribute('aria-valuemax', '100')
  })

  test('drag and drop works with keyboard', async ({ page }) => {
    await page.goto('/dashboard')

    // Navigate to daily planning
    await page.getByRole('button', { name: /daily planning/i }).click()

    // Focus on a draggable task
    const draggableTask = page.getByText('High Energy Creative Task')
    await draggableTask.focus()

    // Verify keyboard drag instructions
    await expect(page.getByText('Press space to start dragging')).toBeVisible()

    // Start keyboard drag
    await page.keyboard.press('Space')
    await expect(page.getByText('Dragging High Energy Creative Task')).toBeVisible()

    // Navigate to drop target
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    // Drop the task
    await page.keyboard.press('Space')
    await expect(page.getByText('Task moved to 10:00 AM slot')).toBeVisible()
  })

  test('reduced motion preferences are respected', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/dashboard')

    // Verify animations are disabled or reduced
    const taskCard = page.locator('[data-testid="task-card"]').first()
    await expect(taskCard).toHaveCSS('animation-duration', '0s')

    // Test drag and drop without animations
    await page.getByRole('button', { name: /daily planning/i }).click()
    const draggableTask = page.getByText('High Energy Creative Task')
    const dropZone = page.locator('[data-testid="time-slot"]').first()

    await draggableTask.dragTo(dropZone)
    
    // Verify immediate position change without animation
    await expect(dropZone.getByText('High Energy Creative Task')).toBeVisible()
  })

  test('high contrast mode compatibility', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' })
    await page.goto('/dashboard')

    // Verify forced colors are respected
    const taskCard = page.locator('[data-testid="task-card"]').first()
    
    // In forced colors mode, custom colors should be overridden
    const computedStyles = await taskCard.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        color: styles.color
      }
    })

    // Verify system colors are used instead of custom colors
    expect(computedStyles.backgroundColor).toMatch(/Canvas|ButtonFace/)
    expect(computedStyles.color).toMatch(/CanvasText|ButtonText/)
  })

  test('zoom and magnification support', async ({ page }) => {
    await page.goto('/dashboard')

    // Test 200% zoom level
    await page.setViewportSize({ width: 640, height: 480 }) // Simulate 200% zoom on 1280x960
    
    // Verify layout remains functional at high zoom
    await expect(page.getByRole('heading', { name: /helmsman dashboard/i })).toBeVisible()
    
    const taskCards = page.locator('[data-testid="task-card"]')
    await expect(taskCards.first()).toBeVisible()

    // Verify horizontal scrolling doesn't occur inappropriately
    const bodyScroll = await page.evaluate(() => document.body.scrollWidth > document.body.clientWidth)
    expect(bodyScroll).toBe(false)

    // Test 400% zoom level
    await page.setViewportSize({ width: 320, height: 240 }) // Simulate 400% zoom
    
    // Verify critical functionality remains accessible
    await expect(page.getByRole('button', { name: /new task/i })).toBeVisible()
  })

  test('alternative input methods support', async ({ page }) => {
    await page.goto('/dashboard')

    // Test voice control simulation (using keyboard shortcuts)
    await page.keyboard.press('Alt+n') // Should open new task
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.keyboard.press('Escape')

    // Test switch control simulation (single key navigation)
    await page.keyboard.press('Tab') // Should focus first interactive element
    await page.keyboard.press('Enter') // Should activate focused element

    // Verify switch navigation mode works
    await expect(page.locator(':focus')).toBeVisible()
  })

  test('error messages are accessible', async ({ page }) => {
    await page.goto('/dashboard')

    // Trigger a validation error
    await page.getByRole('button', { name: /new task/i }).click()
    await page.getByRole('button', { name: /save task/i }).click() // Submit without required fields

    // Verify error is announced to screen readers
    const errorMessage = page.locator('[role="alert"]')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText('Task title is required')

    // Verify focus moves to first error field
    await expect(page.getByLabel(/task title/i)).toBeFocused()

    // Verify error is associated with field
    const titleField = page.getByLabel(/task title/i)
    await expect(titleField).toHaveAttribute('aria-invalid', 'true')
    await expect(titleField).toHaveAttribute('aria-describedby')
  })

  test('loading states are accessible', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/tasks', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      })
    })

    await page.goto('/dashboard')

    // Verify loading indicator is announced
    const loadingIndicator = page.locator('[aria-live="polite"]')
    await expect(loadingIndicator).toContainText('Loading tasks')

    // Verify loading spinner has proper label
    const spinner = page.locator('[role="status"]')
    await expect(spinner).toHaveAttribute('aria-label', 'Loading tasks')

    // Wait for loading to complete
    await expect(loadingIndicator).toContainText('Tasks loaded')
  })
})

test.describe('ADHD-Specific Accessibility Features', () => {
  let a11yHelper: AccessibilityHelper

  test.beforeEach(async ({ page }) => {
    a11yHelper = new AccessibilityHelper(page)
    await setupTestData(page)
  })

  test('cognitive load indicators work correctly', async ({ page }) => {
    await page.goto('/dashboard')

    // Verify cognitive load warnings
    const complexTask = page.locator('[data-complexity="high"]')
    await expect(complexTask.getByText('High complexity task')).toBeVisible()
    await expect(complexTask).toHaveAttribute('aria-label', /Warning.*high complexity/)

    // Test cognitive load filtering
    await page.getByLabel(/show only low complexity/i).check()
    await expect(page.locator('[data-complexity="high"]')).not.toBeVisible()
    await expect(page.locator('[data-complexity="low"]')).toBeVisible()
  })

  test('energy level indicators are accessible', async ({ page }) => {
    await page.goto('/dashboard')

    // Verify energy level badges have proper semantics
    const highEnergyBadge = page.locator('[data-energy="high"]').first()
    await expect(highEnergyBadge).toHaveAttribute('role', 'status')
    await expect(highEnergyBadge).toHaveAttribute('aria-label', 'High energy level required')

    // Test energy-based filtering announcements
    await page.locator(testSelectors.filterBar.energyFilter).selectOption('high')
    const announcement = page.locator('[aria-live="polite"]')
    await expect(announcement).toContainText('Showing tasks requiring high energy levels')
  })

  test('focus time features are accessible', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /daily planning/i }).click()

    // Enable focus time mode
    await page.getByRole('button', { name: /focus time/i }).click()

    // Verify focus time blocks are properly labeled
    const focusBlock = page.locator('[data-testid="focus-block"]').first()
    await expect(focusBlock).toHaveAttribute('aria-label', /Focus time block.*90 minutes/)

    // Verify do not disturb indicator
    await expect(focusBlock.getByText('🔕')).toHaveAttribute('aria-label', 'Do not disturb active')

    // Test focus time announcements
    const announcement = page.locator('[aria-live="polite"]')
    await expect(announcement).toContainText('Focus time mode enabled')
  })

  test('overstimulation prevention features', async ({ page }) => {
    await page.goto('/dashboard')

    // Test reduced visual complexity mode
    await page.getByRole('button', { name: /accessibility settings/i }).click()
    await page.getByLabel(/reduce visual complexity/i).check()

    // Verify simplified interface
    await expect(page.locator('.gradient')).not.toBeVisible()
    await expect(page.locator('.shadow')).not.toBeVisible()

    // Test animation controls
    await page.getByLabel(/disable animations/i).check()
    const taskCard = page.locator('[data-testid="task-card"]').first()
    await expect(taskCard).toHaveCSS('animation', 'none')
  })

  test('task breakdown assistance is accessible', async ({ page }) => {
    await page.goto('/dashboard')

    // Select a complex task
    const complexTask = page.locator('[data-complexity="high"]').first()
    await complexTask.click()

    // Verify breakdown suggestion is accessible
    const breakdownSuggestion = page.locator('[data-testid="breakdown-suggestion"]')
    await expect(breakdownSuggestion).toHaveAttribute('aria-label', 'Task complexity assistance')
    
    // Test breakdown modal accessibility
    await page.getByRole('button', { name: /break down task/i }).click()
    
    const modal = page.getByRole('dialog', { name: /task breakdown/i })
    await expect(modal).toBeVisible()
    await expect(modal.getByLabel(/subtask 1/i)).toBeFocused()
  })
})
