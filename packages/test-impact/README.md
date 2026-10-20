# test-impact

Risk-based test selection. Give it a git diff and it picks the tags and features worth running,
says why, and falls back to the full suite whenever it can't be sure.

Why not just use Playwright's `--only-changed`? That follows imports, so it can't see domain
knowledge. In a BDD suite every generated spec imports the shared fixtures and the page object,
so in practice it selects nearly everything. A dependency bump or a config change also needs a
full run that no import graph shows. `test-impact` puts that knowledge in a small rules file
that lives next to the suite.

## Install

Not published to npm (the name is taken by an unrelated package). From the monorepo root:

```bash
npm install && npm run build
npm run impact -- -c path/to/suite/test-impact.json     # vs origin/main
```

## Usage

```bash
test-impact [options]                     # explain the selection
test-impact [options] --run -- <command>  # run <command> with --grep for the selection
```

| Flag | Default | Description |
|---|---|---|
| `-c, --config <file>` | `./test-impact.json` | Rules file; its directory is the suite |
| `-b, --base <ref>` | `origin/main` | Diff from the merge base with this ref, like a PR |
| `--committed-only` | off | Ignore uncommitted and untracked files (use in CI) |
| `-f, --format` | `table` | `table`, `markdown` (PR comment), `json`, `grep` (just the pattern) |
| `--run` | | Run the command after `--`, adding `--grep '<pattern>'` unless it's a full run |

```bash
npm run impact -- -c path/to/suite/test-impact.json --committed-only --run -- npx playwright test
```

## How it selects

1. Each changed file is matched against the rules' `paths` globs. Globs are relative to the rules
   file, and `../` reaches outside the suite. A match adds the rule's `tags` with its `risk`.
2. A rule tag of `"*"` forces a **full run**. Use it for config, dependencies and shared fixtures.
3. A changed `.feature` file selects its own scenarios by `Feature:` name, which playwright-bdd puts
   in every test title.
4. `always` tags (default `@smoke`) join every selection.
5. A changed file **inside the suite** that matches no rule and no `ignore` glob forces a full run
   and is listed as *unmapped*. An unclassified change is exactly where a narrow selection would
   miss a bug. Set `"unmapped": "ignore"` only if you accept that risk.

Files outside the suite that no rule mentions are reported and otherwise ignored.

```
  TEST IMPACT  (2 changed file(s) vs HEAD)
  ==============================================================================
  ▶ SELECTED  — risk: medium

  🟡 @search
       ← e2e/steps/search.steps.ts  (search steps)
  🟡 Login
       ← features/login.feature  (changed feature)
  ⚪ @smoke  (always)

  --grep "@smoke\\b|@search\\b|Login"
```

## Rules file

```json
{
  "always": ["@smoke"],
  "ignore": ["**/*.md", "test-impact.json"],
  "features": "features/**/*.feature",
  "unmapped": "all",
  "rules": [
    { "name": "config & deps", "paths": ["playwright.config.ts", "package.json", "../../package-lock.json"], "tags": ["*"], "risk": "high" },
    { "name": "page object", "paths": ["e2e/pages/app.page.ts"], "tags": ["@login", "@search"], "risk": "high" },
    { "name": "search steps", "paths": ["e2e/steps/search.steps.ts"], "tags": ["@search"] }
  ]
}
```

See [`examples/bdd-suite.test-impact.json`](examples/bdd-suite.test-impact.json) for a complete
rules file for a playwright-bdd suite (page object, step files, shared auth fixture). Copy it next
to your suite's `playwright.config.ts` and adjust the paths. In ticket-pilot, the
`acceptance-reviewer` agent runs this tool when a repo has a rules file and lists the tags the diff
puts at risk.

Feature names are matched as substrings, so a changed `Transaction Search` feature also selects
`Transaction Search - Edge Cases`. Selection can over-select but never drops a feature that
changed.
