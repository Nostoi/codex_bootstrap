import { test, expect } from '@playwright/test'
import { DailyPlanningPageObject, setupTestData, cleanupTestData } from '../fixtures/pageObjects'
import { mockDailyPlans, testSelectors } from '../fixtures/taskData'

test.describe('Daily Planning Features', () => {
  let planningPage: DailyPlanningPageObject

  test.beforeEach(async ({ page }) => {
    planningPage = new DailyPlanningPageObject(page)
    await setupTestData(page)
    
    // Mock daily planning API
    await page.route('/api/plans/daily', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDailyPlans[0])
      })
    })

    await page.route('/api/plans/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          plan: mockDailyPlans[0] 
        })
      })
    })
  })

  test.afterEach(async ({ page }) => {
    await cleanupTestData(page)
  })

  test('displays daily planning interface', async ({ page }) => {
    await planningPage.goto()

    // Verify planning header
    await expect(page.locator(testSelectors.dailyPlanning.planHeader)).toBeVisible()
    await expect(page.getByRole('heading', { name: /daily planning/i })).toBeVisible()

    // Verify time slots are displayed
    const timeSlots = await planningPage.getTimeSlots()
    await expect(timeSlots).toHaveCountGreaterThan(8) // Full workday

    // Verify energy indicators
    await expect(page.locator(testSelectors.dailyPlanning.energyIndicator)).toHaveCountGreaterThan(0)
  })

  test('generates daily plan based on energy patterns', async ({ page }) => {
    await planningPage.goto()

    // Click generate plan button
    await planningPage.generateDailyPlan()

    // Verify plan was generated
    await expect(page.getByText('Plan generated successfully')).toBeVisible()

    // Verify tasks are scheduled in appropriate time slots
    const scheduledTasks = await planningPage.getScheduledTasks()
    await expect(scheduledTasks).toHaveCountGreaterThan(0)

    // Verify high-energy tasks are scheduled in morning slots
    await planningPage.verifyEnergyMatching('09:00', 'high')
    await expect(page.getByText('High Energy Creative Task')).toBeVisible()

    // Verify medium-energy tasks in afternoon
    await planningPage.verifyEnergyMatching('14:00', 'medium')
    await expect(page.getByText('Medium Energy Analysis Task')).toBeVisible()

    // Verify low-energy tasks in later slots
    await planningPage.verifyEnergyMatching('16:00', 'low')
    await expect(page.getByText('Low Energy Administrative Task')).toBeVisible()
  })

  test('manual task scheduling with drag and drop', async ({ page }) => {
    await planningPage.goto()

    // Drag a task to a time slot
    await planningPage.dragTaskToTimeSlot('High Energy Creative Task', '10:00')

    // Verify task appears in the time slot
    const timeSlot = page.locator(testSelectors.dailyPlanning.timeSlot).filter({ hasText: '10:00' })
    await expect(timeSlot.getByText('High Energy Creative Task')).toBeVisible()

    // Verify task was removed from unscheduled list
    const unscheduledSection = page.locator('[data-testid="unscheduled-tasks"]')
    await expect(unscheduledSection.getByText('High Energy Creative Task')).not.toBeVisible()
  })

  test('time slot conflict detection', async ({ page }) => {
    await planningPage.goto()

    // Schedule a task in a time slot
    await planningPage.dragTaskToTimeSlot('High Energy Creative Task', '09:00')

    // Try to schedule another task in the same slot
    await planningPage.dragTaskToTimeSlot('Medium Energy Analysis Task', '09:00')

    // Verify conflict warning
    await expect(page.getByText('Time slot conflict detected')).toBeVisible()
    await expect(page.getByText('This slot already has a scheduled task')).toBeVisible()

    // Verify user can choose to overlap or reschedule
    await expect(page.getByRole('button', { name: /overlap tasks/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /reschedule/i })).toBeVisible()
  })

  test('energy level matching recommendations', async ({ page }) => {
    await planningPage.goto()

    // Hover over a high-energy time slot
    const morningSlot = page.locator(testSelectors.dailyPlanning.timeSlot).filter({ hasText: '09:00' })
    await morningSlot.hover()

    // Verify energy recommendation tooltip
    await expect(page.getByText('Optimal for high-energy tasks')).toBeVisible()
    await expect(page.getByText('Creative and analytical work')).toBeVisible()

    // Test dropping a mismatched task
    await planningPage.dragTaskToTimeSlot('Low Energy Administrative Task', '09:00')

    // Verify energy mismatch warning
    await expect(page.getByText('Energy level mismatch')).toBeVisible()
    await expect(page.getByText('This task has low energy requirements')).toBeVisible()
  })

  test('schedule optimization suggestions', async ({ page }) => {
    await planningPage.goto()
    await planningPage.generateDailyPlan()

    // Click optimize schedule button
    await page.getByRole('button', { name: /optimize schedule/i }).click()

    // Verify optimization suggestions
    await expect(page.getByText('Schedule Optimization Suggestions')).toBeVisible()
    
    // Check for specific optimization recommendations
    await expect(page.getByText('Move high-complexity tasks to high-energy periods')).toBeVisible()
    await expect(page.getByText('Group similar focus types together')).toBeVisible()
    await expect(page.getByText('Add breaks between intensive tasks')).toBeVisible()

    // Apply optimization
    await page.getByRole('button', { name: /apply optimization/i }).click()

    // Verify schedule was optimized
    await expect(page.getByText('Schedule optimized successfully')).toBeVisible()
  })

  test('break scheduling and work-life balance', async ({ page }) => {
    await planningPage.goto()

    // Verify breaks are automatically scheduled
    await planningPage.generateDailyPlan()

    const breakSlots = page.locator('[data-testid="break-slot"]')
    await expect(breakSlots).toHaveCountGreaterThan(2) // Morning, lunch, afternoon breaks

    // Verify break recommendations
    await expect(page.getByText('15-min break')).toBeVisible()
    await expect(page.getByText('Lunch break')).toBeVisible()

    // Test manual break scheduling
    await page.getByRole('button', { name: /add break/i }).click()
    await page.getByLabel(/break duration/i).fill('10')
    await page.getByLabel(/break time/i).fill('15:30')
    await page.getByRole('button', { name: /schedule break/i }).click()

    // Verify break was added
    const customBreak = page.locator(testSelectors.dailyPlanning.timeSlot).filter({ hasText: '15:30' })
    await expect(customBreak.getByText('10-min break')).toBeVisible()
  })

  test('daily plan persistence and editing', async ({ page }) => {
    await planningPage.goto()
    await planningPage.generateDailyPlan()

    // Schedule some tasks manually
    await planningPage.dragTaskToTimeSlot('High Energy Creative Task', '10:00')
    await planningPage.dragTaskToTimeSlot('Medium Energy Analysis Task', '14:00')

    // Save the plan
    await page.getByRole('button', { name: /save plan/i }).click()
    await expect(page.getByText('Plan saved successfully')).toBeVisible()

    // Reload the page
    await page.reload()
    await planningPage.waitForPlanningView()

    // Verify saved plan is restored
    const slot10 = page.locator(testSelectors.dailyPlanning.timeSlot).filter({ hasText: '10:00' })
    await expect(slot10.getByText('High Energy Creative Task')).toBeVisible()

    const slot14 = page.locator(testSelectors.dailyPlanning.timeSlot).filter({ hasText: '14:00' })
    await expect(slot14.getByText('Medium Energy Analysis Task')).toBeVisible()
  })

  test('calendar integration and external events', async ({ page }) => {
    // Mock external calendar events
    await page.route('/api/calendar/events', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'cal-1',
            title: 'Team Standup',
            start: '2025-01-15T09:30:00Z',
            end: '2025-01-15T10:00:00Z',
            source: 'google'
          },
          {
            id: 'cal-2',
            title: 'Client Meeting',
            start: '2025-01-15T15:00:00Z',
            end: '2025-01-15T16:00:00Z',
            source: 'outlook'
          }
        ])
      })
    })

    await planningPage.goto()

    // Verify external calendar events are displayed
    await expect(page.getByText('Team Standup')).toBeVisible()
    await expect(page.getByText('Client Meeting')).toBeVisible()

    // Verify calendar events are marked as non-editable
    const externalEvent = page.getByText('Team Standup').locator('..')
    await expect(externalEvent).toHaveClass(/external-event/)
    await expect(externalEvent).toHaveAttribute('data-editable', 'false')

    // Generate plan considering external events
    await planningPage.generateDailyPlan()

    // Verify tasks are scheduled around external events
    const conflictSlot = page.locator(testSelectors.dailyPlanning.timeSlot).filter({ hasText: '09:30' })
    await expect(conflictSlot.getByText('Team Standup')).toBeVisible()
    
    // Verify no tasks are scheduled during external events
    await expect(conflictSlot.locator(testSelectors.dailyPlanning.scheduledTask)).toHaveCount(1) // Only the external event
  })

  test('focus time and deep work scheduling', async ({ page }) => {
    await planningPage.goto()

    // Enable focus time mode
    await page.getByRole('button', { name: /focus time/i }).click()

    // Configure focus time preferences
    await page.getByLabel(/minimum focus duration/i).fill('90')
    await page.getByLabel(/maximum interruptions/i).fill('1')
    await page.getByRole('button', { name: /apply focus settings/i }).click()

    await planningPage.generateDailyPlan()

    // Verify focus blocks are created
    const focusBlocks = page.locator('[data-testid="focus-block"]')
    await expect(focusBlocks).toHaveCountGreaterThan(0)

    // Verify focus block duration
    const firstFocusBlock = focusBlocks.first()
    await expect(firstFocusBlock).toHaveAttribute('data-duration', '90')

    // Verify notifications are disabled during focus time
    await expect(firstFocusBlock.getByText('🔕 Do not disturb')).toBeVisible()
  })
})

