# Changelog

All notable changes to QA Architect are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

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
