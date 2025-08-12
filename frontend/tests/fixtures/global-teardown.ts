import fs from 'fs';
import path from 'path';

/**
 * Global teardown for ADHD-optimized E2E testing
 * Generates final performance report and cleanup
 */
async function globalTeardown() {
  console.log('🧠 Cleaning up ADHD E2E testing environment...');

  const resultsDir = path.join(__dirname, '../../test-results');

  try {
    // Generate performance summary report
    const baselineFile = path.join(resultsDir, 'adhd-performance-baseline.json');
    const resultsFile = path.join(resultsDir, 'results.json');

    if (fs.existsSync(baselineFile) && fs.existsSync(resultsFile)) {
      const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

      // Analyze ADHD performance compliance
      const adhdCompliance = {
        timestamp: new Date().toISOString(),
        baseline: baseline.adhdTargets,
        testResults: {
          totalTests: results.stats?.total || 0,
          passedTests: results.stats?.passed || 0,
          failedTests: results.stats?.failed || 0,
        },
        adhdMetricsStatus: 'See individual test results for Core Web Vitals compliance',
        recommendations: [
          'Monitor LCP <2000ms for ADHD attention maintenance',
          'Ensure FID <50ms for immediate interaction feedback',
          'Keep CLS <0.05 to prevent visual anxiety in ADHD users',
          'Task creation should complete in <200ms',
          'Energy level switching should be <400ms',
        ],
      };

      fs.writeFileSync(
        path.join(resultsDir, 'adhd-performance-summary.json'),
        JSON.stringify(adhdCompliance, null, 2)
      );

      console.log('📊 ADHD performance summary generated');
      console.log(`✅ Tests passed: ${adhdCompliance.testResults.passedTests}`);
      console.log(`❌ Tests failed: ${adhdCompliance.testResults.failedTests}`);
    }
  } catch (error) {
    console.warn('⚠️ Could not generate performance summary:', (error as Error).message);
  }

  console.log('🎯 ADHD E2E testing cleanup complete');
}

export default globalTeardown;
