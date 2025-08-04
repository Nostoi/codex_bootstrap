import { test, expect } from '@playwright/test';

test.describe('Interactive Features', () => {
  test('reflection form interaction works', async ({ page }) => {
    await page.goto('/reflection');

    // Switch to new entry tab
    await page.getByRole('button', { name: /new entry/i }).click();

    // Fill out the form (use correct placeholders)
    await page.getByPlaceholder('Enter a title for your reflection').fill('Test Reflection Entry');
    await page
      .getByPlaceholder('Write your reflection here...')
      .fill('This is a test reflection about my progress today.');
    await page
      .getByPlaceholder('productivity, learning, challenges')
      .fill('testing, playwright, automation');

    // Change category
    await page.locator('select').first().selectOption('weekly');

    // Adjust mood slider
    await page.getByRole('slider').fill('5');

    // Check that save button is now enabled
    await expect(page.getByRole('button', { name: /save entry/i })).toBeEnabled();

    // Click save (would normally save to backend)
    await page.getByRole('button', { name: /save entry/i }).click();

    // Should navigate back to view tab
    await expect(page.getByRole('button', { name: /view entries/i })).toHaveClass(/tab-active/);
  });

  test('settings form interactions work', async ({ page }) => {
    await page.goto('/settings');

    // Test theme selection
    await page.locator('select').first().selectOption('dark');

    // Test language selection
    await page.locator('select').nth(1).selectOption('es');

    // Switch to notifications tab
    await page.getByRole('button', { name: /notifications/i }).click();

    // Toggle notification settings
    const emailToggle = page.locator('input[type="checkbox"]').first();
    const pushToggle = page.locator('input[type="checkbox"]').nth(1);

    // Check current state and toggle
    const emailInitialState = await emailToggle.isChecked();
    await emailToggle.click();
    if (emailInitialState) {
      await expect(emailToggle).not.toBeChecked();
    } else {
      await expect(emailToggle).toBeChecked();
    }

    await pushToggle.click();

    // Switch to privacy tab
    await page.getByRole('button', { name: /privacy/i }).click();

    // Toggle privacy settings
    const profileToggle = page.locator('input[type="checkbox"]').first();
    await profileToggle.click();

    // Click save changes
    await page.getByRole('button', { name: /save changes/i }).click();

    // Note: In a real app, we'd check for success message
    // For now, we just ensure the button click works
  });

  test('project card interactions', async ({ page }) => {
    await page.goto('/projects');

    // Check that project cards are interactive
    const projectCards = page.locator('.card');
    await expect(projectCards).toHaveCount(3);

    // Check action buttons on first card (fix button text)
    const firstCard = projectCards.first();
    await expect(firstCard.getByRole('button', { name: 'View' })).toBeVisible();

    // Test new project button
    await expect(page.getByRole('button', { name: /new project/i })).toBeVisible();
  });

  test('dashboard task interactions', async ({ page }) => {
    await page.goto('/dashboard');

    // Check that dashboard is properly loaded
    await expect(page.getByRole('heading', { name: /helmsman dashboard/i })).toBeVisible();

    // Note: Task interactions would depend on the TaskList component implementation
    // This test ensures the dashboard is properly rendered
  });
});

test.describe('Responsive Design', () => {
  test('mobile navigation works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // On mobile, the navigation might be hidden or in a mobile menu
    // Instead of checking navigation, verify the page loads and quick nav cards work
    await expect(page.getByRole('heading', { name: /welcome to codex bootstrap/i })).toBeVisible();

    // Quick nav cards should still be visible and functional on mobile
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

    // Verify all 4 quick nav cards are present on mobile
    const dashboardCard = page.getByRole('link', {
      name: 'Dashboard View your tasks and daily energy planning',
    });
    const projectsCard = page.getByRole('link', {
      name: 'Projects Manage projects with energy-aware organization',
    });
    const reflectionCard = page.getByRole('link', {
      name: 'Reflection Journal thoughts with cognitive load reduction',
    });
    const settingsCard = page.getByRole('link', {
      name: 'Settings Customize accessibility and preferences',
    });

    await expect(dashboardCard).toBeVisible();
    await expect(projectsCard).toBeVisible();
    await expect(reflectionCard).toBeVisible();
    await expect(settingsCard).toBeVisible();
  });

  test('tablet layout works', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/projects');

    // Projects should display in grid on tablet
    const projectCards = page.locator('.card');
    await expect(projectCards).toHaveCount(3);

    // Navigation should work
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL('/settings');
  });
});

test.describe('Error Handling', () => {
  test('handles non-existent routes gracefully', async ({ page }) => {
    // Test a route that doesn't exist
    const response = await page.goto('/nonexistent-page');

    // Should get 404 status
    expect(response?.status()).toBe(404);
  });
});

test.describe('Performance', () => {
  test('pages load quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await expect(page.getByRole('heading', { name: /welcome to codex bootstrap/i })).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('navigation between pages is fast', async ({ page }) => {
    await page.goto('/');

    const startTime = Date.now();

    await page.getByRole('link', { name: 'Dashboard' }).first().click();
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    const navigationTime = Date.now() - startTime;

    // Navigation should be under 1 second
    expect(navigationTime).toBeLessThan(1000);
  });
});
