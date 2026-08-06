---
name: retro
description: Learn from a finished ticket after the human reviewed/merged it. Use when the user says "retro PROJ-123", "the PR merged", "here's what I changed after the pipeline", or periodically after a few tickets. Compares the pipeline's output with what actually shipped, extracts lessons into the pipeline memory, and calibrates estimates. Read-only on code; writes only to .ticket-work/.
---

# Ticket Pilot — retro (close the learning loop)

The pipeline's output was reviewed by a human, possibly corrected, and merged.
Every difference between what the pipeline produced and what actually shipped
is a lesson. Capture it so the next run is better.

`$ARGUMENTS`: a ticket key, or empty → offer retro candidates (tickets in
`.ticket-work/` whose branches are merged or gone).

## Steps

1. **Gather the delta.** Find what changed after the pipeline finished:
   - If the branch merged: diff the pipeline's last commit (from `state.md`)
     against the merge result of those files on the default branch.
   - If the human amended/rebased: `git log` the branch for commits after the
     pipeline's last recorded one.
   - Also ask the user directly: "what did you have to fix or wish it had
     done differently?" — their answer outranks the diff.
2. **Diagnose each difference** — classify, don't just list:
   - wrong assumption (check `assumptions.md` — which one, and what the right
     default would have been)
   - missed requirement (why did the analyst/panel miss it?)
   - style/convention mismatch (what convention, citable for next time?)
   - human preference with no general rule (note it, low importance)
3. **Calibrate estimates**: if `triage.md` exists, compare the S/M/L/XL guess
   with reality (commits, files touched, human-reported effort). Note the
   miss direction.
4. **Write lessons to the pipeline memory** (`.ticket-work/memory.md` — see
   format below): only lessons that would CHANGE a future run's behavior.
   "Be more careful" is not a lesson; "the payments module has a second
   consumer in cron-jobs/, always check it" is.
5. **Prune while you're there**: merge duplicate lessons, delete ones
   invalidated by newer experience, demote stale ones. Memory that grows
   unboundedly stops being read.
6. Report to the user: lessons added (verbatim), estimate calibration, and
   any pattern emerging across the last few retros (same assumption wrong
   twice = the config or CLAUDE.md should change — propose the exact edit).

## Pipeline memory format (`.ticket-work/memory.md`)

One lesson per bullet, grouped under stable headings, each tagged with
importance and date:

```markdown
# Pipeline memory — learned across tickets, pruned on retro

## Repo gotchas
- [high, 2026-07-03] `npm run test:all` is flaky in CI-mode; re-run once before calling it red (PROJ-101)

## Conventions the analyst/implementer must know
- [high, 2026-07-03] error responses use ProblemDetail, never bare strings (PROJ-98)

## Reviewer calibration
- [med, 2026-07-03] security-auditor flags our internal URL-builder as SSRF every time — pre-cleared, see ADR-14 (PROJ-99)

## Estimate calibration
- [med, 2026-07-03] tickets touching the billing module: bump one size (PROJ-97)

## Human preferences
- [low, 2026-07-03] prefers small commits over one squashed commit
```

The `ticket`, `triage`, and `preflight` skills read this file at startup and
weight lessons by importance and recency — high-importance old lessons beat
low-importance new ones. Keep it under ~60 lessons; prune on every retro.
