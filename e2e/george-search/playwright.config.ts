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
  /* Slow FAT environment: two-step login plus search can take well over a minute. Do not reduce. */
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  /* Retries run at the end, one by one, so a flaky FAT response doesn't disturb the rest of the run. */
  retryStrategy: 'isolated',
  /* One worker: shared George FAT user cannot handle concurrent multi-browser logins. */
  workers: 1,
  reporter: [
    ['html'],
    ['allure-playwright'],
  ],
  use: {
    /* Aria + screen snapshots feed the trace viewer's Display Aria mode and the self-healer. */
    trace: { mode: 'on-first-retry', snapshots: { dom: true, aria: true, screen: true } },
  },
  /* `npx playwright test` runs chromium only; use --project="*" for all three. */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      default: false,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      default: false,
    },
  ],
});
