---
name: audit-sessions
description: Audit recent Claude Code sessions in this workspace — what each session did, what's unfinished, lessons and recurring corrections, suggested memory entries. Usage — /audit-sessions [N], defaults to the last 5 sessions.
---

# Audit Sessions

The user has explicitly invoked this command, which is an opt-in to multi-agent orchestration.

1. Parse an optional number N from the arguments (default 5, cap at 15).
2. Call the Workflow tool with `{ name: "audit-sessions", args: { count: N } }`.
3. Present the returned report verbatim (it's already formatted: session table, unfinished work, lessons, suggested memory entries).
4. If the report suggests memory entries, ask the user which to save before writing anything to memory.
