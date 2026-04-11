import { expect, type Page } from '@playwright/test';

export const GEORGE_CREDENTIALS = {
  baseUrl: 'https://george.fat3.sparkasse.at/',
  username: '101177144',
  password: '1111111',
  otp: '1111111',
} as const;

export class GeorgePage {
  constructor(private readonly page: Page) {}

  async login() {
    const { baseUrl, username, password, otp } = GEORGE_CREDENTIALS;

    await this.page.goto(baseUrl);
    await this.page
      .getByRole('dialog', { name: 'Cookie Banner' })
      .getByRole('button', { name: 'Close' })
      .click({ timeout: 5_000 })
      .catch(() => {});

    await this.page.locator('#user').fill(username);
    const submitButton = this.page.locator('#submitButton');
    const secretInput = this.page.locator('#secret');

    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    await submitButton.click();
    await secretInput.fill(password);
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    await submitButton.click();
  }

  async openSearchFromMainNav() {
    await this.page
      .getByRole('button', { name: /^(Search|Suche)$/i })
      .or(this.page.getByRole('link', { name: /^(Search|Suche)$/i }))
      .or(this.page.locator('[aria-label*="Search" i]'))
      .or(this.page.locator('[aria-label*="Suche" i]'))
      .first()
      .click({ timeout: 35_000 });
  }

  async searchTransactionsByKeyword(keyword: string) {
    const keywordBox = this.page
      .locator('[class*="keywordContainer--YGQKcpvu"]')
      .or(this.page.locator('[class*="keywordContainer"]'));
    await keywordBox.waitFor({ state: 'visible', timeout: 20_000 });
    const keywordInput = keywordBox.locator('input, textarea').first();
    await keywordInput.click({ timeout: 5_000 }).catch(() => keywordBox.click());
    await keywordInput.fill(keyword).catch(() => keywordBox.fill(keyword));
    await this.page.keyboard.press('Enter');
  }

  async expectResultsContainKeyword(keyword: string) {
    const hits = this.page.getByText(keyword, { exact: false });
    await expect(hits.first()).toBeVisible({ timeout: 25_000 });
    expect(await hits.count()).toBeGreaterThan(0);
  }

  async expectSearchInputVisible() {
    const keywordBox = this.page
      .locator('[class*="keywordContainer--YGQKcpvu"]')
      .or(this.page.locator('[class*="keywordContainer"]'));
    await expect(keywordBox).toBeVisible({ timeout: 20_000 });
  }

  async expectNoResults() {
    // Wait for loading to settle, then assert no transaction hits are present
    await this.page.waitForTimeout(3_000);
    const noResultsIndicator = this.page
      .getByText(/no results|keine Ergebnisse|nothing found|nichts gefunden/i)
      .or(this.page.locator('[class*="emptyState"], [class*="noResult"], [class*="empty-state"]'));
    const transactionItems = this.page.locator('[class*="transactionRow"], [class*="listItem"], [class*="transaction-item"]');
    const hasEmptyMessage = await noResultsIndicator.first().isVisible().catch(() => false);
    const itemCount = await transactionItems.count();
    expect(hasEmptyMessage || itemCount === 0).toBe(true);
  }
}
