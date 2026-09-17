import { defineConfig, devices } from '@playwright/test';
import { getConfig } from './src/utils/configReader';

const config = getConfig();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: config.retries,
  reporter: [
    ['html', { outputFolder: 'test-output/playwright-report', open: 'never' }],
    ['list'],
  ],
  outputDir: 'test-output/test-results',
  use: {
    baseURL: config.baseUrl,
    headless: config.headless,
    actionTimeout: config.actionTimeoutMs,
    navigationTimeout: config.navigationTimeoutMs,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
