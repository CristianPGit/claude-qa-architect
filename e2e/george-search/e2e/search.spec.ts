import { test } from './pages/fixtures';

/**
 * Feature: Transaction Search
 *
 * As a George banking customer
 * I want to search my transaction history by keyword
 * So that I can quickly find specific payments
 *
 * Login happens once per run via the worker-scoped `george` fixture.
 * beforeEach navigates to the dashboard and opens the search panel
 * so each scenario starts from an identical known state.
 */
test.describe('Feature: Transaction Search', () => {
  test.beforeEach(async ({ george }) => {
    test.setTimeout(120_000);
    await test.step('Given the user is logged in and on the dashboard', async () => {
      await george.navigateToDashboard();
    });
    await test.step('And the user opens the search panel', async () => {
      await george.openSearchFromMainNav();
    });
  });

  test('Scenario: Search panel opens and keyword input is visible', async ({ george }) => {
    await test.step('Then the keyword input field should be visible', async () => {
      await george.expectSearchInputVisible();
    });
  });

  test('Scenario: Search "Fashion" returns matching transaction results', async ({ george }) => {
    await test.step('When the user searches for "Fashion"', async () => {
      await george.searchTransactionsByKeyword('Fashion');
    });
    await test.step('Then transaction results containing "Fashion" should be visible', async () => {
      await george.expectResultsContainKeyword('Fashion');
    });
  });

  test('Scenario: Search is case-insensitive', async ({ george }) => {
    await test.step('When the user searches for "fashion" in lowercase', async () => {
      await george.searchTransactionsByKeyword('fashion');
    });
    await test.step('Then transaction results containing "Fashion" should still appear', async () => {
      await george.expectResultsContainKeyword('Fashion');
    });
  });

  test('Scenario: No matching keyword shows empty state', async ({ george }) => {
    await test.step('When the user searches for a non-existent keyword', async () => {
      await george.searchTransactionsByKeyword('XYZNOTEXIST99999');
    });
    await test.step('Then no results should be displayed', async () => {
      await george.expectNoResults();
    });
  });
});
