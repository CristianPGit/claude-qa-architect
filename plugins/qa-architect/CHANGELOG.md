# Changelog

All notable changes to QA Architect are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

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
