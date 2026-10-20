# flaky

<!-- Run your test suite N times, find the flaky tests, and fix them. -->
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

Part of the [Claude QA Architect](https://github.com/CristianPGit/claude-qa-architect) monorepo — build it once and the
`flaky` CLI is available:

```bash
git clone https://github.com/CristianPGit/claude-qa-architect.git
cd claude-qa-architect
npm install
npm run build
node packages/flaky-test-detector/dist/cli.js -n 10 -- npx playwright test
```

To get a global `flaky` command, link the workspace:

```bash
npm link -w flaky-test-detector
```

> Not published to npm. The `flaky-test-detector` name on the public registry belongs to an
> unrelated project — don't `npm install` it expecting this tool.

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
| `--explain` | `false` | Have Claude diagnose every flaky test (see below) |
| `--model <id>` | `claude-opus-5-5` | Claude model for `--explain` |

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

# Find the flaky tests and have Claude explain each one
flaky -n 10 --explain -f markdown -o flaky.md -- npx playwright test
```

### Diagnosing flakes (`--explain`)

Every flaky test in the report includes evidence, with or without `--explain`:

- **History**: one mark per run, in order (`✓✓✗✓✗`). Failures clustered at the start look
  different from failures that alternate.
- **Pass / fail duration**: failing runs that are much slower than passing ones point to waits and
  timeouts.
- **Distinct errors** with how many runs produced each, plus the test's file and line.

With `--explain`, Claude receives that evidence and the test's source, and returns one diagnosis
per flaky test:

| Field | Values |
|---|---|
| category | `timing` · `test-order` · `test-data` · `environment` · `selector` · `product-race` (a real bug) · `unknown` |
| rootCause | One paragraph, grounded in the evidence |
| evidence | The error line, history pattern or source line it relies on |
| fix | The smallest change, and how to confirm the diagnosis |
| confidence | `low` · `medium` · `high` |

Credentials come from `ANTHROPIC_API_KEY` or an `ant auth login` profile. Without them the run
still completes and prints why the diagnosis was skipped. For the full "when did this start, what
changed" investigation, hand the JSON report to the `historian` agent in `.claude/agents/`.

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