test.describe('Daily Planning Performance and Error Handling', () => {
  let planningPage: DailyPlanningPageObject

  test.beforeEach(async ({ page }) => {
    planningPage = new DailyPlanningPageObject(page)
  })

  test('handles API failures gracefully', async ({ page }) => {
    // Mock API failure for plan generation
    await page.route('/api/plans/generate', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Plan generation failed' })
      })
    })

    await planningPage.goto()
    await planningPage.generateDailyPlan()

    // Verify error handling
    await expect(page.getByText('Failed to generate plan')).toBeVisible()
    await expect(page.getByText('Please try again or create a manual schedule')).toBeVisible()

    // Verify fallback to manual scheduling
    await expect(page.getByRole('button', { name: /manual scheduling/i })).toBeVisible()
  })

  test('handles large task lists efficiently', async ({ page }) => {
    // Mock large task dataset
    await page.route('/api/tasks', async route => {
      const largeTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        status: 'pending',
        priority: 'medium',
        metadata: {
          energyLevel: ['high', 'medium', 'low'][i % 3],
          focusType: ['creative', 'analytical', 'technical'][i % 3],
          estimatedDuration: 30 + (i % 90)
        }
      }))
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeTasks)
      })
    })

    const startTime = Date.now()
    await planningPage.goto()
    const loadTime = Date.now() - startTime

    // Verify reasonable load time even with large dataset
    expect(loadTime).toBeLessThan(5000) // 5 seconds max

    // Verify UI remains responsive
    await page.getByRole('button', { name: /generate plan/i }).click()
    await expect(page.getByText('Generating plan...')).toBeVisible()
    
    // Should complete within reasonable time
    await expect(page.getByText('Plan generated successfully')).toBeVisible({ timeout: 15000 })
  })

  test('validates user input and provides feedback', async ({ page }) => {
    await planningPage.goto()

    // Try to schedule break with invalid duration
    await page.getByRole('button', { name: /add break/i }).click()
    await page.getByLabel(/break duration/i).fill('200') // Too long
    await page.getByRole('button', { name: /schedule break/i }).click()

    await expect(page.getByText('Break duration cannot exceed 120 minutes')).toBeVisible()

    // Try to schedule task outside working hours
    await planningPage.dragTaskToTimeSlot('High Energy Creative Task', '22:00')

    await expect(page.getByText('Outside working hours')).toBeVisible()
    await expect(page.getByText('Consider adjusting your schedule or working hours')).toBeVisible()
  })
})
