# flaky

Run your test suite N times. Find the flaky tests. Fix them.

```
$ flaky -n 10 -- npx playwright test

  Flaky Test Detector
  Command:   npx playwright test
  Runs:      10
  Parser:    playwright
  Threshold: 0%

  [####################]  Run 10/10 PASS

  RESULTS
  ================================================================================

  Test                         Pass    Fail    Rate      Avg ms    Status
  ---------------------------  ------  ------  --------  --------  ------
  login with valid creds       10      0       100%      1204      OK
  search returns results       8       2       80%       3891      FLAKY
  empty search shows message   10      0       100%      892       OK
  special chars in search      6       4       60%       2103      FLAKY

  ---------------------------  ------  ------  --------  --------  ------
  Total: 4 tests  |  Flaky: 2  |  Always pass: 2  |  Always fail: 0
  Runs: 10  |  Duration: 4m 12s

  FLAKY TESTS:
    - Search > search returns results (80% pass rate)
    - Search > special chars in search (60% pass rate)
```

## Install

```bash
npm install -g flaky-test-detector
```

Or run directly:

```bash
npx flaky-test-detector -n 10 -- npx playwright test
```

## Usage

```bash
flaky [options] -- <test command>
```

Everything after `--` is the test command to run.

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `-n, --runs` | `5` | Number of times to run the suite |
| `-t, --threshold` | `0` | Min pass rate % to flag as flaky |
| `-f, --format` | `table` | Output format: `table`, `json`, `markdown` |
| `-o, --output` | stdout | Write report to a file |
| `-p, --parser` | `auto` | Parser: `auto`, `playwright`, `cypress`, `jest`, `exit-code` |

### Examples

```bash
# Playwright - 10 runs
flaky -n 10 -- npx playwright test

# Cypress - 5 runs, markdown report
flaky -n 5 -f markdown -o report.md -- npx cypress run

# Jest - only flag tests below 90% pass rate
flaky -n 20 -t 90 -- npx jest

# Vitest
flaky -n 8 -- npx vitest run

# Any command (exit-code only, no per-test breakdown)
flaky -n 10 -- make test
```

## Supported Frameworks

| Framework | Parser | Per-test breakdown |
|-----------|--------|--------------------|
| Playwright | `playwright` | Yes (JSON reporter) |
| Cypress | `cypress` | Yes (JSON reporter) |
| Jest | `jest` | Yes (`--json`) |
| Vitest | `jest` | Yes (compatible JSON) |
| Any | `exit-code` | No (pass/fail per run only) |

Auto-detection works by checking if the command contains `playwright`, `cypress`, `jest`, or `vitest`.

## Output Formats

### Table (default)

Human-readable terminal output with color-coded status.

### JSON (`-f json`)

Full structured report — pipe to `jq` or save for CI dashboards.

### Markdown (`-f markdown`)

Ready to paste into a PR comment or issue.

## CI Integration

Add to your CI pipeline to catch flaky tests before they merge:

```yaml
# GitHub Actions
- name: Flaky test check
  run: npx flaky-test-detector -n 5 -- npx playwright test
```

The CLI exits with code `1` if any flaky tests are found, so CI will fail.

## How It Works

1. Runs your test command N times
2. Injects the appropriate JSON reporter for your framework
3. Parses per-test pass/fail from each run
4. Aggregates results and calculates pass rates
5. Reports flaky tests (tests that sometimes pass, sometimes fail)

## License

MIT
