# Agent Control Panel

One clickable control panel for repeatable Claude Code workflows: **audit sessions**, **bug hunt**, **spec-to-plan**, and **code review**. Each card on the panel composes the exact slash command (with your chosen parameters) and copies it to the clipboard — paste it into Claude Code and the matching multi-agent workflow runs.

## What's inside

```
index.html            the control panel (open locally, or publish as a Claude Artifact)
kit/
  skills/             slash-command definitions  → .claude/skills/
    audit-sessions/
    bug-hunt/
    spec-to-plan/
  workflows/          multi-agent workflow scripts → .claude/workflows/
    audit-sessions.js
    bug-hunt.js
    spec-to-plan.js
install.sh            copies the kit into a workspace's .claude/
```

## The workflows

| Command | What runs | Scale |
|---|---|---|
| `/audit-sessions [N]` | Lists the last N session transcripts, audits each one (goal, outcome, unfinished work, lessons), synthesizes a cross-session report | ~N+2 agents |
| `/bug-hunt [dir]` | Five finder lenses (logic, async/race, selector fragility, flakiness, config) sweep in parallel, looping until dry; every candidate is adversarially verified | 10–25 agents |
| `/spec-to-plan <spec>` | Codebase mapper → three competing designs (MVP-first, risk-first, testability-first) → judge panel scores and synthesizes the final plan | ~5 agents |
| `/code-review` | Claude Code's built-in review skill — the panel only composes the variant (`high`, `ultra`, `--fix`) | built-in |

Safety rails: bug-hunt and audit-sessions are read-only; spec-to-plan only returns a plan. Nothing writes to your files unless you ask afterwards.

## Install into a workspace

```bash
./install.sh /path/to/your/workspace
```

Then edit the path constants at the top of each workflow script — they are workspace-specific (workflow scripts have no filesystem or env access, so paths must be literal):

- `kit/workflows/bug-hunt.js` and `spec-to-plan.js` — the workspace `root`
- `kit/workflows/audit-sessions.js` — the `dir` holding your session transcripts (`~/.claude/projects/<encoded-workspace-path>`)

The bug-hunt script also carries a "known deliberate constraints" list in its prompt (things that must never be flagged as bugs) — replace it with your own project's quirks.

## The panel

`index.html` is fully self-contained (no external requests). Open it in a browser, or publish it as a Claude Artifact for a hosted, theme-aware version. It supports light/dark via `prefers-color-scheme`.
