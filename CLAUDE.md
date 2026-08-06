# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**Claude QA Architect** — a monorepo of AI-assisted quality-engineering tooling, merged from eight
previously separate repositories. Four kinds of artifact live here, and they are built and shipped
in different ways:

| Path | Kind | Build |
|---|---|---|
| `plugins/*` | Claude Code plugins (markdown skills, agents, commands, hooks) | none — the markdown **is** the product |
| `packages/*` | TypeScript CLIs, npm workspaces | `tsc` → `dist/` |
| `apps/*` | Single-file static sites | none — open `index.html` |
| `e2e/george-search` | Playwright + BDD test suite | `bddgen` then `playwright test` |

Run npm commands from the repo root — it is an npm-workspaces monorepo with one hoisted
`node_modules`. Use `-w <workspace>` to target one package.

## Commands

```bash
npm install                # all workspaces
npm run build              # build every package with a build script
npm run typecheck          # tsc --noEmit across packages
npm run clean              # rm -rf packages/*/dist

npm run flaky     -- -n 10 -- npx playwright test
npm run self-heal -- -- npx playwright test
npm run vreg      -- --help

npm run test:e2e           # George search suite, all features
npm run test:smoke         # @smoke only
```

Suite-specific runs (from `e2e/george-search/`):

```bash
npm run test:login          # @login
npm run test:search         # @search
npm run test:edge-case      # @edge-case
npm run test:tag -- @ui     # any tag
npm run test:ui             # Playwright interactive UI
npm run test:codegen        # codegen recorder
npm run report:allure       # generate + open Allure
npx playwright test --project=chromium --headed
```

## Architecture notes

### `packages/*` — the CLIs

All three are ESM, `module: Node16`, and extend `tsconfig.base.json`. Each exposes one `bin`:
`flaky`, `self-heal`, `vreg`. Keep the shared compiler options in the base config — do not
re-inline them per package.

- **flaky-test-detector** — `runner.ts` executes the suite N times, per-framework parsers in
  `src/parsers/` (playwright, cypress, jest) normalize results, `analyzer.ts` ranks by pass rate.
  Adding a framework means adding a parser, nothing else.
- **self-healing-tests** — `error-parser.ts` reads the failure, `healer.ts` queries the live DOM via
  Playwright for a replacement selector, `patcher.ts` rewrites the test file. Depends on `playwright`.
- **visual-regression-cli** — `visual-check.ts` is the in-test helper, `comparator.ts` wraps
  `pixelmatch`, `storage.ts` owns the `.visual-regression/` baseline layout. `playwright` is a
  **peer** dependency here, not a direct one.

None of the three are published to npm, and two of the names (`flaky-test-detector`,
`visual-regression-cli`) are taken on the public registry by unrelated projects. Never write
`npm install <name>` install instructions for them.

### `plugins/*` — the Claude Code plugins

One marketplace manifest at the repo root, `.claude-plugin/marketplace.json`, lists both plugins and
points at `./plugins/<name>`. Each plugin keeps its own `.claude-plugin/plugin.json`. When bumping a
plugin version, bump it in **both** files — they are checked independently.

- **qa-architect** — skills in `skills/`, slash commands in `commands/`, one agent. Writes tiered
  working memory into the target repo's `.qa/` directory (`preferences.md`, `project.md`,
  `calibration-log.md` — templates in `templates/`).
- **ticket-pilot** — a six-agent pipeline with human gates. `hooks/guard.sh` blocks `git push`, PR
  creation, and Jira writes; that guard is load-bearing, do not weaken it when editing hooks.

### `e2e/george-search` — the reference suite

Targets the George AT FAT banking app at `https://george.fat3.sparkasse.at/`.

- **BDD pipeline:** Gherkin in `features/` compiles to Playwright specs via `bddgen`
  (playwright-bdd), output in `.features-gen/` (gitignored). Every `test:*` script runs `bddgen` first.
- **Page Object Model:** all selectors live in `e2e/pages/george.page.ts` (`GeorgePage`). Step
  definitions in `e2e/steps/` call page-object methods — never put selectors in steps.
- **Worker-scoped auth:** `e2e/steps/fixtures.ts` logs in once per worker. Necessary because the FAT
  environment has a single shared test account.
- **`workers: 1`** — required; the shared account cannot handle concurrent logins.
- **Tags:** `@login`, `@search`, `@edge-case`, `@smoke`, `@ui`, `@happy-path`, `@negative`,
  `@data-integrity`, `@navigation`, `@debounce`.
- The config parses `.env` manually — Playwright's auto-loading is unreliable through bddgen.

Constraints, do not "optimize" these away:

- **Slow environment** — 120s test timeout is deliberate. Do not reduce it.
- **CSS module selectors** — the search input uses a hashed class (e.g. `keywordContainer--YGQKcpvu`)
  that changes on app rebuilds. This is exactly what `self-healing-tests` exists to repair.
- **Two-step login** — username → Next → password → Submit, with deliberate pauses. The OTP field
  exists but is unused.
- **No local dev server** — every suite runs against the remote FAT environment.

### `apps/*` — the static sites

Deliberately single-file and dependency-free. `qa-swiss-knife/index.html` holds every tool; add one
by dropping in a `<section>` plus a render/handler function. Everything must stay client-side —
nothing the user pastes may leave the browser.

`agent-control-panel/kit/workflows/*.js` contain **literal absolute paths** at the top, because
workflow scripts get no filesystem or env access. They are workspace-specific by design; `install.sh`
prints which constants to edit after copying.

### `.claude/agents/` — the crew

Nine QA specialists (interpreter, hunter, saboteur, reviewer, fixer, scribe, gatekeeper, historian,
orchestrator), available across the whole monorepo. They came from qa-swiss-knife and are documented
in `apps/qa-swiss-knife/README.md`.

## Conventions

- **QA output format:** compact table, one row per case, emoji for type/priority, brief scenario
  notes — never verbose Given/When/Then blocks in chat.
- **Git history:** this repo is the original `claude-qa-architect` continued — its history was
  never rewritten. The plugin moved to `plugins/qa-architect/` (use `git log --follow` there), and
  the seven sibling projects were rewritten under their new paths with
  `git filter-repo --to-subdirectory-filter` before being merged (plain `git log -- <path>` works).
  Never rewrite this history.
- Ignore rules are consolidated in the root `.gitignore`; `e2e/george-search/.gitignore` carries only
  suite-local artifact paths. Do not reintroduce per-package ignore files.
- One `LICENSE` (MIT) at the root covers everything.
