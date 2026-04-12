import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env file (Playwright's auto-loading is unreliable with bddgen pipelines)
try {
  const envFile = readFileSync(resolve(__dirname, '.env'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const match = line.match(/^([^#][^=]*)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
} catch { /* .env is optional */ }

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
