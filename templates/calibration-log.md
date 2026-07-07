# QA Architect — Calibration Log (append-only)

> The **audit layer** of QA memory. Every lesson QA Architect learns is appended here as one
> attributed line *before* it's folded into `preferences.md`. Never rewrite or delete rows —
> git history plus this ledger is how you find *when* and *why* a preference entered, and roll
> back a bad habit. The out-of-band consolidation pass (`/qa-calibrate --consolidate`) reads the
> unprocessed rows, updates `preferences.md`, and marks rows `[folded]`.

Format: `- [status] YYYY-MM-DD · <source> · <section> · <lesson> — <why>`

- status: `[new]` captured, not yet folded · `[folded]` merged into preferences.md
- source: PR / Linear ID / session ref that triggered the lesson (attribution)
- section: which `preferences.md` heading it targets (Depth / Style / Always-include / …)

## Entries

<!-- newest at the bottom; append, don't edit -->
