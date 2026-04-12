# 🏦 George AT — E2E Test Suite

Playwright + Cucumber/Gherkin (BDD) end-to-end test suite targeting the **George AT FAT** banking app. Tests cover login, transaction search, edge cases, and data integrity using the Page Object Model pattern.

---

## ⚡ Tech Stack

| Tool | Purpose |
|------|---------|
| [Playwright](https://playwright.dev) | Browser automation & assertions |
| [playwright-bdd](https://github.com/vitalets/playwright-bdd) | BDD bridge — Gherkin → Playwright |
| Cucumber / Gherkin | Human-readable `.feature` files |
| TypeScript | Type-safe tests and page objects |
| Allure | Rich HTML test reports |

---

## ✨ Key Features

- 🔐 **Single login per run** — worker-scoped fixture logs in once and shares the session across all tests
- 📄 **BDD with Gherkin** — scenarios written in plain English, readable by non-developers
- 🧩 **Page Object Model** — all selectors and interactions in one place (`george.page.ts`)
- 📊 **Dual reporting** — Playwright HTML report + Allure dashboard with trend charts
- 🏷️ **Tag-based filtering** — run any subset of tests by tag (`@smoke`, `@search`, etc.)
- 🌐 **Cross-browser** — Chromium, Firefox, WebKit

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
npx playwright install
cp .env.example .env   # add your credentials to .env
```

### Run Tests

```bash
npm run test:e2e          # All features (all browsers)
npm run test:login        # @login scenarios only
npm run test:search       # @search scenarios only
npm run test:edge-case    # @edge-case scenarios only
npm run test:smoke        # @smoke scenarios only
npm run test:tag -- @ui   # Any specific tag
npm run test:ui           # Interactive Playwright UI mode
npm run test:codegen      # Launch codegen recorder
```

### Run on a single browser

```bash
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=chromium --headed   # with visible browser
```

### Reports

```bash
npm run report:allure        # Generate + open Allure dashboard
npm run report:allure:open   # Re-open an existing report
```

---

## 📁 Project Structure

```
search-test-scenario/
├── features/                        # Gherkin feature files
│   ├── login.feature                #   @login @smoke
│   ├── search.feature               #   @search — core search scenarios
│   └── edge-cases.feature           #   @search @edge-case — edge cases
│
├── e2e/
│   ├── pages/
│   │   ├── george.page.ts           #   Page Object — all selectors & interactions
│   │   └── fixtures.ts              #   Original Playwright fixtures (reference)
│   └── steps/
│       ├── fixtures.ts              #   BDD fixtures + worker-scoped auth session
│       ├── login.steps.ts           #   Given/When/Then — login
│       └── search.steps.ts          #   Given/When/Then — search & edge cases
│
├── .env                             # 🔒 Secrets — gitignored, copy from .env.example
├── .env.example                     # Credential template
├── playwright.config.ts             # Playwright + BDD configuration
├── tsconfig.json
└── package.json
```

> `.features-gen/` (auto-generated specs), `allure-results/`, and `allure-report/` are gitignored.

---

## 🧪 Test Structure Overview

### Test Flow

```
Login (once per run, worker-scoped)
    │
    ├─► Login Feature
    │       └── Successful login with valid credentials
    │
    └─► Search Feature (Background: navigate + open search panel)
            ├── Core Search Scenarios
            │       ├── Search panel UI is visible
            │       ├── Search "Fashion" returns results
            │       ├── Search is case-insensitive
            │       └── No match → empty state shown
            │
            └── Edge Case Scenarios
                    ├── Result rows contain date, merchant, and amount
                    ├── Search resets after navigating away and back
                    └── Rapid typing without Enter does not trigger search
```

### Automated Scenarios

#### 🔑 Login (`login.feature`)

| Scenario | Tags |
|----------|------|
| Successful login with valid credentials | `@login` `@smoke` |

#### 🔍 Transaction Search (`search.feature`)

All scenarios share a `Background`: navigate to dashboard → open search panel.

| Scenario | Tags |
|----------|------|
| Search panel opens and keyword input is visible | `@search` `@ui` |
| Search "Fashion" returns matching transaction results | `@search` `@happy-path` |
| Search is case-insensitive | `@search` `@happy-path` |
| No matching keyword shows empty state | `@search` `@negative` |

#### ⚠️ Edge Cases (`edge-cases.feature`)

| Scenario | Tags |
|----------|------|
| Result rows contain date, merchant name, and amount | `@search` `@edge-case` `@data-integrity` |
| Search resets after navigating away and back | `@search` `@edge-case` `@navigation` |
| Rapid typing without Enter does not trigger search | `@search` `@edge-case` `@debounce` |

---

## ✅ Assertion Types Implemented

| Assertion | Method | Scenario |
|-----------|--------|----------|
| Element is visible | `toBeVisible()` | Search input visible, result rows present |
| Text matches pattern | `toHaveText(/.+/)` | Date and merchant cells are not empty |
| Text contains currency | `toContainText(/€\|EUR/)` | Amount cell shows currency symbol |
| Result count > 0 | `toBeGreaterThan(0)` | At least one hit returned for valid keyword |
| No tables rendered | `toBe(0)` | Debounce — typing without Enter shows nothing |
| Field is empty | `toHaveValue('')` | Search input cleared after navigation reset |
| Empty state shown | `toBe(true)` | No results indicator OR zero transaction items |

---

## 🏷️ Tags Reference

| Tag | Scope | Description |
|-----|-------|-------------|
| `@login` | Feature | Login scenarios |
| `@smoke` | Feature | Quick sanity / smoke validation |
| `@search` | Feature | All transaction search scenarios |
| `@edge-case` | Feature | Edge case scenarios |
| `@ui` | Scenario | UI visibility checks |
| `@happy-path` | Scenario | Expected positive flows |
| `@negative` | Scenario | Negative / empty-state flows |
| `@data-integrity` | Scenario | Result content validation |
| `@navigation` | Scenario | Navigation resilience |
| `@debounce` | Scenario | Input debounce / submit gating |

---

## 🖐️ Manual Test Steps — Transaction Search

1. Copy `.env.example` → `.env` and fill in your credentials
2. Navigate to the app URL from `.env`
3. Dismiss the cookie banner
4. Enter your username → click **Next** → enter your password → click **Submit**
5. Click the **Search** icon in the main navigation bar
6. Type `Fashion` in the keyword input and press **Enter**
7. Verify a list of Fashion-related transactions appears
8. *(Optional)* Switch to English via **Settings → Language**

### 🔬 Additional Exploratory Scenarios

| Scenario | What to verify |
|----------|----------------|
| Partial keyword — search `Fash` | Does the app support partial matching? Documents the feature boundary |
| Special characters — `%`, `'`, `--`, `<script>` | No crash, no XSS, graceful handling |
| Very long input — 500-char string | No layout break, no crash, sensible response |
| Slow network — throttle to 3G in DevTools | Loading indicator appears, UI doesn't hang silently |
| Keyboard-only navigation | Focus ring visible, `aria-label` present for screen readers |
| Second test account — search `Fashion` | Results are account-scoped, no data leaking across accounts |
