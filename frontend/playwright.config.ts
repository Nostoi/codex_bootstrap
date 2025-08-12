import { PlaywrightTestConfig } from '@playwright/test';

const FRONTEND_PORT = process.env.NEXT_PUBLIC_FRONTEND_PORT || '3500';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  testMatch: /.*\.e2e\.ts$/,
  testIgnore: /.*\.spec\.ts$/,

  // ADHD-optimized test configuration
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Performance and accessibility reporting
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  // Global test setup for ADHD performance baselines
  globalSetup: require.resolve('./tests/fixtures/global-setup.ts'),
  globalTeardown: require.resolve('./tests/fixtures/global-teardown.ts'),

  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,

    // ADHD-optimized browser settings
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // Enhanced debugging for performance issues
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',

    // Accessibility and performance monitoring
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },

    // Performance monitoring flags
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--enable-performance-logging',
        '--enable-web-vitals-reporting',
        '--force-reduced-motion', // ADHD-friendly: reduced animations
      ],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...require('@playwright/test').devices['Desktop Chrome'],
        // ADHD performance monitoring with Chrome DevTools
        launchOptions: {
          args: [
            '--enable-performance-logging',
            '--enable-web-vitals-reporting',
            '--force-reduced-motion',
          ],
        },
      },
    },
    {
      name: 'firefox',
      use: { ...require('@playwright/test').devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...require('@playwright/test').devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...require('@playwright/test').devices['Pixel 5'],
        // Mobile ADHD performance considerations
        launchOptions: {
          args: ['--force-reduced-motion'],
        },
      },
    },
    {
      name: 'adhd-performance',
      testMatch: '**/adhd-performance.e2e.ts',
      use: {
        ...require('@playwright/test').devices['Desktop Chrome'],
        // Dedicated ADHD performance testing configuration
        launchOptions: {
          args: [
            '--enable-performance-logging',
            '--enable-web-vitals-reporting',
            '--enable-precise-memory-info',
            '--force-reduced-motion',
          ],
        },
      },
    },
  ],

  // ADHD-specific performance web server configuration
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm run dev',
        port: Number(FRONTEND_PORT),
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
        env: {
          NODE_ENV: 'test',
          NEXT_PUBLIC_API_URL: `http://localhost:${process.env.NEXT_PUBLIC_BACKEND_PORT || '3501'}`,
        },
      },
};

export default config;
