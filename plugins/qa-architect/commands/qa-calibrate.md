---
description: Record a standing QA preference, or consolidate accumulated feedback into a clean preferences file. Pass --consolidate to run the out-of-band "dreaming" curation pass.
argument-hint: [feedback, e.g. "too many edge cases"] | --consolidate
---

Invoke the `qa-calibration` skill.

**If `$ARGUMENTS` is `--consolidate` (or "consolidate" / "dream"):** run **Consolidate mode** —
read every `[new]` row in `.qa/calibration-log.md` and any `.qa/sessions/*.md` notes, find macro
patterns, rewrite `.qa/preferences.md` clean (one concrete bullet per point, no duplicates or
contradictions), mark folded log rows `[folded]`, archive processed session notes, and summarize
the diff for review.

**Otherwise** (`$ARGUMENTS` is feedback): run **Capture mode** — translate the feedback into a
concrete, one-line, testable preference; append it as an attributed `[new]` row to
`.qa/calibration-log.md` (with today's date and the triggering PR/issue/session as the source);
and apply it to `.qa/preferences.md` immediately only if it's an unambiguous single-bullet change.
Confirm what you recorded and that future test work will apply it.
