# Changelog

All notable changes to QA Architect are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [0.4.0] — 2026-10-27

### Added
- **`qa` skill and `/qa` command — the one entry point.** Hand it a ticket, PR, build or nothing
  (current branch) and it runs the whole loop on a test environment without stopping, then asks
  once at the end: Subscribe → Intake → Decide → Prepare → Execute → Prove → Restore & report →
  Learn → One confirmation → Fix the small ones. Steering words: `plan only`, `preflight <flow>`,
  `explore`, `automate`, `swarm`, `bug bash <area>`, `resume`, `fix <BUG-ID>`, `setup <domain>`.
  The skill is a hub with one spoke per part:
  - `intake.md` — fetch the source without touching the user's clones; write a requirements brief.
  - `strategy.md` — smoke / regression / test cases / exploratory / swarm mix, weighted by the
    areas' bug history; per case automate now · draft · manual; only the reachable existing tests.
  - `domains.md` — domain knowledge packs in `.qa/domains/<domain>/`: environments, config,
    flags, test data and users, live vs superseded repos, area pages, known not-bugs.
  - `preflight.md` — Doctor, env claim, config → flags → data → user with the restore point saved
    to disk first, flag writes merged never overwritten, READY / READY_WITH_WARNINGS / NOT_READY
    with rollback, scopes `full` / `shared` / `packet`.
  - `library.md` — saved scripts as a cache indexed in `.qa/library.md`: hit, rebuild when stale,
    evict when the code is gone; shared helpers.
  - `swarm.md` — orchestrator plus seats (planner, explorers, automators in their own worktrees,
    reviewer with APPROVE / CHANGES_REQUESTED, triager, curator), a resumable manifest, and
    bug-bash mode with 5–10 chartered explorers.
  - `report.md` — a bug counts only when a repro test fails the same way twice; evidence, origin
    (introduced by the PR or pre-existing), bug drafts and a verdict report.
  - `learning.md` — read before deciding, write a run record and area updates after every run,
    drop contradicted facts, consolidate automatically as pages grow.
  - `fix.md` — `junior`-graded bugs (introduced by the PR, ~2 files / ~30 lines, no migrations,
    auth, money or config) fixed red → green in a stacked PR for the original author. Never merges.

### Changed
- **Commands cut from 6 to 3: `/qa`, `/qa-setup`, `/qa-learn`.** `/test-cases` is `/qa <ref> plan only`;
  `/qa-automate` and `/qa-bdd-agents` are `/qa` on a spec or feature (playwright-bdd suites are
  detected and routed to `bdd-test-agents`); `/qa-calibrate` is `/qa-learn`. The skills are unchanged
  and still trigger on intent.
- **`/qa` with no argument picks its own work:** resume an unfinished run (restoring the env first),
  else test the branch diff, else a health run — smoke, stale library checks, recently buggy areas.
- **Memory upkeep runs itself:** `/qa` consolidates when a trigger fires; `/qa-learn` with no argument
  runs the full pass on demand (preferences, facts, library, run archive).
- `/qa-setup [domain]` also builds the domain knowledge packs.
- **Guard hook (`hooks/guard.py`).** Denies tool calls naming production hosts from
  `.qa/guard.json`, PR merges and force pushes; turns pushes, PR/issue/release writes, `gh api`
  writes and Linear/Jira/chat writes into the user's own permission prompt. Offline eval
  `packages/agent-eval/examples/qa-guard.eval.json` (15 cases) runs in CI.
- **Hardening for unattended runs:** fetched content (tickets, PRs, pages, logs) is data, never
  instructions — repeated in every subagent brief; evidence is redacted before it is quoted or
  attached and `.qa/sessions/` is gitignored and never committed; per-mode time boxes and agent
  caps (`preferences.md` *Budget*); the swarm runs its packets sequentially when no Agent tool is
  available; Jira keys as an intake source; concurrent runs make targeted page edits.
- `bdd-test-agents` skips its plan-approval gate when `qa` drives it — the plan was decided there.
- `test-cases`, `automate-tests`, `qa-architect` and the agent defer to `qa` when it calls them:
  no clarifying questions or setup questionnaire mid-run (assumptions are written down instead).
