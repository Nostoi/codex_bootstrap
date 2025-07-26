import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './tests',
  testMatch: /.*\.e2e\.ts$/,
  webServer: {
    command: 'npm run dev',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
}

export default config
