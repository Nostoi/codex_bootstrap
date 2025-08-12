import { test, expect } from '@playwright/test';
import { PerformanceHelper, ADHDPerformanceMetrics } from '../fixtures/pageObjects';

test.describe('Performance Testing - ADHD Optimized', () => {
  let perfHelper: PerformanceHelper;
  let adhdMetrics: ADHDPerformanceMetrics;

  test.beforeEach(async ({ page }) => {
    perfHelper = new PerformanceHelper(page);
    adhdMetrics = new ADHDPerformanceMetrics(page);
  });

  test.describe('Core Web Vitals - ADHD Targets', () => {
    test('dashboard meets ADHD-optimized Core Web Vitals', async ({ page }) => {
      const metrics = await adhdMetrics.measureCoreWebVitals('/dashboard');

      // ADHD-specific performance targets (stricter than standard)
      expect(metrics.LCP).toBeLessThan(2000); // 2s instead of 2.5s
      expect(metrics.FID).toBeLessThan(50); // 50ms instead of 100ms
      expect(metrics.CLS).toBeLessThan(0.05); // 0.05 instead of 0.1
      expect(metrics.TTI).toBeLessThan(3000); // 3s time to interactive
    });

    test('task creation performance reduces cognitive load', async ({ page }) => {
      await page.goto('/dashboard');

      const taskCreationMetrics = await adhdMetrics.measureTaskCreationPerformance();

      // ADHD-friendly task creation should be near-instantaneous
      expect(taskCreationMetrics.buttonClickToModal).toBeLessThan(200); // Modal opens quickly
      expect(taskCreationMetrics.formInteraction).toBeLessThan(100); // Form responds immediately
      expect(taskCreationMetrics.submitToFeedback).toBeLessThan(1500); // Save feedback quickly
    });

    test('focus session startup meets ADHD flow requirements', async ({ page }) => {
      await page.goto('/dashboard');

      const focusMetrics = await adhdMetrics.measureFocusSessionStartup();

      // Focus sessions must start quickly to maintain ADHD attention
      expect(focusMetrics.focusButtonClick).toBeLessThan(300); // Focus mode activates fast
      expect(focusMetrics.taskFiltering).toBeLessThan(500); // Tasks filter quickly
      expect(focusMetrics.visualTransition).toBeLessThan(800); // UI transitions smoothly
    });
  });

  test('dashboard loads within ADHD performance targets', async ({ page }) => {
    const loadTime = await perfHelper.measurePageLoadTime('/dashboard');

    // ADHD users need faster loading to prevent task abandonment
    expect(loadTime).toBeLessThan(2000); // Reduced from 3s to 2s for ADHD users
  });

  test('task filtering response times are acceptable', async ({ page }) => {
    await page.goto('/dashboard');

    // Measure filter response time
    const filterTime = await perfHelper.measureFilterResponseTime(async () => {
      await page.locator('#task-search').fill('test');
    });

    // Filter should respond in under 500ms
    expect(filterTime).toBeLessThan(500);
  });

  test('handles large dataset efficiently', async ({ page }) => {
    // Mock large dataset
    await page.route('/api/tasks', async route => {
      const largeTasks = Array.from({ length: 200 }, (_, i) => ({
        id: `task-${i}`,
        title: `Performance Test Task ${i}`,
        description: `Task ${i} for performance testing`,
        status: ['pending', 'in-progress', 'completed'][i % 3],
        priority: ['low', 'medium', 'high'][i % 3],
        metadata: {
          energyLevel: ['low', 'medium', 'high'][i % 3],
          focusType: ['creative', 'analytical', 'technical'][i % 3],
        },
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeTasks),
      });
    });

    const renderTime = await perfHelper.measureTaskRenderTime(200);

    // Should render 200 tasks in under 5 seconds
    expect(renderTime).toBeLessThan(5000);
  });

  test('memory usage stays within bounds', async ({ page }) => {
    await page.goto('/dashboard');

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);

    // Perform memory-intensive operations
    for (let i = 0; i < 10; i++) {
      await page.locator('#task-search').fill(`search ${i}`);
      await page.waitForTimeout(100);
    }

    // Check memory usage hasn't grown excessively
    const finalMemory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
    const memoryGrowth = finalMemory - initialMemory;

    // Memory growth should be reasonable (under 50MB)
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
  });

  test('network requests are optimized', async ({ page }) => {
    const networkRequests: string[] = [];

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkRequests.push(request.url());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Should not make excessive API calls
    expect(networkRequests.length).toBeLessThan(10);

    // Should not make duplicate requests
    const uniqueRequests = new Set(networkRequests);
    expect(uniqueRequests.size).toBe(networkRequests.length);
  });
});

test.describe('Error Recovery Testing', () => {
  test('handles network failures gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('/api/tasks', async route => {
      await route.fulfill({ status: 500 });
    });

    await page.goto('/dashboard');

    // Should show error state, not crash
    await expect(page.getByText(/unable to load tasks/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  test('recovers from API timeouts', async ({ page }) => {
    // Simulate slow API
    await page.route('/api/tasks', async route => {
      await new Promise(resolve => setTimeout(resolve, 31000)); // Longer than timeout
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/dashboard');

    // Should show timeout message
    await expect(page.getByText(/request timed out/i)).toBeVisible({ timeout: 35000 });
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  });

  test('handles malformed data gracefully', async ({ page }) => {
    // Send malformed task data
    await page.route('/api/tasks', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { invalidTask: true }, // Missing required fields
          { id: 'task-1', title: null }, // Null title
          { id: 'task-2', title: 'Valid Task', status: 'invalid-status' }, // Invalid status
        ]),
      });
    });

    await page.goto('/dashboard');

    // Should handle malformed data without crashing
    await expect(page.getByText(/some tasks could not be loaded/i)).toBeVisible();
    await expect(page.getByText('Valid Task')).toBeVisible(); // Valid task should still show
  });
});
