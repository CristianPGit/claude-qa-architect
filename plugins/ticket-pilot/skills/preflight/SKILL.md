---
name: preflight
description: Final verification of a finished ticket branch right before the human pushes. Use when the user says "preflight PROJ-123", "is this branch ready to push", or after they've reviewed a pipeline result. Rebases onto the latest default branch, re-runs the full suite, checks for drift, and produces a go/no-go. Never pushes.
---

# Ticket Pilot — preflight (last check before YOU push)

The pipeline finished hours or days ago; main has moved on; the human is about
to push. Your job: make sure the branch is still true — freshly rebased, fully
green, nothing forgotten. You do NOT push. The output is a go/no-go.

`$ARGUMENTS`: a ticket key (resolve the branch from `feature/<KEY>-*`) or a
branch name. No argument → if the current branch is a `feature/*` branch, use
it; otherwise list candidate branches and ask.

## Steps

1. **Locate** the branch and its `.ticket-work/<KEY>/` artifacts. Verify the
   working tree is clean; halt if not.
2. **Sync with the default branch**: fetch, then rebase the feature branch
   onto the latest default branch (`git rebase origin/<default>`; honor
   `default_branch` from `.ticket-pilot.json`).
   - Conflicts: resolve them ONLY when the resolution is mechanically obvious
     (non-overlapping intent); otherwise `git rebase --abort` and report the
     conflicting files — a human decides semantic conflicts.
   - After any rebase, diff the pre/post patch (`git range-diff` or
     equivalent) and confirm the change is still what was reviewed.
3. **Drift check**: did main's changes since the branch point touch the same
   files/modules as this ticket? If yes, spawn the `code-reviewer` agent on
   the rebased diff — semantic conflicts survive clean rebases.
4. **Full verification**: run the full test suite
   (`full_test_command`/`test_command` from config, else auto-detect) and the
   build/linter. All results reported honestly.
5. **Completeness sweep**:
   - `pr-description.md` still matches the final diff (update it if commits
     were added since it was written).
   - No leftover debug artifacts in the diff: prints/console.logs, focused or
     skipped tests (`.only`, `@Disabled`, `xit`), TODO markers added by the
     pipeline, commented-out code.
   - No unintended files (lockfile churn unrelated to the ticket, editor
     files, `.ticket-work/` leakage).
   - `assumptions.md`, if present: confirm each assumption with the user was
     reviewed — list any `⚠ HIGH RISK` ones again.
6. **Verdict** — one of:
   - ✅ **GO** — rebased, green, clean. Print the exact commands for the human:
     `git push -u origin <branch>` and a ready `gh pr create` line using
     `pr-description.md` (for THEM to run — never run these yourself).
   - ⚠️ **GO WITH NOTES** — pushable, but list what to double-check.
   - ❌ **NO-GO** — what failed, what was done about it, what needs the human.

Append the preflight outcome to `.ticket-work/<KEY>/state.md`.

Hard rules: never push, never create the PR, never force-push, never rewrite
commits that were already reviewed (rebase onto main is the only history
change allowed). If the branch was already pushed upstream by the user
earlier, do NOT rebase it — report that a merge-based sync is needed instead
and stop.
