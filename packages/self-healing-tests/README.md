# self-healing-tests

<!-- Auto-heals broken Playwright selectors by inspecting the live DOM at runtime. -->
Auto-fix broken Playwright selectors by inspecting the live DOM. When a CSS class hash changes, an element gets renamed, or a `data-testid` disappears, this tool finds the right replacement and patches your test files.

```
$ self-heal -- npx playwright test --project=chromium

  Self-Healing Tests
  Command:     npx playwright test --project=chromium
  Dry run:     false
  Verify:      false

  --- Attempt 1/1 ---

  [1/4] Running tests...
  Tests failed (exit code 1).

  [2/4] Parsing selector failures...
  Found 2 broken selector(s).

  [3/4] Healing selectors (inspecting live DOM)...
  Found fixes for 2/2 failure(s).

  [4/4] Applying patches...
  Patched 2 selector(s).

  SELF-HEALING REPORT
  ==============================================================================

  HEALED  Search panel opens and keyword input is visible
    File:     e2e/pages/app.page.ts:42
    Broken:   .keywordContainer--YGQKcpvu
    Fix:      getByPlaceholder('Search transactions')
    Strategy: placeholder-match (85% confidence)
    Element:  <input> "Search transactions"

  HEALED  Result rows contain search keyword
    File:     e2e/pages/app.page.ts:58
    Broken:   .resultRow--a8Kx2mNp
    Fix:      getByRole('row')
    Strategy: role-match (90% confidence)
    Element:  <tr> "Fashion Store -€29.99"

  ------------------------------------------------------------------------------
  Failures: 2  |  Healed: 2  |  Unhealed: 0  |  Verified: 0

  PATCHES:
    + e2e/pages/app.page.ts:42
      - .keywordContainer--YGQKcpvu
      + getByPlaceholder('Search transactions')
    + e2e/pages/app.page.ts:58
      - .resultRow--a8Kx2mNp
      + getByRole('row')
```

## Why

CSS module class names like `keywordContainer--YGQKcpvu` break on every app rebuild. You find out when your CI goes red, manually inspect the page, find the new selector, update your test file, push, wait for CI again.

This tool does that loop for you.

## Install

Part of the [Claude QA Architect](https://github.com/CristianPGit/claude-qa-architect) monorepo — build it once and the
`self-heal` CLI is available:

```bash
git clone https://github.com/CristianPGit/claude-qa-architect.git
cd claude-qa-architect
npm install
npm run build
node packages/self-healing-tests/dist/cli.js -- npx playwright test
```

To get a global `self-heal` command, link the workspace:

```bash
npm link -w self-healing-tests
```

> Not published to npm.

## Usage

```bash
self-heal [options] -- <playwright test command>
```

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--dry-run` | `false` | Show fixes without applying them |
| `--verify` | `false` | Re-run tests after patching to confirm |
| `--max-retries <n>` | `1` | Max heal+verify cycles |
| `--base-url <url>` | _(auto)_ | Page URL if not detected from errors |
| `--ai` | `false` | Ask Claude for a locator when no heuristic candidate reaches 90% |
| `--model <id>` | `claude-opus-5-5` | Claude model used by `--ai` |
| `-f, --format` | `table` | Output: `table`, `json`, `markdown` |
| `-o, --output` | stdout | Write report to file |

### Examples

```bash
# Fix broken selectors and apply patches
self-heal -- npx playwright test

# Preview fixes without touching files
self-heal --dry-run -- npx playwright test --project=chromium

# Fix, verify, retry up to 3 times
self-heal --verify --max-retries 3 -- npm run test:e2e

# Generate a markdown report for a PR comment
self-heal --dry-run -f markdown -o heal-report.md -- npx playwright test

# Provide base URL when tests don't include it in errors
self-heal --base-url https://myapp.com -- npx playwright test

# Let Claude propose role-based locators, review the diff before applying
self-heal --ai --dry-run -f markdown -o heal-report.md -- npx playwright test
```

### AI healing (`--ai`)

The heuristics guess from the broken selector's text, which fails exactly where it hurts most: a
hashed class like `keywordContainer--YGQKcpvu input` fuzzy-matches the container `<div>`, not the
input inside it. With `--ai`, any failure whose best heuristic candidate is below 90% goes to
Claude:

1. The healer captures the page's aria snapshot in Playwright's `ai` mode, where every element
   carries a ref (`textbox "Search keyword" [ref=e4]`).
2. Claude receives the broken selector, the error and the snapshot, and returns a structured
   suggestion: a `getByRole` / `getByLabel` / `getByPlaceholder` / `getByText` / `getByTestId`
   locator, the ref of the element it chose, a confidence and a one-line rationale.
3. The suggestion is accepted **only** if the locator matches exactly one element and that element
   is the one behind the ref. A plausible locator that lands on a different element is discarded,
   so a red test never turns into a wrongly green one.

The rationale is printed in the report (`Why:`). Credentials come from `ANTHROPIC_API_KEY` or an
`ant auth login` profile; without them `--ai` logs the error and falls back to heuristics. Requests
opt into server-side refusal fallbacks (`fallbacks: "default"`).

## How It Works

```
  Your tests fail
       |
       v
  Parse JSON report ──> Extract broken selectors + page URLs
       |
       v
  Open page in headless browser
       |
       v
  Search DOM using 8 strategies:
       |
       ├── data-testid match     (95% confidence)
       ├── role + name match     (90% confidence)
       ├── id match              (90% confidence)
       ├── placeholder match     (85% confidence)
       ├── aria-label match      (85% confidence)
       ├── text content match    (80% confidence)
       ├── structural match      (70% confidence)
       └── fuzzy class match     (60% confidence)
       |
       v
  Pick best candidate ──> Patch test file ──> (optional) Re-run to verify
```

### Selector strategies ranked by confidence

| Strategy | Confidence | When it's used |
|----------|-----------|----------------|
| `testid-match` | 95% | Element has `data-testid` |
| `role-match` | 90% | Element has ARIA role + accessible name |
| `id-match` | 90% | Element has a stable `id` attribute |
| `placeholder-match` | 85% | Input has `placeholder` text |
| `aria-label-match` | 85% | Element has `aria-label` |
| `text-match` | 80% | Element has visible text content |
| `structural-match` | 70% | Tag + nearby attributes match |
| `class-fuzzy-match` | 60% | Class name fragment matches (for CSS module hashes) |
| `ai-aria-match` | model's, max 95% | `--ai` only, and only after the ref check passes |

## CI Integration

```yaml
# GitHub Actions — auto-heal and commit fixes
- name: Run tests
  id: tests
  run: npx playwright test
  continue-on-error: true

- name: Heal broken selectors
  if: steps.tests.outcome == 'failure'
  run: npx self-heal --verify -- npx playwright test

- name: Commit fixes
  if: steps.tests.outcome == 'failure'
  run: |
    git diff --quiet || {
      git add -A
      git commit -m "fix: auto-heal broken selectors"
      git push
    }
```

## Limitations

- **Playwright only.** Parses Playwright's JSON reporter format. Cypress/Jest support could be added.
- **Needs page access.** The tool must be able to navigate to the page where the test failed. If the page requires auth, use `--base-url` or ensure the test's auth state is accessible.
- **CSS module hashes.** Fuzzy class matching works best when the base class name is stable (e.g., `keywordContainer` in `keywordContainer--YGQKcpvu`).
- **Not magic.** If the DOM structure changed completely (not just selectors), the tool won't find a match.

## License

MIT
