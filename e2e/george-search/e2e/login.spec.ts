import { test } from '@playwright/test';

test('login', async ({ page }) => {
  await page.goto('https://george.fat3.sparkasse.at/');
  await page.getByRole('dialog', { name: 'Cookie Banner' }).getByRole('button', { name: 'Close' }).click({ timeout: 5_000 }).catch(() => {});

  await page.locator('#user').fill('101177144');
  await page.locator('#submitButton').click();
  await page.locator('#secret').fill('1111111');
  await page.locator('#submitButton').click();
});
