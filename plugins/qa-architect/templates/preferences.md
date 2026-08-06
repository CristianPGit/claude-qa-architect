# QA Architect — Calibration Preferences

> Standing instructions for how this team likes QA work done. QA Architect reads this file
> before generating test cases or automating tests, and updates it when you give feedback.
> Keep each bullet one line, concrete, and testable. Commit this file so the whole team shares it.

## Depth
<!-- How thorough? e.g. "Lean: ~6–10 cases for a typical PR; scale up only for risky changes." -->
- Default: balanced — ~6–12 focused cases per typical PR; lead with P1.

## Style
<!-- Output style. e.g. "Compact table with emoji; expand to G/W/T only when needed." -->
- Default to a **compact emoji table** (ID · Type · Scenario · Input → Expected · Pri).
- Scenario = one short clarifying phrase; expand to full Given/When/Then only when a case needs it.
- Concrete example data, observable expected results, gotchas in italics. Don't over-think —
  trim to the high-value cases.

## Always-include
<!-- Categories/checks to always add. e.g. "Sad-Path case for every new error branch." -->
-

## Never-do
<!-- Things to skip. e.g. "Don't test third-party/vendor components." -->
-

## Scope
<!-- What's in/out. e.g. "Test our integration boundary, not the framework itself." -->
-

## Environment
<!-- Safety rules. e.g. "Target staging by default; never run browser tests against prod." -->
- Default target: <local | staging>. Never run mutating/browser tests against production.

## Frameworks
<!-- Preferred tools. e.g. "Playwright for e2e, Vitest for unit; match existing POM." -->
- Match the project's existing test framework and Page Object patterns.
