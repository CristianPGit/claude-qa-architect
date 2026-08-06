---
description: Explore a feature in a real browser, write automated tests in the project's framework, run them, and auto-fix until green.
argument-hint: [test cases / feature / spec path to target]
---

Automate and verify tests for: **$ARGUMENTS**

Invoke the `automate-tests` skill. Detect the existing test framework and match it; pick a
browser driver (chrome-devtools / playwright-cli / agent-browser) based on availability; explore
the running app to capture real selectors and behavior; generate tests one-behavior-per-case;
then run and auto-fix the loop. Separate real product bugs from bad tests — never weaken an
assertion to force a pass. Report results and offer to commit/file/wire into CI (with
confirmation).
