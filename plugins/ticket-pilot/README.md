# 🎫 ticket-pilot

**A Claude Code plugin that turns a Jira ticket into a reviewed, tested, ready-to-push feature branch — while you stay the author of record.**

You point it at a ticket. It reads the requirements, asks about ambiguities, writes a plan and waits for your approval, implements on a feature branch, reviews its own diff against the acceptance criteria, runs the full test suite, and hands you a branch plus a draft PR description.

It **never pushes, never opens PRs, never writes to Jira** — and not just as a promise: a harness-level hook mechanically blocks those commands, even if a malicious ticket tries to prompt-inject its way past the rules. The last mile is always yours.

```
Jira ticket ──▶ analyze ──▶ plan ──▶ implement ──▶ review panel ──▶ QA ──▶ local branch
                   │          │                    3 reviewers in         │
                   ▼          ▼                    parallel + tech-       ▼
             asks you     waits for                lead arbitration   YOU review,
            about gaps   your approval                               push, open PR
                   ▲                                                      │
                   │              pipeline memory (.ticket-work/)         ▼
                   └──────────── lessons from /retro after merge ◀── PR merged
```

Every ticket makes the next one smarter: after a PR merges, `/retro` compares what the pipeline produced with what actually shipped and feeds the lessons into a persistent, repo-local pipeline memory that all future runs read.

---

## Contents

