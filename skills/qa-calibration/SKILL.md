---
name: qa-calibration
description: Record and apply standing QA preferences so the assistant remembers how the user likes test work done. Use when the user gives feedback on QA output ("you overthink this", "too many cases", "you always miss accessibility", "keep it concise", "we don't test third-party code", "always include security"). Captures the lesson to an append-only log and folds it into .qa/preferences.md so it sticks across sessions.
---

# QA Calibration (Memory)

This skill is how QA Architect **learns from feedback**. It runs in two modes so that learning
never slows down a live QA run:

- **Capture** (default, in-the-moment) — record the lesson fast and cheap, then keep working.
- **Consolidate** (out-of-band "dreaming") — later, fold accumulated lessons into a clean set of
  preferences and prune contradictions. Triggered by `/qa-calibrate --consolidate`.

## The memory layers

QA memory is tiered by who writes it and how often it changes:

| Layer | File | Written by |
|---|---|---|
| **Runbook** (read-mostly) | `.qa/project.md` | setup + humans — *not* edited during runs |
| **Working policy** (RW) | `.qa/preferences.md` | the consolidate pass (and small live edits) |
| **Audit ledger** (append-only) | `.qa/calibration-log.md` | every capture, attributed |

All three live in the repo root and are committed so the whole team shares them. This skill owns
`preferences.md` and `calibration-log.md`; it treats `project.md` as read-only.

## Mode 1 — Capture (default)

When the user gives feedback about *how* you work, don't stop to surgically rewrite the whole
preferences file. Instead:

1. **Append one attributed line** to `.qa/calibration-log.md` (create it from
   `templates/calibration-log.md` if missing):
   `- [new] YYYY-MM-DD · <source> · <section> · <lesson> — <why>`
   where `<source>` is the PR / Linear ID / session that triggered it (attribution for P5 audit).
2. **Optionally** apply the lesson to `.qa/preferences.md` immediately *if* it's an
   unambiguous single-bullet change (e.g. "keep it to ~8 cases"). If it's fuzzy, or conflicts
   with an existing bullet, leave it as a `[new]` log row for the consolidate pass to reconcile.
3. Confirm in one sentence what you recorded and that you'll apply it from now on.

Translate feedback into a concrete, testable line:

| User says | Section · lesson |
|---|---|
| "This is overthinking it / too many cases" | Depth · prefer ~6–10 high-value cases; cut speculative edge cases unless risk is clear |
| "You missed the error states again" | Always-include · a Sad-Path case for every new error branch in the diff |
| "Don't test the third-party widget" | Scope · skip third-party/vendor components; test only our integration boundary |
| "Keep it concise" | Style · terse output, no preamble |
| "Always add accessibility" | Always-include · keyboard + screen-reader + contrast cases for UI changes |
| "We use staging, never prod" | Environment · target staging by default; never run browser tests against prod |

## Mode 2 — Consolidate (out-of-band "dreaming")

Run when the user invokes `/qa-calibrate --consolidate`, or after a batch of QA work. This is a
dedicated curation pass whose only goal is memory *quality* — separate from any live task:

1. Read every `[new]` row in `.qa/calibration-log.md` and any `.qa/sessions/*.md` notes.
2. **Find macro patterns**, not just single lines — e.g. the same miss recurring across several
   PRs, or two feedback lines that contradict. Prefer the pattern over the one-off.
3. **Rewrite `.qa/preferences.md` clean**: one concrete bullet per point, under the right section,
   no duplicates, no contradictions. Update existing bullets rather than appending near-dupes.
4. Mark the folded log rows `[folded]` (never delete them — the ledger is append-only for audit).
5. Archive processed session notes (e.g. move `.qa/sessions/*.md` → `.qa/sessions/archive/`).
6. Summarize the diff: what changed in preferences and why, so the team can review the commit.

Because only this pass rewrites the shared `preferences.md` — and live runs write to their own
per-session files — many QA runs can proceed in parallel without clobbering each other. Git
handles versioning and rollback; the ledger tells you which run introduced any given preference.

## How it gets applied

Every test-case / automation run reads `project.md` + `preferences.md` at Step 0 and adjusts.
The user should only have to say something **once**. If you ever produce output that violates a
recorded preference, that's a bug — re-read the files at Step 0.

## Cross-machine note

`.qa/*` is per-repo and meant to be committed (except transient `.qa/sessions/` scratch, which a
team may gitignore). If the user wants preferences that follow them across all projects, suggest
mirroring the key ones into their global `~/.claude/CLAUDE.md`.
