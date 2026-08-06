---
name: standup
description: Summarize recent ticket work for daily standup. Use when the user says "standup", "what did I work on yesterday", "prep my standup", or "status of my tickets". Gathers from .ticket-work/ artifacts and git history; reports yesterday/today/blockers. Read-only.
---

# Ticket Pilot — standup summary

Produce a standup-ready summary of ticket work in this repo. Read-only: gather,
synthesize, report. `$ARGUMENTS` may narrow the window (e.g. "2 days",
"since monday"); default is since the previous working day (skip weekends).

## Gather

1. Every `.ticket-work/<KEY>/` directory: read `state.md` (phase progress and
   timestamps) and, if present, `pr-description.md` (outcome) and `triage.md`.
2. Git evidence for the window:
   - `git log --all --branches='feature/*' --since=<window> --oneline --author=<user>`
   - current branch states: which feature branches exist, which are merged
     (`git branch --merged <default-branch>`), which are ahead.
3. Note tickets where the pipeline stopped mid-phase (state.md exists but no
   final phase entry) — these are in-progress or stalled.

## Report

Output a compact summary the user can read aloud or paste into Slack:

**Yesterday** — per ticket: key, one line of what happened, concrete state
("branch ready for my review", "blocked on question to PO", "merged").
**Today** — in-flight tickets with their next concrete step (resume phase N,
review branch X, push and open PR).
**Blockers / needs-human** — unanswered ambiguity questions from
requirements/triage docs, failed test suites, tickets stalled >2 days
(flag the staleness).

Keep it tight — one line per ticket per section, no filler. If the evidence
is thin (no .ticket-work dirs, no recent feature commits), say so instead of
inventing activity. Never state a ticket is "done" unless the branch is merged
or the user said so — a finished pipeline is "ready for review", not done.
