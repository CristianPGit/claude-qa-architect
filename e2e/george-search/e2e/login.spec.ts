import { test } from '@playwright/test';
import { GeorgePage } from './pages/george.page';

test('login', async ({ page }) => {
  test.setTimeout(120_000);

  const george = new GeorgePage(page);
  await george.login();
});
