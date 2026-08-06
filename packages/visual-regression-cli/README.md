# visual-regression-cli

<!-- Local-first visual regression testing for Playwright — baselines, diffs, and HTML reports without a SaaS dependency. -->
Visual regression testing for Playwright. Take baseline screenshots, compare on every run, get a beautiful HTML report with side-by-side diffs. Free, local, no external services.

Like Percy or Chromatic, but it lives in your repo.

## Why

Playwright has `toHaveScreenshot()` built in, but the reporting is buried in the test report and approving changes is awkward. This package adds:

- **HTML report** with baseline / current / diff side-by-side, expandable cards, dark theme
- **`vreg approve`** to promote all current snapshots to baselines in one command
- **Status command** for CI — exit code 1 if anything failed
- **Selector-based masking** for dynamic content (timestamps, ads)
- **Variants** to track the same snapshot across browsers/viewports

## Install

```bash
npm install -D visual-regression-cli playwright
```

## Quick start

### 1. Add `visualCheck` to your Playwright tests

```ts
import { test } from "@playwright/test";
import { visualCheck } from "visual-regression-cli";

test("homepage looks correct", async ({ page }) => {
  await page.goto("https://example.com");
  await visualCheck(page, "homepage");
});

test("product card matches design", async ({ page }) => {
  await page.goto("https://example.com/products/42");
  await visualCheck(page, "product-card", {
    selector: '[data-testid="product-card"]',
    mask: [".price-timestamp"],
    variant: "chromium-desktop",
  });
});
```

### 2. Run your tests

```bash
npx playwright test
```

The first run captures baselines. All subsequent runs compare against them.

### 3. View the report

```bash
npx vreg report
```

Generates `.visual-regression/report.html` and opens it. You get baseline / current / diff side-by-side, with failed and new snapshots auto-expanded.

### 4. Approve intentional changes

When a UI change is intentional, run:

```bash
npx vreg approve
```

This promotes all `current/*.png` to `baselines/*.png`. Commit the new baselines to git.

## API

### `visualCheck(page, name, options?)`

```ts
await visualCheck(page, "homepage", {
  threshold: 0.1,           // pixel match sensitivity (0-1)
  maxDiffPercent: 0.1,      // % of pixels allowed to differ
  mask: [".timestamp"],     // selectors to mask before capture
  fullPage: true,           // full page or viewport only
  selector: ".card",        // capture only this element
  variant: "chromium-1280", // browser/viewport label
});
```

Throws `VisualMismatchError` if the snapshot differs from baseline beyond `maxDiffPercent`.

On the first run (no baseline exists), it saves the screenshot as baseline and returns without throwing — flagged as "new" in reports.

### CLI commands

| Command | Description |
|---------|-------------|
| `vreg init` | Create a starter `tests/visual.example.spec.ts` |
| `vreg report` | Generate HTML report and open it |
| `vreg approve` | Promote all current snapshots to baselines |
| `vreg status` | Show pass/fail counts, exit 1 if failed |
| `vreg list` | List all existing baselines |
| `vreg clear` | Delete current + diff (keeps baselines) |

### CI Integration

```yaml
# .github/workflows/visual.yml
- name: Run visual tests
  run: npx playwright test

- name: Visual regression status
  if: always()
  run: npx vreg status

- name: Upload report
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: visual-report
    path: .visual-regression/report.html
```

When the workflow fails, reviewers download `report.html` and see exactly what changed.

## Directory layout

```
.visual-regression/
  baselines/                 # committed to git
    chromium-desktop/
      homepage.png
      product-card.png
  current/                   # gitignored — overwritten each run
    chromium-desktop/
      homepage.png
  diff/                      # gitignored — only on failure
    chromium-desktop/
      homepage.png
  results.json               # latest run data
  report.html                # generated report
```

Add to `.gitignore`:

```
.visual-regression/current/
.visual-regression/diff/
.visual-regression/report.html
.visual-regression/results.json
```

Commit `baselines/` so changes are visible in PR diffs.

## Comparison strategies

The pixel comparison uses [pixelmatch](https://github.com/mapbox/pixelmatch) with anti-aliasing detection. Two tuning knobs:

- **`threshold`** (default `0.1`) — how different two pixels must be before counting as changed. Lower = stricter.
- **`maxDiffPercent`** (default `0`) — what percentage of the image is allowed to differ before failing.

For most apps, start with `maxDiffPercent: 0.1` (0.1% tolerance). Fonts on macOS vs Linux can produce small subpixel differences; this allows for that without ignoring real changes.

## Masking dynamic content

Use `mask` to exclude regions that legitimately change every run:

```ts
await visualCheck(page, "dashboard", {
  mask: [
    ".live-clock",
    "[data-testid='last-updated']",
    ".user-avatar img",
  ],
});
```

Masked regions are painted over with a solid color in the screenshot, so the comparison treats them as identical.

## License

MIT
