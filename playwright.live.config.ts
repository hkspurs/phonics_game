import { defineConfig, devices } from '@playwright/test';

const configuredBaseUrl = process.env.LIVE_BASE_URL?.trim();
if (!configuredBaseUrl) {
  throw new Error('LIVE_BASE_URL is required for deployed smoke tests.');
}

const baseURL = configuredBaseUrl.endsWith('/') ? configuredBaseUrl : `${configuredBaseUrl}/`;
const jsonOutput = process.env.PLAYWRIGHT_JSON_OUTPUT_NAME;

export default defineConfig({
  testDir: './e2e/live',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: jsonOutput
    ? [['list'], ['json', { outputFile: jsonOutput }]]
    : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader'],
        },
      },
    },
  ],
});
