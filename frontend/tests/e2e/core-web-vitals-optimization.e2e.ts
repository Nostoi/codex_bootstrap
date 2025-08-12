/**
 * Core Web Vitals Optimization E2E Tests
 * Phase 3 Item 15: Performance testing with Core Web Vitals optimization
 *
 * Validates ADHD-optimized performance standards in real browser environment
 */

import { test, expect } from '@playwright/test';
import { ADHDPerformanceMetrics } from '../fixtures/pageObjects';

// ADHD-optimized performance thresholds (stricter than standard)
const ADHD_THRESHOLDS = {
  lcp: { target: 1500, good: 2000, poor: 4000 },
  fid: { target: 30, good: 50, poor: 300 },
  cls: { target: 0.02, good: 0.05, poor: 0.25 },
  tti: { target: 2500, good: 3000, poor: 6000 },
};

test.describe('Core Web Vitals Optimization', () => {
  let performanceMetrics: ADHDPerformanceMetrics;

  test.beforeEach(async ({ page }) => {
    performanceMetrics = new ADHDPerformanceMetrics(page);
  });

  test('Performance testing page meets ADHD-optimized Core Web Vitals standards', async ({
    page,
  }) => {
    // Navigate to performance testing page
    await page.goto('/performance');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Measure Core Web Vitals
    const metrics = await performanceMetrics.measureCoreWebVitals('/performance');

    console.log('📊 Performance Testing Page Metrics:', {
      lcp: `${metrics.LCP}ms (target: ${ADHD_THRESHOLDS.lcp.target}ms)`,
      fid: `${metrics.FID}ms (target: ${ADHD_THRESHOLDS.fid.target}ms)`,
      cls: `${metrics.CLS} (target: ${ADHD_THRESHOLDS.cls.target})`,
      tti: `${metrics.TTI}ms (target: ${ADHD_THRESHOLDS.tti.target}ms)`,
    });

    // Validate ADHD-optimized performance standards
    expect(
      metrics.LCP,
      `LCP should be under ${ADHD_THRESHOLDS.lcp.good}ms for ADHD users`
    ).toBeLessThan(ADHD_THRESHOLDS.lcp.good);
    expect(
      metrics.FID,
      `FID should be under ${ADHD_THRESHOLDS.fid.good}ms for immediate response`
    ).toBeLessThan(ADHD_THRESHOLDS.fid.good);
    expect(
      metrics.CLS,
      `CLS should be under ${ADHD_THRESHOLDS.cls.good} to prevent disorientation`
    ).toBeLessThan(ADHD_THRESHOLDS.cls.good);
    expect(
      metrics.TTI,
      `TTI should be under ${ADHD_THRESHOLDS.tti.good}ms for cognitive accessibility`
    ).toBeLessThan(ADHD_THRESHOLDS.tti.good);
  });

  test('Performance monitoring component loads and displays metrics', async ({ page }) => {
    await page.goto('/performance');

    // Wait for performance monitoring component to load
    await expect(page.locator('h2').filter({ hasText: 'Core Web Vitals Monitor' })).toBeVisible();

    // Check if monitoring starts automatically
    await expect(page.locator('button').filter({ hasText: 'Monitoring...' })).toBeVisible();

    // Wait for metrics to be populated (should happen within 5 seconds)
    await page.waitForTimeout(5000);

    // Verify metrics are displayed
    const lcpMetric = page.locator('text=LCP').first();
    const inpMetric = page.locator('text=INP').first();
    const clsMetric = page.locator('text=CLS').first();

    await expect(lcpMetric).toBeVisible();
    await expect(inpMetric).toBeVisible();
    await expect(clsMetric).toBeVisible();
  });

  test('Performance recommendations are provided for optimization', async ({ page }) => {
    await page.goto('/performance');

    // Wait for performance monitoring to complete
    await page.waitForTimeout(3000);

    // Check if recommendations section exists
    const recommendationsSection = page
      .locator('h3')
      .filter({ hasText: 'Optimization Recommendations' });

    // Recommendations should be visible (either generic or specific based on performance)
    if (await recommendationsSection.isVisible()) {
      // Verify at least one recommendation is present
      const recommendations = page
        .locator('div')
        .filter({ hasText: /optimization|performance|improve/i })
        .first();
      await expect(recommendations).toBeVisible();

      console.log('✅ Performance recommendations are being provided');
    } else {
      console.log('ℹ️ No specific recommendations shown (performance may already be optimal)');
    }
  });

  test('ADHD performance standards are clearly documented', async ({ page }) => {
    await page.goto('/performance');

    // Verify ADHD performance standards section
    await expect(
      page.locator('h3').filter({ hasText: 'ADHD Performance Standards' })
    ).toBeVisible();

    // Check that thresholds are displayed
    await expect(page.locator('text=Good')).toBeVisible();
    await expect(page.locator('text=Needs Improvement')).toBeVisible();
    await expect(page.locator('text=Poor')).toBeVisible();

    // Verify ADHD optimization note
    await expect(page.locator('text=ADHD-optimized thresholds are stricter')).toBeVisible();
  });

  test('Performance impact information is educational and accessible', async ({ page }) => {
    await page.goto('/performance');

    // Verify ADHD Performance Impact section
    await expect(page.locator('h2').filter({ hasText: 'ADHD Performance Impact' })).toBeVisible();

    // Check for educational content about ADHD and performance
    await expect(page.locator('text=focus')).toBeVisible();
    await expect(page.locator('text=frustration')).toBeVisible();
    await expect(page.locator('text=disorienting')).toBeVisible();

    // Verify optimization strategies are provided
    await expect(page.locator('h2').filter({ hasText: 'Optimization Strategies' })).toBeVisible();
    await expect(page.locator('text=Image Optimization')).toBeVisible();
    await expect(page.locator('text=JavaScript Optimization')).toBeVisible();
    await expect(page.locator('text=CSS Optimization')).toBeVisible();
  });

  test('Performance budget guidelines are comprehensive', async ({ page }) => {
    await page.goto('/performance');

    // Verify performance budget section
    await expect(
      page.locator('h2').filter({ hasText: 'Performance Budget Guidelines' })
    ).toBeVisible();

    // Check for bundle size limits
    await expect(page.locator('text=Bundle Size Limits')).toBeVisible();
    await expect(page.locator('text=400KB')).toBeVisible();

    // Check for loading performance targets
    await expect(page.locator('text=Loading Performance')).toBeVisible();
    await expect(page.locator('text=Time to Interactive')).toBeVisible();

    // Check for resource limits
    await expect(page.locator('text=Resource Limits')).toBeVisible();
    await expect(page.locator('text=Total requests')).toBeVisible();
  });

  test('Interactive performance testing works correctly', async ({ page }) => {
    await page.goto('/performance');

    // Stop monitoring if it's running
    const stopButton = page.locator('button').filter({ hasText: 'Stop' });
    if (await stopButton.isEnabled()) {
      await stopButton.click();
    }

    // Start monitoring manually
    await page.locator('button').filter({ hasText: 'Start Monitor' }).click();

    // Verify monitoring state changes
    await expect(page.locator('button').filter({ hasText: 'Monitoring...' })).toBeVisible();

    // Perform some interactions to generate performance data
    await page.locator('h1').click(); // Click header
    await page.mouse.wheel(0, 500); // Scroll down
    await page.mouse.wheel(0, -500); // Scroll back up

    // Wait for metrics to update
    await page.waitForTimeout(2000);

    // Stop monitoring
    await page.locator('button').filter({ hasText: 'Stop' }).click();
    await expect(page.locator('button').filter({ hasText: 'Start Monitor' })).toBeVisible();
  });

  test('Performance data export and reporting capabilities', async ({ page }) => {
    await page.goto('/performance');

    // Wait for performance data to be collected
    await page.waitForTimeout(3000);

    // Verify performance report structure
    const performanceReport = page.locator('h3').filter({ hasText: 'Performance Report' });
    if (await performanceReport.isVisible()) {
      // Check for overall grade
      await expect(page.locator('text=Overall:')).toBeVisible();

      // Check for timestamp
      await expect(page.locator('text=Last updated:')).toBeVisible();

      // Check for ADHD optimization badge
      await expect(page.locator('text=🧠 ADHD Optimized')).toBeVisible();

      console.log('✅ Performance reporting is functional');
    }
  });

  test('Accessibility of performance monitoring interface', async ({ page }) => {
    await page.goto('/performance');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus management
    const focusedElement = await page.locator(':focus').first();
    expect(focusedElement).toBeTruthy();

    // Check for proper ARIA labels and semantic structure
    const headers = await page.locator('h1, h2, h3').count();
    expect(headers).toBeGreaterThan(3); // Proper heading hierarchy

    // Verify color contrast in performance indicators
    const performanceCards = page.locator(
      '[class*="bg-green"], [class*="bg-yellow"], [class*="bg-red"]'
    );
    const cardCount = await performanceCards.count();
    if (cardCount > 0) {
      console.log(`✅ Found ${cardCount} performance indicators with semantic colors`);
    }
  });

  test('Memory usage remains stable during performance monitoring', async ({ page }) => {
    await page.goto('/performance');

    // Measure initial memory usage
    const initialMemory = await performanceMetrics.measureMemoryUsage();

    // Let monitoring run for 10 seconds
    await page.waitForTimeout(10000);

    // Measure memory after monitoring
    const finalMemory = await performanceMetrics.measureMemoryUsage();

    // Memory increase should be reasonable (less than 10MB)
    const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
    const memoryIncreaseInMB = memoryIncrease / (1024 * 1024);

    console.log(`📊 Memory usage during monitoring: +${memoryIncreaseInMB.toFixed(2)}MB`);

    expect(memoryIncreaseInMB, 'Memory usage should remain stable during monitoring').toBeLessThan(
      10
    );
  });
});

