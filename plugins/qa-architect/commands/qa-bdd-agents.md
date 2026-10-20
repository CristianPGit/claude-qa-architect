---
description: Plan, generate and heal BDD scenarios with Playwright's planner/generator/healer agents, keeping features, steps and the Page Object Model intact.
argument-hint: [area or feature to cover, e.g. "transaction search filters"]
---

Run the Playwright test agents against the BDD suite for: **$ARGUMENTS**

Invoke the `bdd-test-agents` skill. Make sure the seed test and agent definitions exist (one-time
setup), let the planner explore and draft a plan, and stop for the user to approve scenarios.
Translate approved scenarios into Gherkin that reuses existing steps, generate only the missing
steps (refactored into Page Object methods + step definitions, never raw specs), then run and
heal with fixes applied to the POM/steps — never to `.features-gen/`. Never weaken an assertion
to force a pass; report product bugs instead.
