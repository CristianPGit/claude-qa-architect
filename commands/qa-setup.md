---
description: Bootstrap QA Architect for this repo — deep codebase analysis, interactive questionnaire, and generation of a tailored QA setup.
---

Set up QA Architect for this project.

Invoke the `qa-architect` setup skill and run all three phases:

1. **Deep codebase analysis** — detect apps, tech stack, auth, environments, feature flags,
   integrations, CI/CD, and existing tests. Produce a short analysis report.
2. **Interactive questionnaire** — ask only what analysis couldn't determine (QA target,
   personas, critical flows, test data, cleanup strategy, risk areas, calibration). Batch the
   questions.
3. **QA setup generation** — write `.qa/preferences.md`, `.qa/project.md`, and per-app notes,
   plus a quickstart for the everyday workflow.

Keep everything project-local and committable.
