import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: './features/**/*.feature',
  steps: './e2e/steps/**/*.ts',
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  /* One worker: shared George FAT user cannot handle concurrent multi-browser logins. */
  workers: 1,
  reporter: [
    ['html'],
    ['allure-playwright'],
  ],
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
