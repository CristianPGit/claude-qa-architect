import { test } from '@playwright/test';
import { GeorgePage } from './pages/george.page';

test('search Fashion and verify transaction results', async ({ page }) => {
  test.setTimeout(120_000);

  const george = new GeorgePage(page);
  await george.login();
  await george.openSearchFromMainNav();
  await george.searchTransactionsByKeyword('Fashion');
  await george.expectResultsContainKeyword('Fashion');
});