- [What you get](#what-you-get)
- [Installation](#installation)
- [Usage](#usage)
  - [`/ticket` — the full pipeline](#ticket--the-full-pipeline)
  - [`/inbox` — what should I pick up?](#inbox--what-should-i-pick-up)
  - [`/preflight` — last check before you push](#preflight--last-check-before-you-push)
  - [`/triage` — size a ticket without coding](#triage--size-a-ticket-without-coding)
  - [`/retro` — close the learning loop](#retro--close-the-learning-loop)
  - [`/standup` — prep your daily update](#standup--prep-your-daily-update)
- [Auto-trigger on assignment (optional)](#auto-trigger-on-assignment-optional)
- [Configuration](#configuration)
- [The safety model](#the-safety-model)
- [Using with Gemini CLI or Antigravity](#using-with-gemini-cli-or-antigravity)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

---

## What you get

| Command / component | What it does |
|---|---|
| `/ticket-pilot:ticket PROJ-123` | Full pipeline: requirements → plan → code → parallel review panel → QA → local branch. Autonomy set by `--level 1/2/3`. |
| `/ticket-pilot:triage PROJ-123` | Analysis + S/M/L/XL estimate + questions for the ticket author. **Writes no code.** Perfect before grooming. |
| `/ticket-pilot:inbox` | All tickets assigned to you, quick-triaged, with a recommended pickup order |
| `/ticket-pilot:preflight PROJ-123` | Right before *you* push: rebase onto latest main, drift check, full re-verification → GO / NO-GO |
| `/ticket-pilot:standup` | Yesterday / today / blockers, compiled from pipeline artifacts and git history |
| `/ticket-pilot:retro PROJ-123` | After the PR merges: learn from what you changed post-pipeline, feed lessons into the pipeline memory |
| `requirements-analyst` agent | Turns a vague ticket into numbered, testable requirements grounded in your actual codebase |
| `test-designer` agent | TDD mode: designs the test suite from acceptance criteria *before* implementation |
| `code-reviewer` agent | Correctness/edge-case/contract review with severity-ranked, evidence-backed findings |
| `security-auditor` agent | Injection, authz, secrets, data-exposure audit of the diff — findings need a concrete attack path |
| `acceptance-reviewer` agent | Checks the finished diff against *each acceptance criterion* — a different question than code review |
| `tech-lead` agent | Arbitrates the review panel: dedupes, resolves reviewer conflicts by reading the code, issues one decided fix list |
| `hooks/guard.sh` | Blocks `git push`, `gh pr create/merge`, and Jira writes at the tool level |
| `scripts/poll-jira.sh` | Optional: watch Jira for newly assigned tickets and launch the pipeline headlessly, with desktop notifications |

### Autonomy levels

The pipeline has a dial, not a switch — set per run (`--level 2`) or per repo (`.ticket-pilot.json`):

| Level | Ambiguities | Plan | Isolation | Use for |
|---|---|---|---|---|
| **1 — pair** *(default)* | asks you | waits for approval | your checkout | day-to-day interactive work |
| **2 — autopilot** | asks only when blocking; logs the rest as assumptions | logged, not gated | opt-in worktree | ticket types you've learned to trust |
| **3 — headless** | never asks — every judgment call logged in `assumptions.md` | logged | always a worktree | the poller / unattended runs |

Safety stops (dirty tree, unrunnable build, destructive requests, tests that can't pass honestly, a security **STOP** verdict) halt the pipeline at **every** level — autonomy governs judgment calls, never safety. At levels 2–3 the final summary leads with the assumptions it made, so you review the judgment calls together with the diff.

Every run leaves an audit trail in `.ticket-work/<KEY>/` (gitignored): the raw ticket, the requirements brief, the approved plan, review notes, and a ready-to-paste PR description.

---

## Installation

### 1. Prerequisites

- **[Claude Code](https://claude.com/claude-code)** — any recent version
- **git** — you have it
- **[jira-cli](https://github.com/ankitpokhrel/jira-cli)** *(optional but recommended)* — lets the pipeline fetch tickets itself:

  ```bash
  brew install jira-cli          # macOS
  jira init                      # paste a personal Atlassian API token
  ```

  Create the token at <https://id.atlassian.com/manage-profile/security/api-tokens>. No jira-cli? Everything still works — the skills just ask you to paste the ticket text.

### 2. Install the plugin

Inside any Claude Code session:

```
/plugin marketplace add CristianPGit/claude-ticket-pilot
/plugin install ticket-pilot@cristian-tools
```

> Updating later: `/plugin marketplace update cristian-tools`.

### 3. Pre-approve your build & test commands (recommended)

So the pipeline doesn't stall on permission prompts mid-run, copy the relevant entries from [`templates/settings.example.json`](templates/settings.example.json) into your work repo's `.claude/settings.local.json` (kept out of git). It allowlists read-only git, `jira issue view`, and common build/test commands — and explicitly **denies** `git push`, PR creation, and Jira writes as a second layer under the hook. Swap the npm/maven/gradle entries for whatever your stack uses.

### 4. Give it context

The pipeline is only as good as your repo's `CLAUDE.md`. Two minutes spent documenting *how to run the tests*, *branch/commit conventions*, and *what "done" means on your team* pays back on every ticket. Run `/init` in your work repo if you don't have one yet.

---

## Usage

### `/ticket` — the full pipeline

```
cd ~/work/my-service
claude
> /ticket-pilot:ticket PROJ-123
```

What happens, phase by phase:

1. **Ingest** — fetches `PROJ-123` via jira-cli (or asks you to paste it). Saves everything under `.ticket-work/PROJ-123/`.
2. **Analyze** — the `requirements-analyst` agent restates the ticket as numbered, testable requirements with acceptance criteria, maps the affected code, and lists ambiguities. **If an ambiguity would change the implementation, it stops and asks you** — with a recommended default so answering takes seconds.
3. **Plan** — files to change, approach, test strategy, definition of done. **Waits for your approval.** Nothing is written until you say go.
4. **Implement** — branch `feature/PROJ-123-<slug>`, code matching your repo's conventions, tests for every acceptance criterion, incremental commits referencing the key.
5. **Review panel + arbitration** — three reviewers run *in parallel* on the diff: `code-reviewer` (correctness), `acceptance-reviewer` (does each criterion have an implementation *and a test that would fail if it broke?*), and `security-auditor` (attack paths, not checkbox hygiene). Their raw reports go to the `tech-lead` agent, which deduplicates, resolves conflicts by reading the code, rejects findings that don't survive scrutiny (with evidence — no silent drops), and issues one ordered fix list plus a completion assessment. A security STOP can't be overruled; it goes to you.
6. **QA & wrap-up** — full test suite (results reported honestly, red included), then a summary: branch name, commits, and `.ticket-work/PROJ-123/pr-description.md` ready to paste.

Then you review the branch and push. That part is yours by design.

**Variants:**

```
> /ticket-pilot:ticket PROJ-123 --level 2      # autopilot: no plan gate, assumptions logged
> /ticket-pilot:ticket PROJ-123 --level 3      # headless mode: never asks, always in a worktree
> /ticket-pilot:ticket PROJ-123 --tdd          # test-designer writes failing tests first, then implement to green
> /ticket-pilot:ticket PROJ-123 --worktree     # runs in ../my-service-PROJ-123/ — keep working, or run a 2nd ticket in parallel
> /ticket-pilot:ticket docs/ticket.md          # no Jira access? feed it a file
> /ticket-pilot:ticket PROJ-123                # re-run after an interruption → resumes from the last completed phase
```

### `/inbox` — what should I pick up?

```
> /ticket-pilot:inbox              # everything assigned to you, quick-triaged
> /ticket-pilot:inbox sprint      # active sprint only
```

One compact table: size guess, readiness (READY / NEEDS INFO / BLOCKED), local in-flight work, and a recommended pickup order — with the one question to ask per underspecified ticket, paste-ready. Read-only; starting a pipeline stays your call.

### `/preflight` — last check before you push

```
> /ticket-pilot:preflight PROJ-123
```

Main has moved since the pipeline ran. Preflight rebases the branch onto latest main (aborting on non-trivial conflicts — those are yours), re-reviews if main touched the same modules, re-runs the **full** suite, sweeps for leftover debug artifacts and stale PR descriptions, then gives a ✅ GO / ⚠️ GO WITH NOTES / ❌ NO-GO with the exact `git push` + `gh pr create` commands *for you to run*.

### `/triage` — size a ticket without coding

```
> /ticket-pilot:triage PROJ-456
```

Runs the analysis half only, then adds: an **S/M/L/XL estimate** justified by the actual code it would touch (not vibes), a 3–6 bullet approach sketch, **ready-to-paste questions for the ticket author** (each with a recommended default), and any dependencies. Writes no code, creates no branch. If you later run the full pipeline on the same key, the analysis is reused.

### `/retro` — close the learning loop

```
> /ticket-pilot:retro PROJ-123      # after the PR merged
```

Compares what the pipeline produced with what actually shipped (post-pipeline commits, your amendments, and your own answer to "what did you have to fix?"), diagnoses each difference (wrong assumption? missed requirement? unwritten convention?), and writes the durable lessons into the **pipeline memory** — `.ticket-work/memory.md`. Every later `/ticket` and `/triage` run reads that memory at startup: repo gotchas, conventions, reviewer calibration ("security-auditor always flags our URL-builder — pre-cleared, ADR-14"), estimate calibration, your preferences. Lessons are importance-tagged, recency-weighted, and pruned on every retro so the file stays worth reading. The memory lives in gitignored `.ticket-work/`, so it stays on your machine.

If the same assumption goes wrong twice, retro proposes the fix upstream: the exact `CLAUDE.md` or `.ticket-pilot.json` edit that would prevent it.

### `/standup` — prep your daily update

```
> /ticket-pilot:standup              # since the previous working day
> /ticket-pilot:standup 2 days      # custom window
```

Compiles **Yesterday / Today / Blockers** from `.ticket-work/` state files and git history — one line per ticket, paste-ready for Slack. Flags tickets stalled more than 2 days and never calls anything "done" that isn't merged.

---

## Auto-trigger on assignment (optional)

`scripts/poll-jira.sh` watches for tickets assigned to you in a trigger status and launches the pipeline headlessly for each new one.

```bash
DRY_RUN=1 ./scripts/poll-jira.sh     # see what it would do — start here
./scripts/poll-jira.sh --watch       # foreground loop, every 10 min
```

Or via cron (weekdays, working hours):

```cron
*/10 9-18 * * 1-5  cd /path/to/repo && /path/to/poll-jira.sh >> ~/.ticket-pilot/poll.log 2>&1
```

Environment knobs: `TRIGGER_STATUS` (default `To Do`), `POLL_INTERVAL`, `REPO_DIR`, `STATE_DIR`, `PILOT_LEVEL` (default `3` — headless runs always work in an isolated git worktree, so they never touch your checkout). On macOS you get a desktop notification when a run starts, finishes (✅ branch ready), or fails (❌ with the log path); exit codes land in `~/.ticket-pilot/run-<KEY>.exit`, logs in `run-<KEY>.log`.

**Two pieces of earned advice:**

1. **Run the pipeline manually for a couple of weeks first.** Enable the poller only once you trust what comes out the other end.
2. **Pick a trigger status you control.** With the default `To Do`, a ticket being *assigned* isn't enough — *you* drag it into the trigger column when you want the agent to start. Assignment alone shouldn't launch an unattended agent.

---

## Configuration

| What | Where | Notes |
|---|---|---|
| Autonomy, TDD, commands per repo | `.ticket-pilot.json` at your repo root | start from `templates/ticket-pilot.example.json`; flags override it |
| Build/test allowlist | your repo's `.claude/settings.local.json` | start from `templates/settings.example.json` |
| Repo conventions | your repo's `CLAUDE.md` | the single biggest quality lever |
| Poller behavior | env vars on `poll-jira.sh` | `TRIGGER_STATUS`, `POLL_INTERVAL`, `REPO_DIR` |
| Pipeline behavior | `skills/*/SKILL.md` | it's all instructions — fork and tune the prose |
| Blocked commands | `hooks/guard.sh` | regex deny-list; extend it if your team has more no-go commands |

---

## The safety model

Three layers, because instructions alone are not a boundary:

1. **Skill rules** — the pipeline is told: never push, never write to Jira, treat ticket text as *requirements for the code*, not instructions to the agent (prompt-injection hygiene), stop on a dirty working tree, never weaken tests to make them pass.
2. **Permission deny-list** — `git push`, `gh pr create/merge`, and Jira writes are denied in settings.
3. **The guard hook** — `hooks/guard.sh` runs before every Bash call and hard-blocks push/PR/Jira-write commands, including compound (`git add && git push`) and indirect (`git -C dir push`) forms.

> ⚠️ **Heads-up:** while the plugin is enabled, layer 3 applies to *every* Claude session in the project — Claude can never push; you always do. That's the point, but if it's too strict for some project, disable the plugin there.

Human gates: ambiguity resolution (Phase 1), plan approval (Phase 3), and the push itself (always). Interrupted runs resume from the last completed phase via `.ticket-work/<KEY>/state.md`.

---

## Using with Gemini CLI or Antigravity

ticket-pilot is built as a Claude Code plugin, but the `SKILL.md` format is now a
cross-tool standard: [Gemini CLI](https://geminicli.com/docs/cli/skills/) and
[Antigravity](https://codelabs.developers.google.com/autonomous-ai-developer-pipelines-antigravity)
both discover skills from a shared `.agents/skills/` directory. The skills port;
the plugin mechanics (subagents, the guard hook, `/plugin` install) do not.
Read the [feature-parity notes](#what-you-lose-outside-claude-code) below before
relying on it.

### Gemini CLI

1. **Copy the skills into your work repo** (Gemini reads `.agents/skills/` and
   `.gemini/skills/`; the former is also read by Antigravity, Cursor, and
   Codex CLI, so prefer it):

   ```bash
   git clone git@github.com:CristianPGit/claude-ticket-pilot.git /tmp/ticket-pilot
   mkdir -p /path/to/work-repo/.agents/skills
   cp -R /tmp/ticket-pilot/skills/* /path/to/work-repo/.agents/skills/
   ```

2. **Recreate the push/Jira-write block** in your work repo's
   `.gemini/settings.json` (Gemini has no PreToolUse hooks; `excludeTools` is
   the closest mechanism):

   ```json
   {
     "excludeTools": [
       "run_shell_command(git push)",
       "run_shell_command(gh pr create)",
       "run_shell_command(gh pr merge)",
       "run_shell_command(jira issue edit)",
       "run_shell_command(jira issue move)",
       "run_shell_command(jira issue comment)"
     ]
   }
   ```

3. **Invoke by intent, not slash command** — Gemini activates skills by matching
   your request against the skill description:

   ```
   gemini
   > work on ticket PROJ-123        # activates the ticket skill
   > triage PROJ-456                # activates triage
   > prep my standup                # activates standup
   ```

4. **Headless / poller**: change the launch line in `scripts/poll-jira.sh` from
   `claude --permission-mode acceptEdits -p "..."` to
   `gemini --approval-mode auto_edit -p "Use the ticket skill on $key at autonomy level 3"`.

### Antigravity

1. **Copy the skills** into `<project-root>/.agents/skills/` (same `cp` as above —
   if you already did it for Gemini, you're done; they share the directory).
2. **Optionally register the pipeline as a slash command**: copy
   `skills/ticket/SKILL.md` to `.agents/workflows/ticket.md` — files in
   `.agents/workflows/` become commands in Antigravity's chat interface.
3. **Recreate the push block** with Antigravity's terminal **deny list**
   (Settings → agent terminal permissions): add `git push`, `gh pr create`,
   `gh pr merge`, and the `jira issue` write subcommands.
4. **Scheduling**: skip `poll-jira.sh` — Antigravity's manager runs scheduled
   tasks and parallel local agents natively; point a scheduled task at the
   ticket skill instead.

### What you lose outside Claude Code

| Capability | Claude Code | Gemini CLI / Antigravity |
|---|---|---|
| No-push / no-Jira-write boundary | **enforced** by a PreToolUse hook, injection-resistant | advisory — `excludeTools`/deny lists are prefix filters, documented as not a security boundary |
| Review panel (Phase 4) | 3 specialized agents **in parallel** | sequential self-review; the `agents/*.md` prompts must be inlined or adapted to each tool's persona format |
| `requirements-analyst` etc. as isolated subagents | native | adapt to Antigravity `agents.md` personas / inline the prompts |
| Install & updates | `/plugin marketplace update` | re-copy files (or script it) |
| Resume via `state.md` | instructed, works the same | instructed, works the same ✔︎ |

The pipeline prose, phases, artifacts (`.ticket-work/`), and human gates work
identically everywhere — they're just instructions. What changes is how hard
the guarantees are. If the enforced no-push boundary is why you can defend this
setup at work, treat the other tools as read-only companions (`triage`,
`inbox`, `standup`) and keep the implementing pipeline on Claude Code.

---

## Troubleshooting

**"jira: command not found" in the pipeline** — install [jira-cli](https://github.com/ankitpokhrel/jira-cli) and run `jira init`, or just paste the ticket text when asked.

**Pipeline stalls on permission prompts** — your build/test commands aren't allowlisted. Add them to `.claude/settings.local.json` (see [Configuration](#configuration)).

**"working tree is dirty" stop** — deliberate: the pipeline won't stash your changes. Commit/stash yourself, or re-run with `--worktree` to leave your checkout untouched.

**A legitimate command got blocked by the guard** — the hook errs toward blocking anything push/PR/Jira-write-shaped. Run the command yourself in a terminal; that's the boundary working as intended.

**Headless run produced nothing** — check `~/.ticket-pilot/run-<KEY>.log`. Most common cause: a Phase 1 ambiguity that needed a human; run interactively to answer it, and it resumes where it stopped.

---

## Roadmap

ticket-pilot today is a **structured agentic workflow**: the six-phase topology
is fixed, the intelligence lives inside each phase. That's deliberate —
unattended code changes need reliability more than creativity. The roadmap
below moves it up the agency ladder one earned step at a time.

**Guiding rule: evidence before features.** Nothing below ships until real
tickets through the current pipeline show where it actually falls short —
`memory.md` and the retros are the prioritization signal, not intuition.

### v0.5 — deeper ground truth
- [ ] **Runtime verification**: after tests pass, start the service and
  exercise the changed endpoint for real — request in, response out, logs
  checked. Catches the bug class tests miss when the pipeline wrote both the
  code and the tests.
- [ ] **Review convergence loop**: fix → re-review → fix until the panel is
  clean, bounded at 3 rounds (today: one arbitrated pass plus at most one
  re-review).

### v0.6 — adaptive topology
- [ ] **Ticket-type dispatch**: classify the ticket at Phase 0 (hotfix /
  feature / schema migration / chore) and select a pipeline variant — skip
  the analyst for trivial bugs, add a migration-safety phase for schema
  changes. First step toward the workflow choosing its own shape.

### v0.7 — queue-level agency
- [ ] **Overnight queue agent**: replace the one-ticket poller with a session
  that owns the queue — triages everything assigned, picks what's safe at
  level 3, works tickets in parallel worktrees, and writes a morning report
  with branches ranked by confidence.

### Experimental / needs data first
- [ ] **Best-of-N implementations**: for L/XL tickets, 2–3 independent
  implementations in separate worktrees, judge panel picks the winner.
  Opt-in per ticket (≈3× cost).
- [ ] **Self-tuning**: `/retro` proposing edits to the skill prompts
  themselves on repeat failures (today it stops at proposing CLAUDE.md and
  config edits). Deliberately last — self-modifying instructions need a
  track record to tune against.

### Not planned — by design
- ❌ `git push` / PR creation — the human ships, always.
- ❌ Jira write-back — the pipeline stays invisible to company systems.
- ❌ Full end-to-end autonomy — the ceilings above are governance, not
  missing features.

## Acknowledgments

The hierarchical review arbitration (`tech-lead` agent), persistent pipeline
memory, and the retro learning loop are patterns adapted from
[CrewAI](https://crewai.com/open-source)'s manager-agent process, unified
Memory system, and training loop — reimplemented here as plain markdown
skills instead of a Python runtime.

## License

MIT — see [LICENSE](LICENSE).
