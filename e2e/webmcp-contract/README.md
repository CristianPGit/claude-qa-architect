# webmcp-contract

Contract tests for **WebMCP**, the experimental browser API that lets a web page register tools
for AI agents to call (`document.modelContext.registerTool`). A site that does this has a second
interface besides its UI, and that interface needs tests too. This suite shows how to write them
with Playwright 1.64's `page.webmcp`.

It runs against a local demo bank page (`site/index.html`) that registers two tools,
`search_transactions` and `add_transaction_note`. No remote environment or credentials are
needed.

```bash
npm run test:webmcp                        # from the repo root
npx playwright test --project=chromium     # from this directory
npm run serve                              # just the demo site, on http://localhost:4317
```

## What is tested

| | Area | Check |
|---|---|---|
| 📜 | Inventory | The page registers exactly the expected tools. Any change is a contract change for every agent using the site. |
| 🧹 | Agent-readiness | `lintWebMcpTools()`: snake_case names, real descriptions, an object `inputSchema`, every parameter described, `required` declared |
| 🔒 | Annotations | Read-only tools carry `readOnlyHint`; tools that change state don't |
| 🪞 | Agent / human parity | A tool call and the same action through the UI give the same result, and the user can see what the agent did |
| ❌ | Bad input | Invalid arguments come back as `isError` results, not exceptions, and change nothing. Unregistered tools throw. |

`tests/webmcp-lint.ts` doesn't depend on the demo site. Copy it into any suite and run
`expect(lintWebMcpTools(await page.webmcp.tools())).toEqual([])`.

## Browser support

WebMCP is behind flags, set per project in `playwright.config.ts`:

| Browser | How it's enabled | Where the page finds it |
|---|---|---|
| Chromium | `--enable-features=WebMCP` | `document.modelContext` |
| Firefox | prefs `dom.modelcontext.enabled` + `dom.modelcontext.testing.enabled` | `document.modelContext` |
| WebKit | not implemented | |

Chromium 156 exposes the API on `document`, not `navigator` as the draft spec has it. The demo
page uses `document.modelContext ?? navigator.modelContext`, so it works either way.

## Do agents actually use the tools well?

These tests check the tools themselves. To measure whether Claude picks the right tool, with the
right arguments, for plain-English requests, run the agent-eval example against the same site:

```bash
npm run serve -w e2e/webmcp-contract &
npm run eval -- packages/agent-eval/examples/webmcp.eval.json
```
