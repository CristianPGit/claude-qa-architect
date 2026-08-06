---
name: inbox
description: Review all Jira tickets currently assigned to the user, triage each briefly, and recommend a pickup order. Use when the user says "inbox", "what's on my plate", "triage my tickets", or "what should I pick up next". Read-only against Jira and the repo.
---

# Ticket Pilot — inbox (what should I work on?)

Give the user a decision-ready view of everything assigned to them. Read-only:
no code, no branches, no Jira writes.

Requires jira-cli. If missing, say so and stop — this skill has no paste
fallback (it is about the whole queue, not one ticket).

## Steps

1. **Fetch the queue**: `jira issue list -a"$(jira me)" --plain` — open
   statuses only (exclude Done/Closed/Resolved). `$ARGUMENTS` may narrow it
   (a project key, a status, or "sprint" → add `-s` filters / `--jql` for the
   active sprint).
2. **Quick-triage each ticket** (this is a skim, not the full `/triage` —
   `jira issue view <KEY> --plain` plus a brief look at the code areas it
   names):
   - size guess (S/M/L/XL, low confidence is fine — mark it)
   - readiness: READY (clear enough to start) / NEEDS INFO (blocking questions
     — note the single most important one) / BLOCKED (dependency named in the
     ticket)
   - anything already in flight for it locally (`.ticket-work/<KEY>/`,
     `feature/<KEY>-*` branches — flag half-done work first)
   For queues over ~8 tickets, spawn parallel agents to skim in batches so
   the inbox stays fast.
3. **Recommend an order.** Sort by: in-flight work first (finish before
   starting), then priority field, then unblocked-and-ready, then size
   (quick wins early where priorities tie). State the reasoning in one line
   per ticket — the user reorders with their own context; you provide the
   default.
4. **Output** — compact table:

| ▶ | Key | Title (short) | Pri | Size | Readiness | Note |
|---|-----|---------------|-----|------|-----------|------|

`▶` marks the recommended next pickup. Below the table: for each NEEDS INFO
ticket, the one question to ask (paste-ready); for each BLOCKED ticket, what
it waits on. Close with the suggested command for the top pick — e.g.
`/ticket-pilot:triage PROJ-123` if it needs sizing, or
`/ticket-pilot:ticket PROJ-123` if it is READY.

Do not start any pipeline yourself — the user picks.
