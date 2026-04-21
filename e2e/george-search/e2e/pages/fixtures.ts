import { test as base, type Browser, type Page } from '@playwright/test';
import { GeorgePage } from './george.page';

/**
 * Worker-scoped fixture that logs in once per worker and reuses the same
 * browser context (and its in-memory sessionStorage token) for every test.
 *
 * With workers: 1 this means a single login per full test run.
 */
type WorkerFixtures = {
  authenticatedPage: Page;
};

type TestFixtures = {
  george: GeorgePage;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  authenticatedPage: [
    async ({ browser }: { browser: Browser }, use: (page: Page) => Promise<void>) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      const george = new GeorgePage(page);
      await george.login();
      // Wait for the OAuth redirect to complete and the SPA to initialise
      await page.waitForURL('**/george.fat3.sparkasse.at/**', { timeout: 60_000 });

      await use(page);

      await context.close();
    },
    { scope: 'worker', timeout: 120_000 },
  ],

  george: async ({ authenticatedPage }: { authenticatedPage: Page }, use: (george: GeorgePage) => Promise<void>) => {
    await use(new GeorgePage(authenticatedPage));
  },
});

export { expect } from '@playwright/test';
