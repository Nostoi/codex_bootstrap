import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  testMatch: /.*\.e2e\.ts$/,
  testIgnore: /.*\.spec\.ts$/,
  // webServer: {
  //   command: 'npm run dev',
  //   port: 3000,
  //   timeout: 120 * 1000,
  //   reuseExistingServer: true,
  // },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...require('@playwright/test').devices['Desktop Chrome'] },
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
      use: { ...require('@playwright/test').devices['Pixel 5'] },
    },
  ],
};

export default config;
