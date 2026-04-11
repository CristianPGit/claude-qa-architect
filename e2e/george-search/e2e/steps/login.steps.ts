import { expect } from '@playwright/test';
import { Given, When, Then } from './fixtures';
import { GeorgePage, GEORGE_CREDENTIALS } from '../pages/george.page';

Given('I am on the George login page', async ({ page }) => {
  await page.goto(GEORGE_CREDENTIALS.baseUrl);
  await page
    .getByRole('dialog', { name: 'Cookie Banner' })
    .getByRole('button', { name: 'Close' })
    .click({ timeout: 5_000 })
    .catch(() => {});
});

When('I log in with valid credentials', async ({ page }) => {
  const george = new GeorgePage(page);
  await george.login();
});

Then('I should be on the dashboard', async ({ page }) => {
  await expect(page).toHaveURL(/george\.fat3\.sparkasse\.at/, { timeout: 60_000 });
});
