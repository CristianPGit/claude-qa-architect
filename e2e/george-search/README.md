# search-test-scenario

Playwright E2E test suite targeting the George AT FAT banking app (`https://george.fat3.sparkasse.at/`).

## Setup

```bash
npm install
npx playwright install
```

## Running tests

```bash
npm run test:e2e          # Run all tests
npm run test:login        # Run only the login smoke test
npm run test:search       # Run all search scenarios
npm run test:ui           # Open Playwright UI mode
npm run test:codegen      # Launch Playwright codegen against the target app

# Run a single test by title
npx playwright test --grep "search Fashion"

# Run against a single browser
npx playwright test --project=chromium
```

## Architecture

**Pattern:** Page Object Model — all selectors and interactions live in `e2e/pages/george.page.ts` (`GeorgePage`). Test files instantiate `GeorgePage` and call its methods. No raw selectors appear in spec files.

**Session handling:** The George FAT app uses OAuth implicit flow — the access token is stored in `sessionStorage` (not cookies or localStorage), so Playwright's `storageState` file cannot capture it. Instead, `e2e/fixtures.ts` provides a worker-scoped `george` fixture that logs in once, keeps the browser context alive, and shares it across all tests. With `workers: 1` this means a single login per full test run.

**Key constraints:**
- `workers: 1` — tests run serially because they share a single FAT demo account
- Credentials are hardcoded in `george.page.ts` (`GEORGE_CREDENTIALS`) — the FAT environment uses fixed demo credentials
- Tests set `test.setTimeout(120_000)` due to slow FAT environment responses
- The search keyword input is located by a CSS module class (`keywordContainer--YGQKcpvu`); if the app is rebuilt this hash may change
- Login uses a two-step submit flow with deliberate 1-second pauses between steps

## Directory layout

```
e2e/
  pages/
    george.page.ts   # Page Object — all selectors, login, navigation, search interactions, assertions
  fixtures.ts        # Worker-scoped login fixture — login once per run, reuse session across tests
  login.spec.ts      # Smoke test: verifies login succeeds
  search.spec.ts     # Transaction search scenarios
playwright.config.ts
tsconfig.json
```

## Test scenarios — Transaction Search (`search.spec.ts`)

Login happens once via the worker-scoped `george` fixture. `beforeEach` navigates back to the dashboard and opens the search panel so each scenario starts from an identical known state.

| Scenario | Description |
|----------|-------------|
| Search panel opens | Asserts the keyword input is visible after clicking the Search icon |
| Happy path — "Fashion" | Searches for "Fashion" and asserts matching transactions appear |
| Case-insensitive | Searches lowercase "fashion" and asserts the same results appear |
| Empty state | Searches a non-existent keyword and asserts no results are shown |

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