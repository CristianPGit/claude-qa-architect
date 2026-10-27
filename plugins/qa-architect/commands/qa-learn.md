---
description: Teach QA Architect — record a standing preference in plain words, or (no argument) tidy all QA memory: consolidate preferences, re-verify stale facts, prune the library and archive old runs.
argument-hint: "[feedback, e.g. \"too many edge cases\"]"
---

**If `$ARGUMENTS` is feedback:** invoke the `qa-calibration` skill in **Capture** mode — one
concrete, attributed `[new]` row in `.qa/calibration-log.md`, applied to `.qa/preferences.md`
at once if it's an unambiguous single-bullet change. Confirm in one sentence.

**If `$ARGUMENTS` is empty** (or "consolidate", "tidy"): run the full upkeep pass without asking —
1. `qa-calibration` **Consolidate**: fold `[new]` rows into a clean `preferences.md`.
2. The `qa` skill's [`learning.md`](../skills/qa/learning.md) *Invalidate* and *Consolidate* over
   every domain pack: correct contradicted facts, check or drop `unverified` ones, trim long
   area pages, archive old runs and finished sessions.
3. The `qa` skill's [`library.md`](../skills/qa/library.md) lookup over the whole index: evict
   checks whose code is gone, mark stale ones.

End with a short diff summary of what changed and why, and offer one commit
(`chore(qa): consolidate memory`). Never commit without the user's go.