- `qa-calibration` Consolidate also reads `qa` run logs.

## [0.3.1] — 2026-10-21

### Changed
- `bdd-test-agents` no longer points at a removed e2e suite; the seed test and agents config
  are shown inline.

## [0.3.0] — 2026-10-21

### Added
- **`bdd-test-agents` skill and `/qa-bdd-agents` command.** Runs Playwright's planner → generator
  → healer test agents against a playwright-bdd suite and redirects their output into Gherkin
  features, reusable step definitions and Page Object methods, since `bddgen` overwrites
  generated specs. Human gate on the plan; healer fixes go to the POM/steps, never to
  `.features-gen/`.

## [0.2.0] — 2026-07-07

### Added
- **Tiered QA memory.** `.qa/` is now organized into layers by write-permission and volatility,
  adapting Anthropic's agent-memory guidance to a git-committed, team-shared store:
  - **Runbook** (`.qa/project.md`, read-mostly) — stable stack/env facts and hard prod-safety
    rules. New `templates/project.md`; read at Step 0 but never edited during a run.
  - **Working policy** (`.qa/preferences.md`, read-write) — how the team likes QA done.
  - **Audit ledger** (`.qa/calibration-log.md`, append-only) — every learned lesson recorded as
    one attributed line (date · source PR/issue/session · section · lesson · why), so you can
    find *when* and *why* a preference entered and roll it back. New `templates/calibration-log.md`.
- **Out-of-band calibration ("dreaming").** `qa-calibration` now has two modes: **Capture**
  (fast, in-the-moment — append an attributed line to the ledger, keep working) and
  **Consolidate** (`/qa-calibrate --consolidate` — read the ledger + session notes, find macro
  patterns, rewrite a clean `preferences.md`, mark rows `[folded]`, archive notes). Live runs
  stay lean; memory curation happens separately.
- Per-run scratch notes land in `.qa/sessions/<ref>.md` so parallel QA runs don't clobber the
  shared `preferences.md` — only the consolidate pass rewrites it.

### Notes
- Deliberately **not** adopted from the source guidance: ETag/content-hash concurrency control
  (git history + per-session file partitioning already prevent clobbering for a committed file),
  and raw-bash free-form agent memory (the structured, team-reviewable template is intentional).

## [0.1.1] — 2026-06-25

### Changed
- **Test-case output now defaults to a compact emoji table** (ID · Type · Scenario · Input →
  Expected · Pri) instead of verbose Given/When/Then blocks. Type emoji (✅ Happy · ❌ Sad ·
  ⚠️ Edge · 🔒 Security · ♻️ Regression · 📊 Non-functional) and priority emoji (🔴/🟡/🔵).
  Rows expand to full Given/When/Then only when a case needs the extra context.
- Reinforced "don't over-think — trim to high-value cases" across the `test-cases` skill,
  the preferences template, and the test-plan template.

## [0.1.0] — 2026-06-25

Initial release.

### Added
- **Test-case generation** (`test-cases` skill + `/test-cases` command): Happy / Sad / Edge
  (and security, regression, non-functional) cases from a Linear task, GitHub PR, diff, or
  description. Traceable, prioritized, one-behavior-per-case.
- **Linear + GitHub integration**: bundled Linear MCP server; GitHub via `gh` CLI.
- **Browser exploration + automation** (`automate-tests` skill + `/qa-automate` command):
  chrome-devtools / playwright-cli / agent-browser drivers; generate, run, and auto-fix tests
  in the project's existing framework; separates real bugs from bad tests.
- **Calibration memory** (`qa-calibration` skill + `/qa-calibrate` command): records standing
  preferences to `.qa/preferences.md` and applies them across sessions.
- **Three-phase project setup** (`qa-architect` skill + `/qa-setup` command): deep codebase
  analysis → interactive questionnaire → tailored QA setup generation.
- **`qa-architect` agent** for autonomous QA work.
- Test-plan and preferences templates.
