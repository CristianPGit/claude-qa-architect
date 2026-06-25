---
description: Record a standing QA preference (depth, style, what to always/never include) so QA Architect remembers it across sessions.
argument-hint: [the feedback, e.g. "too many edge cases" or "always include accessibility"]
---

Record this QA preference: **$ARGUMENTS**

Invoke the `qa-calibration` skill. Translate the feedback into a concrete, one-line, testable
preference and write it to `.qa/preferences.md` under the right section (Depth / Style /
Always-include / Never-do / Scope / Environment / Frameworks). Update existing bullets instead of
duplicating. Confirm what you recorded and that future test work will apply it.
