import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global setup for ADHD-optimized E2E testing
 * Establishes performance baselines and prepares test environment
 */
async function globalSetup() {
  console.log('🧠 Setting up ADHD-optimized E2E testing environment...');

  // Create performance results directory
  const resultsDir = path.join(__dirname, '../../test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Initialize ADHD performance baseline
  const browser = await chromium.launch({
    args: [
      '--enable-performance-logging',
      '--enable-web-vitals-reporting',
      '--enable-precise-memory-info',
      '--force-reduced-motion',
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Establish baseline measurements
    console.log('📊 Establishing ADHD performance baselines...');

    // Test basic connectivity
    await page.goto(process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3500');

    // Measure initial load time
    const loadStart = Date.now();
    await page.waitForLoadState('networkidle');
    const initialLoadTime = Date.now() - loadStart;

    // Store baseline data
    const baseline = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        baseUrl: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3500',
        userAgent: await page.evaluate(() => navigator.userAgent),
      },
      adhdTargets: {
        LCP: 2000, // ms
        FID: 50, // ms
        CLS: 0.05, // score
        TTI: 3000, // ms
        taskCreation: 200, // ms
        energySwitch: 400, // ms
        filterResponse: 350, // ms
      },
      baseline: {
        initialLoadTime,
        timestamp: Date.now(),
      },
    };

    fs.writeFileSync(
      path.join(resultsDir, 'adhd-performance-baseline.json'),
      JSON.stringify(baseline, null, 2)
    );

    console.log('✅ ADHD performance baseline established');
    console.log(`📈 Initial load time: ${initialLoadTime}ms (target: <2000ms)`);
  } catch (error) {
    console.warn('⚠️ Could not establish performance baseline:', (error as Error).message);
    // Don't fail setup if baseline can't be established
  } finally {
    await browser.close();
  }

  console.log('🎯 ADHD E2E test environment ready');
}

export default globalSetup;
