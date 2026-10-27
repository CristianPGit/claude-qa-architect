# Learning — read, write, invalidate, consolidate

The knowledge base is only as good as its last correction. Every run reads it before deciding
and writes back what it learned.

## Read (step 0)

In this order, and only the parts the task touches:
1. `.qa/project.md` (runbook, read-only) and `.qa/preferences.md` (working policy).
2. The domain pack: `domain.md`, `repos.md`, `not-bugs.md`, the area pages the reference touches.
3. `.qa/runs/index.md` — the last ~10 runs for this domain: what failed where, which bugs.
4. `.qa/library.md` — the cache index.

## Write (after every run)

| Where | What |
|---|---|
| `.qa/runs/index.md` | One row: `date · ref · domain · modes · checks pass/fail · bugs · verdict` |
| `.qa/runs/<date>-<ref>.md` | Short record: strategy, results, bugs with areas, cache stats, what was dropped and why |
| `areas/<area>.md` | New flows and selectors you confirmed; bug history lines (`date · bug · cause`); facts re-stamped `verified <date> (<run>)` |
| `domain.md` | Recipes that worked; env/config/flag facts you confirmed or corrected |
| `not-bugs.md` | A suspected bug the ACs, spec or code showed to be intended — with the source |
| `.qa/library.md` | Cache rows from [`library.md`](library.md) |

Write only what this run observed. Another `/qa` run may be writing the same pages: re-read a
page right before you change it and make a targeted edit, never rewrite it from what you read at
step 0. Append to `runs/index.md`; never reorder it. Opinions about style go to `qa-calibration`, not the pack.

## Invalidate

A fact this run contradicted is **corrected or deleted**, never left beside its replacement.
Note it in the run record: `dropped: <fact> — <what showed it wrong>`. A fact still `unverified`
after it has been needed twice is checked now or removed. A repo that turned out superseded is
marked so in `repos.md` at once.

## Consolidate — automatically, when it grows

| Trigger | Do |
|---|---|
| An area page over ~150 lines | Merge duplicate facts, fold old bug history into one summary line per year/cause |
| `runs/index.md` over ~50 rows | Move older rows into `runs/archive-<year>.md`, keep a per-area bug count summary |
| ≥10 `[new]` rows in `calibration-log.md` | Run `qa-calibration` Consolidate |
| Old session dirs | Move sessions with a finished report to `.qa/sessions/archive/` |

## Commit

Nothing above is committed during the run. At step 8 the user is offered one knowledge-base
commit with exactly these `.qa/` paths and the new library scripts, message
`chore(qa): learn from <ref>`. `.qa/sessions/` is never part of it — it holds raw evidence.
