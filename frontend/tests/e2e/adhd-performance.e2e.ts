import { test, expect } from '@playwright/test';
import { PerformanceHelper, ADHDPerformanceMetrics } from '../fixtures/pageObjects';

test.describe('ADHD-Optimized Performance Testing', () => {
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

      console.log('ADHD Core Web Vitals Results:', {
        LCP: `${metrics.LCP}ms (target: <2000ms)`,
        FID: `${metrics.FID}ms (target: <50ms)`,
        CLS: `${metrics.CLS} (target: <0.05)`,
        TTI: `${metrics.TTI}ms (target: <3000ms)`,
      });
    });

    test('task creation performance reduces cognitive load', async ({ page }) => {
      await page.goto('/dashboard');

      const taskCreationMetrics = await adhdMetrics.measureTaskCreationPerformance();

      // ADHD-friendly task creation should be near-instantaneous
      expect(taskCreationMetrics.buttonClickToModal).toBeLessThan(200); // Modal opens quickly
      expect(taskCreationMetrics.formInteraction).toBeLessThan(100); // Form responds immediately
      expect(taskCreationMetrics.submitToFeedback).toBeLessThan(1500); // Save feedback quickly

      console.log('Task Creation Performance:', {
        modalOpen: `${taskCreationMetrics.buttonClickToModal}ms (target: <200ms)`,
        formResponse: `${taskCreationMetrics.formInteraction}ms (target: <100ms)`,
        saveFeedback: `${taskCreationMetrics.submitToFeedback}ms (target: <1500ms)`,
      });
    });

    test('focus session startup meets ADHD flow requirements', async ({ page }) => {
      await page.goto('/dashboard');

      const focusMetrics = await adhdMetrics.measureFocusSessionStartup();

      // Focus sessions must start quickly to maintain ADHD attention
      expect(focusMetrics.focusButtonClick).toBeLessThan(300); // Focus mode activates fast
      expect(focusMetrics.taskFiltering).toBeLessThan(500); // Tasks filter quickly
      expect(focusMetrics.visualTransition).toBeLessThan(800); // UI transitions smoothly

      console.log('Focus Session Startup Performance:', {
        focusActivation: `${focusMetrics.focusButtonClick}ms (target: <300ms)`,
        taskFiltering: `${focusMetrics.taskFiltering}ms (target: <500ms)`,
        visualTransition: `${focusMetrics.visualTransition}ms (target: <800ms)`,
      });
    });
  });

  test.describe('ADHD Workflow Performance', () => {
    test('energy level switching maintains ADHD flow', async ({ page }) => {
      await page.goto('/dashboard');

      const energyMetrics = await adhdMetrics.measureEnergyLevelSwitching();

      // Energy level switching should be instant to maintain ADHD focus flow
      expect(energyMetrics.highEnergySwitch).toBeLessThan(400); // High energy tasks appear quickly
      expect(energyMetrics.mediumEnergySwitch).toBeLessThan(400); // Medium energy switch is fast

      console.log('Energy Level Switching Performance:', {
        highEnergy: `${energyMetrics.highEnergySwitch}ms (target: <400ms)`,
        mediumEnergy: `${energyMetrics.mediumEnergySwitch}ms (target: <400ms)`,
      });
    });

    test('task filtering provides immediate feedback for ADHD users', async ({ page }) => {
      await page.goto('/dashboard');

      // Measure filter response time
      const filterTime = await perfHelper.measureFilterResponseTime(async () => {
        await page.locator('#task-search').fill('test');
      });

      // ADHD users need immediate feedback - reduced from 500ms to 350ms
      expect(filterTime).toBeLessThan(350);

      console.log('Filter Response Time:', `${filterTime}ms (target: <350ms)`);
    });

    test('visual transitions support ADHD attention management', async ({ page }) => {
      await page.goto('/dashboard');

      // Test view mode switching performance
      const gridViewStart = Date.now();
      await page.click('[data-testid="grid-view-button"]');
      await page.waitForSelector('[data-testid="tasks-grid"]', { state: 'visible' });
      const gridViewTime = Date.now() - gridViewStart;

      const focusViewStart = Date.now();
      await page.click('[data-testid="focus-view-button"]');
      await page.waitForSelector('[data-testid="focus-container"]', { state: 'visible' });
      const focusViewTime = Date.now() - focusViewStart;

      // View transitions should be smooth and fast for ADHD users
      expect(gridViewTime).toBeLessThan(600); // Grid view loads quickly
      expect(focusViewTime).toBeLessThan(800); // Focus view transition is smooth

      console.log('View Switching Performance:', {
        gridView: `${gridViewTime}ms (target: <600ms)`,
        focusView: `${focusViewTime}ms (target: <800ms)`,
      });
    });
  });

  test.describe('Cognitive Load Management', () => {
    test('handles large dataset efficiently for ADHD users', async ({ page }) => {
      // Mock large dataset with ADHD-specific fields
      await page.route('/api/tasks', async route => {
        const largeTasks = Array.from({ length: 200 }, (_, i) => ({
          id: `task-${i}`,
          title: `Performance Test Task ${i}`,
          description: `Task ${i} for performance testing`,
          status: ['pending', 'in-progress', 'completed'][i % 3],
          priority: Math.floor(Math.random() * 10) + 1,
          energyLevel: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
          focusType: ['CREATIVE', 'TECHNICAL', 'ADMINISTRATIVE'][i % 3],
          estimatedMinutes: Math.floor(Math.random() * 120) + 15,
        }));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(largeTasks),
        });
      });

      // Measure memory usage for cognitive load assessment
      const initialMemory = await adhdMetrics.measureMemoryUsage();

      await page.goto('/dashboard');
      await page.waitForSelector('[data-testid="task-card"]', { timeout: 30000 });

      const finalMemory = await adhdMetrics.measureMemoryUsage();

      // Memory usage should remain reasonable for ADHD cognitive load management
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase

      console.log('Memory Usage Analysis:', {
        initial: `${Math.round(initialMemory.usedJSHeapSize / 1024 / 1024)}MB`,
        final: `${Math.round(finalMemory.usedJSHeapSize / 1024 / 1024)}MB`,
        increase: `${Math.round(memoryIncrease / 1024 / 1024)}MB (target: <50MB)`,
      });
    });

    test('API response times support ADHD workflow', async ({ page }) => {
      await page.goto('/dashboard');

      // Test API response times for critical ADHD operations
      const taskCreateStart = Date.now();
      const taskCreateResponse = page.waitForResponse('/api/tasks');

      await page.click('[data-testid="new-task-button"]');
      await page.fill('[data-testid="task-title"]', 'ADHD Test Task');
      await page.selectOption('[data-testid="energy-level"]', 'HIGH');
      await page.selectOption('[data-testid="focus-type"]', 'CREATIVE');
      await page.click('[data-testid="save-task"]');

      const response = await taskCreateResponse;
      const taskCreateTime = Date.now() - taskCreateStart;

      // API operations should be fast to prevent ADHD task abandonment
      expect(response.status()).toBe(201);
      expect(taskCreateTime).toBeLessThan(2000); // Task creation completes quickly

      console.log('API Performance:', {
        taskCreation: `${taskCreateTime}ms (target: <2000ms)`,
        responseStatus: response.status(),
      });
    });
  });

  test.describe('Bundle Size and Loading Performance', () => {
    test('initial bundle meets ADHD cognitive load requirements', async ({ page }) => {
      // Navigate and measure resource loading
      const resourceSizes = await page.evaluate(() => {
        return new Promise(resolve => {
          window.addEventListener('load', () => {
            const resources = performance.getEntriesByType('resource');
            const bundleSizes = resources
              .filter((resource: any) => resource.name.includes('.js'))
              .map((resource: any) => ({
                name: resource.name.split('/').pop(),
                size: resource.transferSize || 0,
                duration: resource.duration,
              }));

            resolve(bundleSizes);
          });
        });
      });

      await page.goto('/dashboard');
      const bundles = (await resourceSizes) as any[];

      // Check for ADHD-optimized bundle sizes
      const totalBundleSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
      expect(totalBundleSize).toBeLessThan(400 * 1024); // <400KB target for ADHD users

      console.log('Bundle Size Analysis:', {
        totalSize: `${Math.round(totalBundleSize / 1024)}KB (target: <400KB)`,
        bundleCount: bundles.length,
        largestBundle: bundles.reduce((prev, current) =>
          prev.size > current.size ? prev : current
        ),
      });
    });

    test('page load performance meets ADHD attention span requirements', async ({ page }) => {
      const loadTime = await perfHelper.measurePageLoadTime('/dashboard');

      // ADHD users need faster loading to prevent task abandonment
      expect(loadTime).toBeLessThan(2000); // Reduced from 3s to 2s for ADHD users

      console.log('Page Load Performance:', `${loadTime}ms (target: <2000ms)`);
    });
  });

  test.describe('Performance Regression Detection', () => {
    test('monitors for performance regressions in ADHD features', async ({ page }) => {
      // Baseline measurements for regression testing
      const dashboardMetrics = await adhdMetrics.measureCoreWebVitals('/dashboard');
      const taskCreationMetrics = await adhdMetrics.measureTaskCreationPerformance();
      const energyMetrics = await adhdMetrics.measureEnergyLevelSwitching();

      // Store baseline for comparison in CI/CD
      const performanceReport = {
        timestamp: new Date().toISOString(),
        coreWebVitals: dashboardMetrics,
        taskCreation: taskCreationMetrics,
        energyFiltering: energyMetrics,
        adhdCompliant: {
          LCP: dashboardMetrics.LCP < 2000,
          FID: dashboardMetrics.FID < 50,
          CLS: dashboardMetrics.CLS < 0.05,
          taskCreationSpeed: taskCreationMetrics.buttonClickToModal < 200,
          energySwitchSpeed: energyMetrics.highEnergySwitch < 400,
        },
      };

      console.log('ADHD Performance Report:', JSON.stringify(performanceReport, null, 2));

      // All ADHD compliance checks should pass
      expect(performanceReport.adhdCompliant.LCP).toBe(true);
      expect(performanceReport.adhdCompliant.FID).toBe(true);
      expect(performanceReport.adhdCompliant.CLS).toBe(true);
      expect(performanceReport.adhdCompliant.taskCreationSpeed).toBe(true);
      expect(performanceReport.adhdCompliant.energySwitchSpeed).toBe(true);
    });
  });
});
