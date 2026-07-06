---
name: spec-to-plan
description: Turn a feature spec or requirement into a vetted implementation plan — codebase mapping, 3 competing designs (MVP-first, risk-first, testability-first), judge panel, synthesized final plan. Usage — /spec-to-plan <spec text> [in <directory>].
---

# Spec to Plan

The user has explicitly invoked this command, which is an opt-in to multi-agent orchestration.

1. The arguments are the spec. If empty, ask for the spec (and optionally a target directory) before doing anything.
2. If the spec names or implies one of the workspace projects, pass it as `target` (repo-relative directory); otherwise omit target.
3. Call the Workflow tool with `{ name: "spec-to-plan", args: { spec: "<full spec text>", target: "<dir if known>" } }`.
4. Present: which design angle won and why (one sentence from the scores), then the final plan verbatim. Offer to save the plan to a file or start implementing — but don't start without being asked.
