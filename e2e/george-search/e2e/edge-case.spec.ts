import { test } from './pages/fixtures';

/**
 * Transaction Search — edge case scenarios
 *
 * These tests go beyond the happy path to verify result content integrity,
 * navigation resilience, and input debounce behaviour.
 *
 * Login happens once per run via the worker-scoped `george` fixture.
 */
test.describe('Transaction Search — Edge Cases', () => {
  test.beforeEach(async ({ george }) => {
    test.setTimeout(120_000);
    await george.navigateToDashboard();
    await george.openSearchFromMainNav();
  });

  /**
   * Scenario: Search result content validation
   * Beyond just verifying "Fashion" text is visible, assert that each result
   * row contains the expected fields: a date, a merchant/title, and an amount
   * with a currency indicator. Catches regressions where results appear but
   * are malformed or missing key data.
   */
  test('result rows contain date, merchant name, and amount', async ({ george }) => {
    await george.searchTransactionsByKeyword('Fashion');
    await george.expectResultsContainKeyword('Fashion');
    await george.expectResultRowsHaveRequiredFields();
  });

  /**
   * Scenario: Search after navigating away and back
   * Navigate to the Overview section, return to Search, and verify the panel
   * resets cleanly — no stale keyword or stale results from the previous
   * session should remain.
   */
  test('search resets after navigating away and back', async ({ george }) => {
    // First, perform a search so there is state to become stale
    await george.searchTransactionsByKeyword('Fashion');
    await george.expectResultsContainKeyword('Fashion');

    // Navigate away to Overview
    await george.navigateToOverview();

    // Return to Search
    await george.openSearchFromMainNav();

    // The search field should be clean — no leftover keyword
    await george.expectSearchFieldClean();
  });

  /**
   * Scenario: Rapid typing / debounce behaviour
   * Type characters quickly without pressing Enter and assert the app does
   * not fire premature search requests or render partial results. The search
   * should only execute on explicit submission (Enter), not on keystroke.
   */
  test('rapid typing without Enter does not trigger search results', async ({ george }) => {
    await george.typeKeywordWithoutSubmitting('Fashion');

    // Wait briefly to allow any debounced requests to fire
    await george.page.waitForTimeout(2_000);

    // No transaction tables should be rendered — search was not submitted
    await george.expectNoTransactionTables();
  });
});
