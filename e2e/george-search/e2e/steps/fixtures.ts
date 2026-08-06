import { test as base, createBdd } from 'playwright-bdd';
import type { Browser, Page } from '@playwright/test';
import { GeorgePage } from '../pages/george.page';

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
      await page.waitForURL('**/george.fat3.sparkasse.at/**', { timeout: 60_000 });

      await use(page);

      await context.close();
    },
    { scope: 'worker' },
  ],

  george: async ({ authenticatedPage }: { authenticatedPage: Page }, use: (george: GeorgePage) => Promise<void>) => {
    await use(new GeorgePage(authenticatedPage));
  },
});

export const { Given, When, Then } = createBdd(test);
