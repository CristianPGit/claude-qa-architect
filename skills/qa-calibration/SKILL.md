---
name: qa-calibration
description: Record and apply standing QA preferences so the assistant remembers how the user likes test work done. Use when the user gives feedback on QA output ("you overthink this", "too many cases", "you always miss accessibility", "keep it concise", "we don't test third-party code", "always include security"). Persists the lesson to .qa/preferences.md so it sticks across sessions.
---

# QA Calibration (Memory)

This skill is how QA Architect **learns from feedback**. Whenever the user tells you that your
test cases were too much, too little, missing something, or off in style, capture it as a
durable preference so future runs respect it — without being told again.

## Where preferences live

`.qa/preferences.md` in the **repo root** (per-project, checked in so the whole team benefits).
This file is read at Step 0 of the `test-cases` and `automate-tests` skills. Use the template
in `templates/preferences.md` when creating it for the first time.

## When to write

Trigger on any feedback about *how* you work, not just the current output. Examples:

| User says | Record as |
|---|---|
| "This is overthinking it / too many cases" | `Depth: prefer fewer, high-value cases (~6–10 for a typical PR). Cut speculative/edge cases unless risk is clear.` |
| "You missed the error states again" | `Always-include: a Sad-Path case for every new error branch in the diff.` |
| "Don't test the third-party widget" | `Scope: don't write cases for third-party/vendor components; test only our integration boundary.` |
| "Keep it concise" | `Style: terse Given/When/Then, no preamble.` |
| "Always add accessibility" | `Always-include: keyboard + screen-reader + contrast cases for UI changes.` |
| "We use staging, never prod" | `Environment: target staging by default; never run browser tests against prod.` |

## How to write

1. Read `.qa/preferences.md` if it exists; otherwise create it from `templates/preferences.md`.
2. Add or update the relevant bullet under the right section (Depth, Style, Always-include,
   Never-do, Scope, Environment, Frameworks). **Update existing bullets** instead of appending
   duplicates — keep the file tight and non-contradictory.
3. Keep each preference one line, concrete, and testable against future output.
4. Confirm to the user in one sentence what you recorded and that you'll apply it from now on.

## How it gets applied

Every test-case / automation run reads this file first and adjusts. The point is the user
should only have to say something **once**. If you ever produce output that violates a recorded
preference, that's a bug — re-read the file at Step 0.

## Cross-machine note

`.qa/preferences.md` is per-repo and meant to be committed. If the user wants preferences that
follow them across all projects, suggest adding them to their global `~/.claude/CLAUDE.md`
instead, and mirror the key ones there.
