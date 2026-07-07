---
name: automate-tests
description: Turn test cases into runnable automated tests, drive a real browser to explore and verify behavior, run the tests, and auto-fix them until they pass. Use when the user asks to "automate these tests", "write a Playwright/Cypress test", "test this in the browser", "explore the app", or "make the failing test pass". Picks chrome-devtools, playwright-cli, or agent-browser based on what's available.
---

# Automated Testing & Browser Exploration

You take test cases (from the `test-cases` skill or supplied directly) and make them **real**:
explore the running app in a browser, generate automated tests in the project's existing
framework, run them, and iterate until they pass for the right reasons.

## Step 0 — Load calibration (tiered memory) & detect the stack

1. Read QA memory in layer order: `.qa/project.md` (runbook — stack, environments, prod-safety;
   read-only), then `.qa/preferences.md` (working policy — how the team likes QA done), then
   `CLAUDE.md`. Keep the live run lean — don't rewrite `preferences.md` mid-task; route any
   in-the-moment feedback to the `qa-calibration` skill's Capture mode.
2. Detect the existing test framework so you match it instead of inventing a new one:
   - `package.json` deps / scripts → Playwright (`@playwright/test`), Cypress, Jest, Vitest, etc.
   - Existing test dirs: `e2e/`, `tests/`, `cypress/`, `*.spec.ts`, `*.cy.ts`.
   - Config files: `playwright.config.*`, `cypress.config.*`, `vitest.config.*`.
3. **Always extend the existing pattern** — same framework, same Page Object Model, same
   fixtures, same naming. Only introduce a new framework if the project has none and the user
   approves.

## Step 1 — Choose the browser driver

You have up to three ways to drive a browser. Pick by availability, in this order, unless the
user specifies one:

1. **playwright-cli / `@playwright/mcp`** — best when the project already uses Playwright.
   Use `npx playwright codegen <url>` to record flows, or the Playwright MCP tools to navigate,
   click, fill, and assert. Generated code drops straight into the suite.
2. **chrome-devtools MCP** — best for *exploration and diagnosis*: real Chrome, network
   inspection (`list_network_requests`), console errors (`list_console_messages`), performance
   traces, Lighthouse audits, and DOM snapshots (`take_snapshot`) to find stable selectors.
3. **agent-browser** — when present, a high-level autonomous browsing agent. Good for
   open-ended "go figure out how this flow behaves" exploration.

State which driver you chose and why in one line, then proceed.

## Step 2 — Explore before you assert

Don't write blind tests. First drive the app to *observe* the real behavior:

- Navigate the happy path manually via the driver. Capture the actual selectors, URLs,
  network calls, and success/error states.
- Use a DOM snapshot to find **stable, accessible selectors** (roles, labels, `data-testid`)
  rather than brittle hashed CSS classes.
- Watch the console and network panels for errors the UI hides — these become Sad-Path cases.
- Note real timing: which actions need an explicit wait for a network response vs. a visible
  element. Prefer web-first assertions / waiting for state, never fixed `sleep`s.

This exploration step is also how you **discover test cases you couldn't see from code** —
feed anything new back to the `test-cases` skill.

## Step 3 — Generate the automated tests

- Mirror the project's structure: selectors in the Page Object, steps/specs reference the POM.
- One test per behavior, named after the test case (`TC-03 sad path: invalid coupon`).
- Use the framework's auto-waiting and web-first assertions. No arbitrary timeouts unless the
  project (e.g. a slow staging env) requires them — respect existing timeout conventions.
- Seed/cleanup: follow the project's strategy (fixtures, API setup, test accounts). If state
  cleanup is undefined, ask rather than leaving the suite dirty.
- Keep secrets in `.env` / the project's existing config — never hardcode credentials.

## Step 4 — Run and auto-fix (the loop)

Run the tests and iterate until green **for the right reason**:

1. Run the targeted test(s) (e.g. `npx playwright test path/to/spec --project=chromium`).
2. On failure, read the actual error, trace, screenshot, and (Playwright) the trace viewer.
3. Diagnose the **category** before changing anything:
   - **Bad test** (wrong selector, wrong assertion, missing wait, flaky timing) → fix the test.
   - **Real product bug** (the app genuinely misbehaves) → **stop and report it.** Do not
     paper over a real bug by weakening the assertion. Surface it as a finding; offer to open
     a Linear issue / GitHub issue or comment on the PR.
   - **Environment** (service down, missing seed data) → fix setup or flag it.
4. Apply the fix, re-run, repeat. Cap at a sensible number of attempts (default 3–4); if still
   failing, stop and explain what you found rather than thrashing.
5. Guard against **flakiness**: if a test passes only sometimes, treat that as a defect in the
   test (or a race in the app) and fix the root cause, not by adding retries.

## Step 5 — Report

Summarize: which cases were automated, pass/fail, any real bugs found (clearly separated from
test issues), and any cases that couldn't be automated and why. Offer to:
- Commit the tests (only if the user asked to commit; branch first if on the default branch).
- Post results to the Linear issue or GitHub PR.
- Wire them into CI (read existing `.github/workflows` and match the pattern).

## Guardrails

- Never weaken an assertion just to make a test pass.
- Never commit or push without being asked.
- Never run destructive actions against a production environment. Confirm the target env first;
  prefer staging/local. Treat anything that mutates real user data as requiring confirmation.
