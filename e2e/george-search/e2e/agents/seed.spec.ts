import { test } from '../pages/fixtures';

/**
 * Seed for Playwright's test agents (planner / generator / healer). It only logs in through the
 * shared worker fixture and lands on the dashboard, so every agent session starts authenticated.
 * Agents explore from here; their output is translated into features/ + steps, never kept here.
 */
test.describe('George seed', () => {
  test('seed', async ({ george }) => {
    await george.navigateToDashboard();
  });
});
