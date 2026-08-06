import { Given, When, Then } from './fixtures';

Given('the user is logged in and on the dashboard', async ({ george }) => {
  await george.navigateToDashboard();
});

Given('the user opens the search panel', async ({ george }) => {
  await george.openSearchFromMainNav();
});

Given('the user has searched for {string}', async ({ george }, keyword: string) => {
  await george.searchTransactionsByKeyword(keyword);
  await george.expectResultsContainKeyword(keyword);
});

When('the user searches for {string}', async ({ george }, keyword: string) => {
  await george.searchTransactionsByKeyword(keyword);
});

When('the user navigates to the Overview page', async ({ george }) => {
  await george.navigateToOverview();
});

When('the user returns to the search panel', async ({ george }) => {
  await george.openSearchFromMainNav();
});

When('the user types {string} quickly without pressing Enter', async ({ george }, keyword: string) => {
  await george.typeKeywordWithoutSubmitting(keyword);
});

When('waits briefly for any debounced requests to fire', async ({ george }) => {
  await george.page.waitForTimeout(2_000);
});

Then('the keyword input field should be visible', async ({ george }) => {
  await george.expectSearchInputVisible();
});

Then('transaction results containing {string} should be visible', async ({ george }, keyword: string) => {
  await george.expectResultsContainKeyword(keyword);
});

Then('no results should be displayed', async ({ george }) => {
  await george.expectNoResults();
});

Then('each result row should contain a date, merchant name, and amount with currency', async ({ george }) => {
  await george.expectResultRowsHaveRequiredFields();
});

Then('the search field should be empty with no stale results', async ({ george }) => {
  await george.expectSearchFieldClean();
});

Then('no transaction tables should be rendered', async ({ george }) => {
  await george.expectNoTransactionTables();
});