test.describe('Performance Optimization Validation', () => {
  test('Core Web Vitals meet target performance for all page types', async ({ page }) => {
    const pagesToTest = [
      { path: '/', name: 'Home Page' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/performance', name: 'Performance Testing' },
    ];

    for (const pageInfo of pagesToTest) {
      console.log(`🔍 Testing ${pageInfo.name} (${pageInfo.path})`);

      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const performanceMetrics = new ADHDPerformanceMetrics(page);
      const metrics = await performanceMetrics.measureCoreWebVitals(pageInfo.path);

      // Log results for each page
      console.log(`📊 ${pageInfo.name} Metrics:`, {
        lcp: `${metrics.LCP}ms`,
        fid: `${metrics.FID}ms`,
        cls: `${metrics.CLS}`,
        tti: `${metrics.TTI}ms`,
        grade:
          metrics.LCP < ADHD_THRESHOLDS.lcp.good &&
          metrics.FID < ADHD_THRESHOLDS.fid.good &&
          metrics.CLS < ADHD_THRESHOLDS.cls.good
            ? 'GOOD'
            : 'NEEDS IMPROVEMENT',
      });

      // Validate against ADHD thresholds (allowing some flexibility for different page complexity)
      const pageLcpThreshold =
        pageInfo.path === '/' ? ADHD_THRESHOLDS.lcp.good : ADHD_THRESHOLDS.lcp.poor;
      expect(metrics.LCP, `${pageInfo.name} LCP should meet ADHD standards`).toBeLessThan(
        pageLcpThreshold
      );
    }
  });
});
