# 🧰 Claude QA Architect

**One toolchain for AI-assisted quality engineering.** Claude Code plugins that turn tickets into
test cases and branches, CLI tools that hunt flakiness and heal broken selectors, offline browser
tools for the daily grind, and a real E2E suite to prove it all works.

Eight projects that grew up separately and kept reaching for each other. This is them in one place.

> Installing the QA Architect plugin? The command is unchanged — see [Quick start](#the-claude-code-plugins).

---

## The pipeline

Each piece covers one stage of the loop — and they hand off to each other.

```
  ticket / PR                                              green suite
      │                                                         ▲
      ▼                                                         │
┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────────┐
│ ticket-pilot│──▶│ qa-architect │──▶│  E2E suite   │──▶│ flaky-detector│
│  plan →     │   │  test cases  │   │  Playwright  │   │ self-healing  │
│  branch     │   │  + automation│   │  + BDD       │   │ visual-reg    │
└─────────────┘   └──────────────┘   └──────────────┘   └───────────────┘
      │                  │                                      │
      └──────────────────┴──── agent crew · swiss knife ────────┘
                         (the tools you reach for at every stage)
```

| Stage | Ask | Tool |
|---|---|---|
| 📥 **Intake** | *What does this ticket actually require?* | [`ticket-pilot`](plugins/ticket-pilot) |
| 🧪 **Design** | *What are the Happy / Sad / Edge cases?* | [`qa-architect`](plugins/qa-architect) |
| ⚙️ **Automate** | *Turn those cases into running tests* | [`qa-architect`](plugins/qa-architect) → [`e2e/search-suite`](e2e/search-suite) |
| 🎯 **Select** | *Which tests can this diff break?* | [`test-impact`](packages/test-impact) |
| 🔁 **Stabilize** | *Which tests lie to me?* | [`flaky-test-detector`](packages/flaky-test-detector) |
| 🩹 **Maintain** | *The selectors broke again* | [`self-healing-tests`](packages/self-healing-tests) |
| 👁️ **Verify** | *Did the UI change on purpose?* | [`visual-regression-cli`](packages/visual-regression-cli) |
| 🧠 **Evaluate AI** | *Does the agent / MCP server behave, every time?* | [`agent-eval`](packages/agent-eval) |
| 🔌 **Agent-ready web** | *Are the tools my site exposes to agents correct?* | [`e2e/webmcp-contract`](e2e/webmcp-contract) |
| 🧰 **Daily work** | *Decode this JWT / build this bug report* | [`qa-swiss-knife`](apps/qa-swiss-knife) |
| 🤖 **Orchestrate** | *Run a whole quality pass* | [`agent-control-panel`](apps/agent-control-panel) + [`.claude/agents/`](.claude/agents) |

---

## Layout

```
claude-qa-architect/
├── .claude/agents/           the QA agent crew — 9 specialists, usable repo-wide
├── .claude-plugin/           marketplace manifest for both Claude Code plugins
├── plugins/
│   ├── qa-architect/         AI QA engineer: test cases, browser exploration, automation
│   └── ticket-pilot/         Jira ticket → analyzed → planned → implemented → reviewed branch
├── packages/                 TypeScript CLIs (npm workspaces)
│   ├── agent-eval/           evals for AI features & MCP servers: pass@k, pass^k, flaky
│   ├── flaky-test-detector/  run a suite N times, rank tests by flakiness
│   ├── self-healing-tests/   fix broken Playwright selectors from the live DOM (+ Claude, --ai)
│   ├── test-impact/          risk-based test selection from the git diff
│   └── visual-regression-cli/snapshot · diff · approve, with HTML reports
├── apps/                     zero-build static sites
│   ├── qa-swiss-knife/       offline QA toolbox (JSON, JWT, regex, test data, …)
│   └── agent-control-panel/  clickable panel that composes multi-agent slash commands
├── e2e/search-suite/        reference Playwright + BDD suite (demo app)
├── e2e/webmcp-contract/      WebMCP contract tests against a local demo site
└── docs/                     notes and guides
```

---

## Quick start

### The Claude Code plugins

Both plugins ship from one marketplace:

```bash
/plugin marketplace add CristianPGit/claude-qa-architect
/plugin install qa-architect@qa-architect
/plugin install ticket-pilot@qa-architect
```

Then `/test-cases LIN-123`, `/qa-automate`, `/ticket PROJ-456`, `/triage`, `/standup`.

### The CLIs

```bash
npm install        # installs every workspace
npm run build      # compiles every CLI to dist/

npm run flaky      -- -n 10 -- npx playwright test
npm run self-heal  -- --ai -- npx playwright test
npm run vreg       -- --help
npm run eval       -- packages/agent-eval/examples/command.eval.json
npm run impact                       # which search tests does this branch put at risk?
```

Prefer bare `flaky` / `self-heal` / `vreg` / `agent-eval` / `test-impact` commands? `npm link -w <package-name>`.

> None of the CLIs are published to npm. Four of those names are taken on the public registry by
> unrelated projects — install from this repo, not from npm.

### The static apps

No build, no server. Open the file:

```bash
open apps/qa-swiss-knife/index.html
open apps/agent-control-panel/index.html
```

`qa-swiss-knife` is also live at **<https://cristianpgit.github.io/qa-swiss-knife/>**.

### The E2E suite

```bash
cp e2e/search-suite/.env.example e2e/search-suite/.env   # fill in credentials
npx playwright install
npm run test:e2e       # every feature
npm run test:smoke     # @smoke only
```

Per-tag runs and Allure reports: see [`e2e/search-suite/README.md`](e2e/search-suite/README.md).

```bash
npm run test:webmcp    # WebMCP contract suite: local, no credentials
```

### CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and PR: typecheck and
build of every workspace, an offline agent-eval run, the WebMCP contract suite on Chromium and
Firefox, and on PRs a test-impact summary for the search suite.
[`remote-smoke.yml`](.github/workflows/remote-smoke.yml) runs `@smoke` against the remote test env on
demand, and on weekday mornings once the repository variable `REMOTE_SMOKE_ENABLED` is `true`.
It needs the `APP_*` repository secrets.

### The agent crew

Nine QA specialists in [`.claude/agents/`](.claude/agents) — interpreter, hunter, saboteur, reviewer,
fixer, scribe, gatekeeper, historian, orchestrator. They work anywhere in this repo as-is. To take
them elsewhere:

```bash
cp -r .claude/agents/ your-project/.claude/agents/
```

---

## Working on the monorepo

| Command | What it does |
|---|---|
| `npm install` | Install all workspaces (hoisted to one `node_modules`) |
| `npm run build` | Build every package that has a build script |
| `npm run typecheck` | `tsc --noEmit` across all packages |
| `npm run clean` | Remove `packages/*/dist` |
| `npm run test:e2e` | Run the search suite |

The three CLI packages share [`tsconfig.base.json`](tsconfig.base.json). The static apps and the
plugins have no build step — they are the deliverable.

## History

This repository **is** the original `claude-qa-architect`, continued. Its history was never
rewritten — the plugin simply moved into `plugins/qa-architect/`, and the seven sibling projects
were merged in alongside it. Every commit from all eight projects is reachable:

```bash
# the seven merged-in projects — plain path log works
git log -- packages/flaky-test-detector/src/analyzer.ts
git log -- e2e/search-suite/e2e/pages/app.page.ts
git blame plugins/ticket-pilot/skills/ticket/SKILL.md

# qa-architect itself moved, so follow the rename
git log --follow -- plugins/qa-architect/skills/test-cases/SKILL.md
```

Merged in from their own repositories: `claude-ticket-pilot`, `flaky-test-detector`,
`self-healing-tests`, `visual-regression-cli`, `qa-swiss-knife`, `claude-agent-control-panel`,
and `search-test-scenario`. Those standalone repositories have since been retired — this is the
only place the code lives now, and the only place it gets updated.

## License

MIT — see [LICENSE](LICENSE).
