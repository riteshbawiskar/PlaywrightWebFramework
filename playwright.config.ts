import { defineConfig, devices } from '@playwright/test';
import { getConfig } from './src/utils/configReader';

const config = getConfig();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // All UI tests log in as the same user, and the cart is stored on the server.
  // Running them in parallel made cart and checkout tests see each other's items
  // (flakiness baseline: 13 failures in 90 runs). One worker removes that race.
  // Trade-off: slower runs. Revisit once each test gets its own user or cart.
  workers: 1,
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
