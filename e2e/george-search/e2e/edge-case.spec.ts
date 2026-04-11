import { test } from './pages/fixtures';

/**
 * Feature: Transaction Search — Edge Cases
 *
 * As a George banking customer
 * I want the search to be robust and reliable
 * So that results are always accurate, complete, and resilient to navigation
 *
 * Login happens once per run via the worker-scoped `george` fixture.
 */
test.describe('Feature: Transaction Search — Edge Cases', () => {
  test.beforeEach(async ({ george }) => {
    test.setTimeout(120_000);
    await test.step('Given the user is logged in and on the dashboard', async () => {
      await george.navigateToDashboard();
    });
    await test.step('And the user opens the search panel', async () => {
      await george.openSearchFromMainNav();
    });
  });

  test('Scenario: Result rows contain date, merchant name, and amount', async ({ george }) => {
    await test.step('When the user searches for "Fashion"', async () => {
      await george.searchTransactionsByKeyword('Fashion');
    });
    await test.step('Then transaction results containing "Fashion" should be visible', async () => {
      await george.expectResultsContainKeyword('Fashion');
    });
    await test.step('And each result row should contain a date, merchant name, and amount with currency', async () => {
      await george.expectResultRowsHaveRequiredFields();
    });
  });

  test('Scenario: Search resets after navigating away and back', async ({ george }) => {
    await test.step('Given the user has searched for "Fashion"', async () => {
      await george.searchTransactionsByKeyword('Fashion');
      await george.expectResultsContainKeyword('Fashion');
    });
    await test.step('When the user navigates to the Overview page', async () => {
      await george.navigateToOverview();
    });
    await test.step('And the user returns to the search panel', async () => {
      await george.openSearchFromMainNav();
    });
    await test.step('Then the search field should be empty with no stale results', async () => {
      await george.expectSearchFieldClean();
    });
  });

  test('Scenario: Rapid typing without Enter does not trigger search results', async ({ george }) => {
    await test.step('When the user types "Fashion" quickly without pressing Enter', async () => {
      await george.typeKeywordWithoutSubmitting('Fashion');
    });
    await test.step('And waits briefly for any debounced requests to fire', async () => {
      await george.page.waitForTimeout(2_000);
    });
    await test.step('Then no transaction tables should be rendered', async () => {
      await george.expectNoTransactionTables();
    });
  });
});
