import { test, expect, type Page } from '@playwright/test';
import { lintWebMcpTools } from './webmcp-lint';

/** Every WebMCP tool result here is `{ content: [{ type: 'text', text }] , isError? }`. */
type ToolResult = { content: { type: string; text: string }[]; isError?: boolean };

const call = async (page: Page, name: string, input: object) =>
  (await page.webmcp.callTool(name, input as never)) as ToolResult;
const json = (r: ToolResult) => JSON.parse(r.content[0].text);
const rows = (page: Page) => page.getByRole('table', { name: 'Transactions' }).locator('tbody tr');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('tool contract', () => {
  test('registers exactly the expected tools', async ({ page }) => {
    // A changed inventory is a contract change for every agent using the site: update on purpose.
    const names = (await page.webmcp.tools()).map((t) => t.name).sort();
    expect(names).toEqual(['add_transaction_note', 'search_transactions']);
  });

  test('tools are described well enough for an agent to use', async ({ page }) => {
    expect(lintWebMcpTools(await page.webmcp.tools())).toEqual([]);
  });

  test('read-only tools are annotated, state-changing ones are not', async ({ page }) => {
    const tools = Object.fromEntries((await page.webmcp.tools()).map((t) => [t.name, t]));
    expect(tools.search_transactions.annotations?.readOnly).toBe(true);
    expect(tools.add_transaction_note.annotations?.readOnly).toBeFalsy();
  });
});

test.describe('agent / human parity', () => {
  test('the search tool returns what a human search shows', async ({ page }) => {
    await page.getByLabel('Search transactions').fill('fashion');
    await page.getByRole('button', { name: 'Search' }).click();
    const humanRows = await rows(page).allTextContents();

    await page.reload();
    const result = await call(page, 'search_transactions', { query: 'fashion' });
    const agentRows = await rows(page).allTextContents();

    expect(result.isError).toBeFalsy();
    expect(json(result).count).toBe(2);
    expect(agentRows).toEqual(humanRows);
    await expect(page.getByLabel('Search transactions')).toHaveValue('fashion');
  });

  test('a note added by an agent is visible to the user', async ({ page }) => {
    const result = await call(page, 'add_transaction_note', { transactionId: 't2', note: 'weekly groceries' });
    expect(result.isError).toBeFalsy();
    await expect(page.locator('tr[data-id="t2"] .note')).toHaveText('weekly groceries');
  });
});

test.describe('bad input', () => {
  test('empty query is rejected as a tool error, not a crash', async ({ page }) => {
    const result = await call(page, 'search_transactions', { query: '  ' });
    expect(result.isError).toBe(true);
    await expect(rows(page)).toHaveCount(5);
  });

  test('unknown transaction id is rejected and nothing changes', async ({ page }) => {
    const result = await call(page, 'add_transaction_note', { transactionId: 't999', note: 'x' });
    expect(result).toMatchObject({ isError: true });
    expect(result.content[0].text).toContain('t999');
    await expect(page.locator('td.note').filter({ hasText: /\S/ })).toHaveCount(0);
  });

  test('over-long note is rejected', async ({ page }) => {
    const result = await call(page, 'add_transaction_note', { transactionId: 't1', note: 'x'.repeat(141) });
    expect(result.isError).toBe(true);
  });

  test('calling an unregistered tool throws', async ({ page }) => {
    await expect(page.webmcp.callTool('transfer_money', {})).rejects.toThrow(/transfer_money/);
  });
});
