import { test } from './pages/fixtures';

/**
 * Transaction Search — automated test suite
 *
 * Structure: Page Object Model (GeorgePage) + test.describe grouping.
 * All tests share a serial worker (workers: 1) because the FAT environment
 * uses a single demo account that cannot handle concurrent logins.
 *
 * Login happens once per run via the worker-scoped `george` fixture.
 * beforeEach navigates back to the dashboard and opens the search panel
 * so each scenario starts from an identical known state.
 */
test.describe('Transaction Search', () => {
  test.beforeEach(async ({ george }) => {
    test.setTimeout(120_000);
    await george.navigateToDashboard();
    await george.openSearchFromMainNav();
  });

  /**
   * Scenario 1 — UI opens correctly
   * Verifies that clicking the Search icon exposes the keyword input field.
   * Assertion: keyword container is visible in the DOM.
   */
  test('search panel opens and keyword input is visible', async ({ george }) => {
    await george.expectSearchInputVisible();
  });

  /**
   * Scenario 2 — Happy path: known keyword returns matching transactions
   * The core acceptance criterion from the assignment.
   * Assertions:
   *   - At least one result containing "Fashion" is visible
   *   - Multiple matching items are present (count > 0)
   */
  test('search "Fashion" returns matching transaction results', async ({ george }) => {
    await george.searchTransactionsByKeyword('Fashion');
    await george.expectResultsContainKeyword('Fashion');
  });

  /**
   * Scenario 3 — Case-insensitive search
   * Banking search should not be case-sensitive; users may type in any casing.
   * Assertion: same results appear when searching lowercase "fashion".
   */
  test('search is case-insensitive — "fashion" returns Fashion results', async ({ george }) => {
    await george.searchTransactionsByKeyword('fashion');
    await george.expectResultsContainKeyword('Fashion');
  });

  /**
   * Scenario 4 — No-match / empty state
   * A keyword that has no matching transactions should show an empty state,
   * not a crash or a stale list of unrelated results.
   * Assertion: either a "no results" message is visible OR zero transaction
   * rows are rendered.
   */
  test('search with no matching keyword shows empty state', async ({ george }) => {
    await george.searchTransactionsByKeyword('XYZNOTEXIST99999');
    await george.expectNoResults();
  });
});
