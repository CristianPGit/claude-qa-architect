# search-test-scenario

Playwright + Cucumber/Gherkin (BDD) E2E test suite targeting the George AT FAT banking app (`https://george.fat3.sparkasse.at/`).

## Setup

```bash
npm install
npx playwright install
```

## Running tests

```bash
npm run test:e2e          # Run all features
npm run test:login        # Run @login tagged scenarios
npm run test:search       # Run @search tagged scenarios
npm run test:edge-case    # Run @edge-case tagged scenarios
npm run test:smoke        # Run @smoke tagged scenarios
npm run test:tag -- @ui   # Run any specific tag
npm run test:ui           # Open Playwright UI mode
npm run test:codegen      # Launch Playwright codegen against the target app

# Run against a single browser
npx playwright test --project=chromium
```

## Architecture

### BDD with Cucumber/Gherkin

Tests are written in Gherkin syntax (`.feature` files) and wired to Playwright via [playwright-bdd](https://github.com/vitalets/playwright-bdd). The `bddgen` command generates Playwright spec files from the features before each test run.

### Page Object Model

All selectors and interactions live in `e2e/pages/george.page.ts` (`GeorgePage`). Step definitions call `GeorgePage` methods — no raw selectors appear in steps or features.

### Session handling

The George FAT app uses OAuth implicit flow — the access token is stored in `sessionStorage` (not cookies or localStorage), so Playwright's `storageState` cannot capture it. Instead, `e2e/steps/fixtures.ts` provides a worker-scoped `authenticatedPage` fixture that logs in once, keeps the browser context alive, and shares it across all tests. With `workers: 1` this means a single login per full test run.

### Key constraints

- `workers: 1` — tests run serially because they share a single FAT demo account
- Credentials are hardcoded in `george.page.ts` (`GEORGE_CREDENTIALS`) — the FAT environment uses fixed demo credentials
- Tests use 120s timeout due to slow FAT environment responses
- The search keyword input is located by a CSS module class (`keywordContainer--YGQKcpvu`); if the app is rebuilt this hash may change
- Login uses a two-step submit flow with deliberate 1-second pauses between steps

## Directory layout

```
features/                        # Gherkin feature files
  login.feature                  #   @login @smoke
  search.feature                 #   @search — core search scenarios
  edge-cases.feature             #   @search @edge-case — edge case scenarios
e2e/
  steps/                         # BDD step definitions
    fixtures.ts                  #   BDD test fixtures (createBdd + worker-scoped auth)
    login.steps.ts               #   Given/When/Then for login
    search.steps.ts              #   Given/When/Then for search + edge cases
  pages/
    george.page.ts               #   Page Object — selectors, login, navigation, search, assertions
    fixtures.ts                  #   Original Playwright fixtures (kept for reference)
.features-gen/                   # Auto-generated specs from .feature files (gitignored)
playwright.config.ts             # Playwright + BDD config
tsconfig.json
```

## Tags

Tags can be applied at Feature or Scenario level in `.feature` files and used to filter test runs.

| Tag | Scope | Description |
|-----|-------|-------------|
| `@login` | Feature | Login scenarios |
| `@smoke` | Feature | Smoke tests for quick validation |
| `@search` | Feature | All transaction search scenarios |
| `@edge-case` | Feature | Edge case scenarios |
| `@ui` | Scenario | UI visibility checks |
| `@happy-path` | Scenario | Expected positive flows |
| `@negative` | Scenario | Negative / empty-state flows |
| `@data-integrity` | Scenario | Result content validation |
| `@navigation` | Scenario | Navigation resilience |
| `@debounce` | Scenario | Input debounce behavior |

## Feature files

### Login (`login.feature`)

| Scenario | Tags |
|----------|------|
| Successful login with valid credentials | `@login @smoke` |

### Transaction Search (`search.feature`)

All scenarios share a `Background` that navigates to the dashboard and opens the search panel.

| Scenario | Tags |
|----------|------|
| Search panel opens and keyword input is visible | `@search @ui` |
| Search "Fashion" returns matching transaction results | `@search @happy-path` |
| Search is case-insensitive | `@search @happy-path` |
| No matching keyword shows empty state | `@search @negative` |

### Edge Cases (`edge-cases.feature`)

| Scenario | Tags |
|----------|------|
| Result rows contain date, merchant name, and amount | `@search @edge-case @data-integrity` |
| Search resets after navigating away and back | `@search @edge-case @navigation` |
| Rapid typing without Enter does not trigger search results | `@search @edge-case @debounce` |

## Manual test steps — Transaction Search

1. Navigate to `https://george.fat3.sparkasse.at/`
2. Dismiss the cookie banner
3. Enter username `101177144`, click Next, enter password `1111111`, click Submit
4. Click the **Search** icon in the main navigation bar
5. Type `Fashion` in the keyword input and press Enter
6. Verify a list of Fashion-related transactions appears
7. (Optional) Switch the interface to English via **Settings > Language**

### Additional manual scenarios

**Partial keyword match**
Search for `"Fash"` — verify whether the app supports partial matching or requires the full word. Documents the feature boundary.

**Special characters / SQL-like input**
Try `%`, `'`, `--`, `<script>` — confirms the app handles them gracefully without errors or XSS.

**Very long input**
Paste a 500-character string — verify no crash, no layout break, and a sensible response.

**No network / slow network**
Throttle the connection in DevTools to 3G and search — confirm a loading indicator appears and the UI doesn't hang silently.

**Accessibility**
Tab through the search flow using keyboard only, check that the input has a visible focus ring and that a screen reader label is present (`aria-label` or `<label>`).

**Different account / no matching data**
If a second test account is available, log in as that user and search `"Fashion"` — confirm the results are account-scoped and not leaking data across accounts.
