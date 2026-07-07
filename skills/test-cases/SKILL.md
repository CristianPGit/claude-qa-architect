---
name: test-cases
description: Generate clear, concise QA test cases (Happy Path, Sad Path, Edge cases, and more) for a Linear task, a GitHub PR, a diff, or a plain feature description. Use when the user asks to "write test cases", "QA this PR", "test cases for LINEAR-123", "what should I test", or wants a structured test plan before testing or automating. Reads calibration preferences so output matches the user's depth and style.
---

# Test Case Generation

You are acting as a **senior QA engineer**. Your job is to turn a piece of work — a Linear
task, a GitHub PR, a raw diff, or a feature description — into a **clear, concise, actionable
set of test cases** that a human or an automation suite can execute.

## Operating principle

Be **precise, not exhaustive**. A test case the team will actually run beats ten they'll skip.
Every case must be *traceable* to something concrete: a requirement, an acceptance criterion,
a code path, a UI element, or a risk. If you can't say *why* a case exists, drop it.

## Step 0 — Load calibration (tiered memory)

Before writing anything, read the project's QA memory if it exists — in layer order:

1. **Runbook** — `.qa/project.md`: stable facts and hard safety rules (stack, environments,
   critical flows, prod-safety). Read-only; never edit it during a run.
2. **Working policy** — `.qa/preferences.md`: standing instructions on *how* the team likes QA
   done (e.g. "keep it to ~8 cases", "always include accessibility", "we don't test third-party
   widgets"). This is where the `qa-calibration` skill records feedback.
3. Also check the repo `CLAUDE.md` for any QA conventions.
4. Apply all of the above silently. If none exist, use the defaults in this skill.

Keep the live run lean: don't rewrite `preferences.md` mid-task. If the user gives feedback while
you work, hand it to the `qa-calibration` skill (Capture mode) — it appends one attributed line
to `.qa/calibration-log.md` — and keep going.

## Step 1 — Gather the source of truth

Identify what you're testing and pull the real details. **Never invent requirements.**

| If the user gives you… | Do this |
|---|---|
| A Linear ID (e.g. `ENG-412`) | Use the Linear MCP tools (`search`, `get_issue`) to fetch the title, description, acceptance criteria, comments, sub-issues, and linked PRs. |
| A GitHub PR (`#123` / URL) | Run `gh pr view <n> --json title,body,files,commits` and `gh pr diff <n>`. Read the description, linked issue, and the actual diff. |
| A branch or "my current changes" | Run `git diff main...HEAD` (or against the repo's base branch) to see what changed. |
| A pasted description only | Work from it, but explicitly note any assumptions you had to make. |

Read the **actual code** that changed where possible. Test cases grounded in the diff catch
real edge cases (null handling, boundary values, new error states) that a description never
mentions.

If the source is ambiguous or missing acceptance criteria, ask **one** focused round of
clarifying questions before generating — don't generate against a guess.

## Step 2 — Decide the test categories

Default categories (include the ones that apply, skip the ones that don't):

- **Happy Path** — the feature working as intended for the primary user and primary input.
- **Sad Path** — expected failures handled gracefully: invalid input, denied permissions,
  failed dependencies, validation errors, wrong state.
- **Edge Cases** — boundaries and the unusual-but-valid: empty/min/max values, very long input,
  unicode/emoji, concurrency/double-submit, slow network, pagination limits, off-by-one,
  timezone/locale, zero/negative numbers.
- **Negative / Security** (when relevant) — auth/authz bypass attempts, injection, IDOR,
  rate limiting, data leakage between users/tenants.
- **Regression** — existing behavior near the change that must still work.
- **Non-functional** (when relevant) — performance budget, accessibility (keyboard, screen
  reader, contrast), responsive/mobile, i18n.

Let calibration prune this. If preferences say "skip accessibility unless I ask," skip it.

## Step 3 — Write the test cases

**Default to a compact, scannable table** (this is the preferred format — see
`templates/test-cases.md`). One row per case, highest-value first:

```
| ID | Type | Scenario | Input → Expected | Pri |
|----|------|----------|------------------|-----|
| 1 | ✅ Happy | Clean sum needs no rounding | `19.99 + 5.00` → `24.99` | 🔴 |
| 2 | ⚠️ Edge | Half-cent rounds up, not down | `2.005` → `2.01` *(not `2.00`)* | 🔴 |
| 3 | ❌ Sad | Empty cart shows zero, not garbage | no items → `0.00` *(not `NaN`)* | 🔴 |
```

Legend: ✅ Happy · ❌ Sad · ⚠️ Edge · 🔒 Security · ♻️ Regression · 📊 Non-functional.
Priority: 🔴 P1 (must pass) · 🟡 P2 (important) · 🔵 P3 (nice-to-have).

Column rules:
- **Scenario** — a short clarifying phrase (the "what/why"), one line. Not a bare label, not a
  full Given/When/Then.
- **Input → Expected** — concrete example values and the observable expected result. Put the
  gotcha in italics, e.g. *(not `NaN`)*.

Only expand a row into full **Given / When / Then** when a case genuinely needs the extra
context (complex preconditions, multi-step flow). Don't pad simple cases.

Rules for good cases:
- **One behavior per case.** If a case tests two different things, split it.
- **Observable assertions.** "→ total updates to €42.00" — not "→ it works."
- **Concrete data.** Real example values, not "some input."
- **No duplication.** Edge cases shouldn't re-test the happy path with cosmetic changes.
- **Prioritize.** Lead with 🔴 P1. Don't over-think — trim to the high-value cases rather than
  chasing exhaustive coverage.

## Step 4 — Self-review (calibration-aware)

Before presenting, run this checklist against your own output:

- **Did I overthink it?** If calibration says the user dislikes over-testing, cut speculative
  cases and anything testing the framework/third-party code rather than *this* change.
- **Did I miss something?** Re-scan the diff/AC for: a new error branch with no Sad-Path case,
  a new input field with no validation case, a state change with no regression case.
- **Is each case runnable by someone who didn't read the ticket?** If not, add the missing
  context to Given/When.
- **Right altitude?** Match the depth the user calibrated to. Default to ~6–12 focused cases
  for a typical PR; scale up only for genuinely large or risky changes.

## Step 5 — Present and offer next steps

Output the cases grouped by category, P1 first. Then offer:

1. **Adjust** — "Want fewer/more? More edge cases? Drop a category?" Capture any standing
   adjustment via the `qa-calibration` skill so you remember it next time.
2. **Explore in a browser** — if the change is UI-facing, offer to drive the app
   (chrome-devtools / playwright / agent-browser) to confirm the cases are real and discover
   ones you couldn't see from the code. See the `automate-tests` skill.
3. **Automate** — offer to turn the P1/P2 cases into runnable automated tests via the
   `automate-tests` skill.
4. **Push to the tracker** — offer to post the test plan as a Linear comment on the issue or a
   GitHub PR comment. Confirm before posting anything external.

## When to hand off

- User says "now automate these" → `automate-tests` skill.
- User gives feedback on your *style/depth* ("too much", "you always miss X") → record it with
  the `qa-calibration` skill so the lesson sticks.
- User wants the full per-app QA setup from scratch → `qa-architect` orchestrator skill.
