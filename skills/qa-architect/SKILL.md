---
name: qa-architect
description: Orchestrator that sets up end-to-end QA for a project in three phases — deep codebase analysis, an interactive questionnaire for what it can't auto-detect, and generation of a tailored QA setup (orchestrator + per-app sub-skills + calibration). Use when the user wants to "set up QA", "bootstrap testing for this repo", "configure QA Architect", or asks for a full QA workflow rather than a single test plan. For a one-off test plan use the test-cases skill instead.
---

# QA Architect — Setup Orchestrator

This is the entry point that tailors QA Architect to a specific codebase. It walks through
**three phases** and ends by writing a project-local QA setup the team can use every day.

Run this once per repo (or when the architecture changes meaningfully). For day-to-day work,
the `test-cases` and `automate-tests` skills are invoked directly.

---

## Phase 1 — Deep codebase analysis

Investigate the repo and build a structured picture. **Detect, don't ask** wherever the repo
already answers the question. Use Glob/Grep/Read (and the `Explore` agent for big repos).

Detect and record:

- **Apps & packages** — monorepo vs single app; workspaces (`pnpm-workspace.yaml`, `turbo.json`,
  `nx.json`, `lerna.json`); each app's entry point and purpose.
- **Tech stack** — languages, frameworks (Next.js, React, Vue, Express, Django, Rails…),
  package manager, build tooling.
- **Auth** — how users authenticate (NextAuth, Clerk, Auth0, Supabase, custom JWT, sessions),
  and what test credentials/roles exist.
- **Environments** — local/dev/staging/prod URLs and config; `.env.example` keys; which env is
  safe to test against.
- **Feature flags** — LaunchDarkly, Unleash, env-based flags, custom flag modules.
- **Integrations** — payments (Stripe), email, search, queues, third-party widgets, external APIs.
- **CI/CD** — `.github/workflows`, GitLab CI, CircleCI; existing test/lint/build jobs.
- **Existing tests** — frameworks (Playwright, Cypress, Jest, Vitest, pytest…), where they live,
  Page Object patterns, fixtures, naming conventions, current coverage gaps.
- **Issue tracker** — Linear/GitHub/Jira references in PR templates, commit conventions.

Produce a short written **analysis report** before moving on.

---

## Phase 2 — Interactive questionnaire

Ask the user **only what Phase 1 could not determine**. Batch the questions; don't interrogate
one at a time. Typical gaps:

- **QA target** — which app(s)/surface to focus on first; what "done" means for this team.
- **User personas & roles** — who uses it (admin, member, guest, anonymous) and how they differ.
- **Critical flows** — the 3–5 journeys that must never break (e.g. sign-up → checkout →
  receipt). These become the P1 backbone.
- **Test data & accounts** — seed strategy, sandbox credentials, what data is safe to create.
- **Cleanup strategy** — how to leave the environment clean (DB reset, API teardown, disposable
  accounts).
- **Risk areas** — where bugs hurt most (billing, auth, data integrity, compliance).
- **Calibration** — depth preference (lean vs thorough), categories to always/never include,
  prod-safety rules.

Record the answers; the calibration answers seed `.qa/preferences.md`.

---

## Phase 3 — QA setup generation

Write a tailored, project-local QA setup. Create:

1. **`.qa/project.md`** (runbook layer) — the Phase 1 analysis + Phase 2 answers as durable,
   read-mostly context: apps, stack, auth, environments, critical flows, personas, cleanup
   strategy, and hard prod-safety rules (see `templates/project.md`). Future runs read this so
   they don't re-analyze from scratch, and they treat it as read-only during work.
2. **`.qa/preferences.md`** (working-policy layer) — calibration seeded from Phase 2 (see
   `templates/preferences.md`). This is the file the `qa-calibration` skill updates over time.
3. **`.qa/calibration-log.md`** (audit layer) — an empty append-only ledger from
   `templates/calibration-log.md`, ready to attribute future lessons.
4. **Per-app notes** — for a monorepo, a short section per app: how to run it, its critical
   flows, its test framework, its env. (One `.qa/apps/<name>.md` per app, or sections in
   `project.md` for a single app.)
5. **A quickstart** — the exact commands to run the app and its tests, the browser driver to
   use, and the tracker (Linear/GitHub) wiring.

Then confirm the everyday workflow with the user:

- `test-cases` → generate a test plan for a task/PR.
- `automate-tests` → explore in the browser, write + run + auto-fix automated tests.
- `qa-calibration` → adjust depth/style any time; the lesson sticks.

---

## Notes

- Keep everything **project-local and committable** so the whole team inherits the setup.
- Don't generate code or tests in this phase — this skill produces the *configuration and
  context*. Actual test work happens in the other skills.
- Re-running is cheap: it refreshes the analysis and reconciles preferences rather than
  clobbering them.
