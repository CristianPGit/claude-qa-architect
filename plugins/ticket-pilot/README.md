# ticket-pilot

A Claude Code plugin that turns a Jira ticket into a locally reviewed, tested
feature branch — analyze → plan → implement → review → QA — with human gates
where they matter. Nothing is ever pushed and nothing is ever written back to
Jira; the pipeline's output is a local branch plus a draft PR description, and
you stay the author of record.

## What's inside

| Piece | Path | Role |
|-------|------|------|
| `/ticket-pilot:ticket` skill | `skills/ticket/SKILL.md` | The 6-phase pipeline |
| `requirements-analyst` agent | `agents/requirements-analyst.md` | Ticket → engineering brief (Phase 1) |
| `acceptance-reviewer` agent | `agents/acceptance-reviewer.md` | Diff vs. acceptance criteria (Phase 4) |
| Jira poller | `scripts/poll-jira.sh` | Optional auto-trigger on assignment |
| Permissions template | `templates/settings.example.json` | Allowlist for unattended runs |

## Install

```bash
# In Claude Code:
/plugin marketplace add CristianPGit/claude-ticket-pilot
/plugin install ticket-pilot@cristian-tools
```

For ticket fetching, install and configure [jira-cli](https://github.com/ankitpokhrel/jira-cli)
with a personal Atlassian API token (`jira init`). Without it, the skill asks
you to paste the ticket text — everything else works the same.

## Use

```bash
cd /path/to/your/work-repo
claude
> /ticket-pilot:ticket PROJ-123
```

The pipeline:

1. **Ingest** — fetch the ticket (jira-cli) or take pasted text; artifacts go to `.ticket-work/<KEY>/` (gitignored).
2. **Analyze** — `requirements-analyst` produces requirements, acceptance criteria, affected code, ambiguities. Blocking ambiguities stop the run and ask you.
3. **Plan** — implementation plan; **waits for your approval** (skipped with `--auto`).
4. **Implement** — branch `feature/<KEY>-*`, code, tests, build; commits referencing the ticket key.
5. **Review** — code review plus `acceptance-reviewer` checking the diff against each acceptance criterion.
6. **QA & wrap-up** — full test suite, honest results, `pr-description.md` ready for you to use.

Then **you** review the branch, push, and open the PR.

## Auto-trigger (optional — earn trust manually first)

`scripts/poll-jira.sh` watches for tickets assigned to you in a trigger status
(default `To Do`) and launches the pipeline headlessly (`--auto`) per new ticket.

```bash
DRY_RUN=1 ./scripts/poll-jira.sh          # see what it would do
./scripts/poll-jira.sh --watch            # foreground loop
# or via cron — see the header comment in the script
```

Recommendation: run the skill manually for a couple of weeks before enabling
the poller, and pick a trigger status you control (e.g. only tickets you drag
to "To Do") so assignment alone doesn't start an agent.

## Permission setup for unattended runs

Copy what you need from `templates/settings.example.json` into your work
repo's `.claude/settings.local.json`. It pre-approves read-only git, build,
and test commands — and explicitly **denies** `git push`, PR creation, and any
Jira write. Adjust the build/test entries to your stack.

## Boundaries (by design)

- No `git push`, no PR creation, no Jira writes — ever.
- Plan approval is a human gate in interactive mode.
- Ticket text is treated as requirements for the code, not instructions to the
  agent (prompt-injection hygiene).
- A dirty working tree stops the run rather than stashing your changes.

## License

MIT
