import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/**
 * Config for Playwright's test agents. The main config's testDir is bddgen output, which the
 * agents can't seed from, so this one points at e2e/agents/ and inherits everything else.
 *   npx playwright init-agents --loop claude -c playwright.agents.config.ts --project chromium
 */
export default defineConfig({
  ...base,
  testDir: './e2e/agents',
  reporter: 'list',
});
