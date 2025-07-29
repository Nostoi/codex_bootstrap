import { test, expect } from '@playwright/test'

test.describe('Navigation Tests', () => {
  test('homepage navigation works', async ({ page }) => {
    await page.goto('/')
    
    // Check that the homepage loads correctly
    await expect(page.getByRole('heading', { name: /welcome to codex bootstrap/i })).toBeVisible()
    
    // Test navigation menu (use role-based selectors instead of CSS classes)
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Projects' })).toBeVisible()
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Reflection' })).toBeVisible()
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Settings' })).toBeVisible()
  })

  test('quick navigation cards work', async ({ page }) => {
    await page.goto('/')
    
    // Check all quick nav cards are present (using heading roles instead of CSS classes)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Reflection' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })
})

test.describe('Dashboard Page', () => {
  test('dashboard page loads and displays content', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check page title
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    
    // Check sections - updated to match actual dashboard content
    await expect(page.getByRole('heading', { name: /helmsman dashboard/i })).toBeVisible()
    
    // Check navigation is present
    await expect(page.getByRole('link', { name: 'Codex Bootstrap' })).toBeVisible()
  })

  test('dashboard navigation is highlighted', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check that Dashboard nav item has accent class
    const dashboardLink = page.locator('a[href="/dashboard"]').last()
    await expect(dashboardLink).toHaveClass(/text-accent/)
  })
})

test.describe('Projects Page', () => {
  test('projects page loads and displays project cards', async ({ page }) => {
    await page.goto('/projects')
    
    // Check page title
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible()
    
    // Check new project button
    await expect(page.getByRole('button', { name: /new project/i })).toBeVisible()
    
    // Check project cards are displayed
    await expect(page.getByText('Website Redesign')).toBeVisible()
    await expect(page.getByText('Mobile App Development')).toBeVisible()
    await expect(page.getByText('Database Migration')).toBeVisible()
    
    // Check project status badges
    await expect(page.locator('.badge').filter({ hasText: 'active' })).toHaveCount(2)
    await expect(page.locator('.badge').filter({ hasText: 'completed' })).toHaveCount(1)
  })

  test('project cards show progress information', async ({ page }) => {
    await page.goto('/projects')
    
    // Check progress bars are present
    await expect(page.locator('.progress')).toHaveCount(3)
    
    // Check task completion info
    await expect(page.getByText(/8 of 12 tasks completed/)).toBeVisible()
    await expect(page.getByText(/5 of 25 tasks completed/)).toBeVisible()
    await expect(page.getByText(/8 of 8 tasks completed/)).toBeVisible()
  })
})

test.describe('Reflection Page', () => {
  test('reflection page loads with tabs', async ({ page }) => {
    await page.goto('/reflection')
    
    // Check page title
    await expect(page.getByRole('heading', { name: /reflection journal/i })).toBeVisible()
    
    // Check tabs
    await expect(page.getByRole('button', { name: /view entries/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /new entry/i })).toBeVisible()
  })

  test('reflection entries are displayed', async ({ page }) => {
    await page.goto('/reflection')
    
    // Check reflection entries
    await expect(page.getByText('Great progress on frontend')).toBeVisible()
    await expect(page.getByText('Challenges with ESLint')).toBeVisible()
    await expect(page.getByText('Week 30 Review')).toBeVisible()
    
    // Check tags are displayed
    await expect(page.getByText('#development')).toBeVisible()
    await expect(page.getByText('#docker')).toBeVisible()
    await expect(page.getByText('#eslint')).toBeVisible()
  })

  test('new entry form works', async ({ page }) => {
    await page.goto('/reflection')
    
    // Switch to new entry tab
    await page.getByRole('button', { name: /new entry/i }).click()
    
    // Check form elements
    await expect(page.getByPlaceholder(/enter a title/i)).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
    await expect(page.getByRole('slider')).toBeVisible()
    await expect(page.getByPlaceholder(/write your reflection/i)).toBeVisible()
    await expect(page.getByPlaceholder(/productivity, learning/i)).toBeVisible()
    
    // Check save button is disabled initially
    await expect(page.getByRole('button', { name: /save entry/i })).toBeDisabled()
  })
})

test.describe('Settings Page', () => {
  test('settings page loads with sidebar navigation', async ({ page }) => {
    await page.goto('/settings')
    
    // Check page title (use more specific selector)
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()
    
    // Check sidebar menu
    await expect(page.getByRole('button', { name: /general/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /notifications/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /privacy/i })).toBeVisible()
  })

  test('general settings are displayed', async ({ page }) => {
    await page.goto('/settings')
    
    // Check general settings elements
    await expect(page.getByText('Theme')).toBeVisible()
    await expect(page.getByText('Language')).toBeVisible()
    await expect(page.getByText('Timezone')).toBeVisible()
    await expect(page.getByText('Date Format')).toBeVisible()
    await expect(page.getByText('Start of Week')).toBeVisible()
    
    // Check save button
    await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible()
  })

  test('settings tabs work', async ({ page }) => {
    await page.goto('/settings')
    
    // Test notifications tab
    await page.getByRole('button', { name: /notifications/i }).click()
    await expect(page.getByText('Email Notifications')).toBeVisible()
    await expect(page.getByText('Push Notifications')).toBeVisible()
    
    // Test privacy tab
    await page.getByRole('button', { name: /privacy/i }).click()
    await expect(page.getByText('Public Profile')).toBeVisible()
    await expect(page.getByText('Show Activity')).toBeVisible()
    await expect(page.getByText('Analytics')).toBeVisible()
  })
})

test.describe('Navigation Between Pages', () => {
  test('can navigate between all pages using navbar', async ({ page }) => {
    // Start at home
    await page.goto('/')
    
    // Navigate to Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).first().click()
    await expect(page).toHaveURL('/dashboard')
    
    // Navigate to Projects
    await page.getByRole('link', { name: 'Projects' }).click()
    await expect(page).toHaveURL('/projects')
    
    // Navigate to Reflection
    await page.getByRole('link', { name: 'Reflection' }).click()
    await expect(page).toHaveURL('/reflection')
    
    // Navigate to Settings
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL('/settings')
    
    // Navigate back home
    await page.getByRole('link', { name: 'Codex Bootstrap' }).click()
    await expect(page).toHaveURL('/')
  })

  test('quick nav cards navigate correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test dashboard card (use more specific selector for the quick nav card)
    await page.getByRole('link', { name: 'Dashboard View your tasks and daily energy planning' }).click()
    await expect(page).toHaveURL('/dashboard')
    
    await page.goto('/')
    
    // Test projects card
    await page.getByRole('link', { name: 'Projects Manage projects with energy-aware organization' }).click()
    await expect(page).toHaveURL('/projects')
    
    await page.goto('/')
    
    // Test reflection card
    await page.getByRole('link', { name: 'Reflection Journal thoughts with cognitive load reduction' }).click()
    await expect(page).toHaveURL('/reflection')
    
    await page.goto('/')
    
    // Test settings card
    await page.getByRole('link', { name: 'Settings Customize accessibility and preferences' }).click()
    await expect(page).toHaveURL('/settings')
  })
})
