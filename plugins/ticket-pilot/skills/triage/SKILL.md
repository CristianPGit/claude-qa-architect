---
name: triage
description: Analyze and size a Jira ticket WITHOUT implementing it. Use before grooming/planning meetings, when deciding whether to pick up a ticket, or when the user says "triage PROJ-123", "size this ticket", "how big is PROJ-123", or "what would this ticket involve". Produces requirements analysis, effort estimate, approach sketch, and questions for the ticket author. Writes no code, creates no branch.
---

# Ticket Pilot — triage (analysis only, no code)

Analyze a ticket against the codebase and size it. This is the read-only front
half of the `/ticket-pilot:ticket` pipeline plus an estimate — useful before
sprint planning or before committing to pick a ticket up.

**Hard rule: write NO code, create NO branch, modify NO project files.** The
only thing you may write is the triage report under `.ticket-work/`.

## Steps

1. **Ingest** the ticket exactly as the `ticket` skill's Phase 0 does (Jira key
   via jira-cli, file path, or pasted text). Save to
   `.ticket-work/<KEY>/ticket.md` (ensure `.ticket-work/` is gitignored).
2. **Analyze**: spawn the `requirements-analyst` agent. Save its brief to
   `.ticket-work/<KEY>/requirements.md`.
3. **Size and sketch** — produce, grounded in the analyst's findings and your
   own reading of the affected code. First consult `.ticket-work/memory.md`
   if it exists — especially the "Estimate calibration" section (past misses
   adjust today's estimate) and "Repo gotchas":
   - **Effort**: S / M / L / XL with a one-paragraph justification tied to the
     actual code (number of modules touched, test surface, migration needs) —
     not generic reasoning. If effort is dominated by one risky unknown, say
     which and what a 1-hour spike would resolve.
   - **Approach sketch**: 3–6 bullet outline of how you would implement it.
     An outline, not a plan — no file-by-file detail.
   - **Questions for the ticket author**: the ambiguities from the analyst,
     rewritten as questions you could paste into a Jira comment yourself,
     each with your recommended default so the conversation is fast.
   - **Dependencies / blockers**: other tickets, teams, or infra this waits on,
     if evident from the ticket or code.
4. Save the full report to `.ticket-work/<KEY>/triage.md` and show it to the
   user. Keep the on-screen version compact — the file holds the detail.

If the user later runs `/ticket-pilot:ticket <KEY>`, the pipeline will find
`requirements.md` already present and can reuse it (offer to re-verify it if
the ticket text changed since triage).
