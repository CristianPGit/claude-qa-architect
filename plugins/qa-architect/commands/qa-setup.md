---
description: Bootstrap QA Architect for this repo — codebase analysis, a short questionnaire, the runbook and preferences — then a knowledge pack per domain. Pass a domain name to (re)build just that pack.
argument-hint: "[domain]"
---

**If `$ARGUMENTS` names a domain:** invoke the `qa` skill with `setup $ARGUMENTS` — it writes or
refreshes `.qa/domains/$ARGUMENTS/` autonomously (see its `domains.md`).

**Otherwise:** invoke the `qa-architect` setup skill and run all three phases:

1. **Deep codebase analysis** — apps, stack, auth, environments, flags, integrations, CI/CD,
   existing tests.
2. **Questionnaire** — ask only what analysis couldn't determine, in one batch. This is the one
   time QA Architect asks up front; `/qa` never does.
3. **Setup generation** — `.qa/project.md`, `.qa/preferences.md`, `.qa/calibration-log.md`.

Then, without asking, set up one domain pack per domain the analysis found (`qa` skill,
`setup <domain>`). Keep everything project-local and uncommitted; offer one commit at the end.

You don't have to run this first — `/qa` sets up what's missing on its own, just without the
questionnaire.
