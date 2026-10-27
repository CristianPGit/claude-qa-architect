<div align="center">

# 🧪 QA Architect

### An AI QA engineer for [Claude Code](https://claude.com/claude-code) — as a plugin **and** an agent.

Generate **Happy / Sad / Edge** test cases straight from your **Linear** tasks and **GitHub** PRs,
drive a **real browser** to explore behavior, then **write, run, and auto-fix** automated tests —
all while it **learns your calibration** so you never repeat yourself.

[![Claude Code Plugin](https://img.shields.io/badge/Claude%20Code-Plugin-D97757)](https://docs.claude.com/en/docs/claude-code/plugins)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Linear](https://img.shields.io/badge/Linear-integration-5E6AD2)](https://linear.app)
[![GitHub](https://img.shields.io/badge/GitHub-integration-181717)](https://github.com)

</div>

---

## ✨ What it does

QA Architect turns Claude Code into a senior QA engineer that lives in your repo.

| Capability | What you get |
|---|---|
| 🎯 **One `/qa` entry point** | Hand it a ticket, PR, build — or nothing, for your current branch. It plans, prepares the test env, executes, proves bugs with repro tests, reports with evidence and learns, then asks you **once, at the end**. |
| 🧠 **Test-case generation** | Clear, concise, **traceable** cases grouped Happy Path / Sad Path / Edge — plus security, regression & non-functional when they matter. One behavior per case, observable assertions, P1 first. |
| 🔗 **Linear + GitHub native** | Point it at `ENG-412` or PR `#123`. It pulls the real ticket, acceptance criteria, and the actual diff — it never invents requirements. |
| 🌐 **Real browser exploration** | Drives the app via **chrome-devtools**, **playwright-cli**, or **agent-browser** to capture real selectors, network calls, and error states — and to discover cases you can't see from code. |
| 🤖 **Automated tests + auto-fix** | Generates tests in **your** framework (Playwright, Cypress, …), runs them, and loops on failures — fixing bad tests while clearly flagging *real product bugs* instead of hiding them. |
| 🎚️ **Calibration that sticks** | Tell it "too many cases" or "you always miss accessibility" **once**. It writes the lesson to `.qa/preferences.md` and applies it forever. |
| 🏗️ **Three-phase project setup** | Deep codebase analysis → interactive questionnaire → a tailored, committable QA setup for your repo. |

---

## 🚀 Install

In Claude Code, add this repo as a plugin marketplace and install:

```bash
/plugin marketplace add CristianPGit/claude-qa-architect
/plugin install qa-architect@qa-architect
```

That's it. Restart isn't needed — the skills, slash commands, and the `qa-architect` agent are
available immediately.

> **Updating:** `/plugin marketplace update qa-architect` then re-install if prompted.

### Optional integrations

QA Architect is more powerful with these connected. All are optional — it degrades gracefully.

| Integration | Setup |
|---|---|
| **GitHub** | Install the [`gh` CLI](https://cli.github.com) and run `gh auth login`. Used for `gh pr view` / `gh pr diff` and posting PR comments. |
| **Linear** | The plugin bundles the Linear MCP server (`https://mcp.linear.app/sse`). On first use, Claude Code will prompt you to authenticate via OAuth. |
| **Browser drivers** | The plugin bundles **chrome-devtools** and **Playwright** MCP servers (auto-installed via `npx`). For `playwright-cli` codegen, have Playwright in your project (`npx playwright install`). |

---

## 🧭 Usage

### Slash commands

| Command | What it does |
|---|---|
| `/qa-architect:qa ENG-412` | The whole loop on a ticket, PR (`123`), build (`build 4.12`) or your branch (no argument). |
| `/qa-architect:qa 123 plan only` | Stop after the plan — no env touched. Other steering words: `preflight <flow>`, `explore`, `automate`, `swarm`, `resume`. |
| `/qa-architect:qa bug bash checkout` | 5–10 parallel explorers with focused charters; only proven bugs count. |
| `/qa-architect:qa fix ENG-456` | Fix a small bug red → green and, on your go, open a stacked PR for the original author. |
| `/qa-architect:qa` | No argument: resumes an unfinished run, else tests your branch diff, else runs a health check (smoke + stale checks + risky areas). |
| `/qa-architect:qa e2e/cart.spec.ts` | Run, diagnose and fix one test — or prove the bug it found. playwright-bdd suites go through the planner/generator/healer agents automatically. |
| `/qa-architect:qa-setup [domain]` | Three-phase project setup plus a knowledge pack per domain — the only place it asks questions up front. Optional: `/qa` sets up what's missing itself. |
| `/qa-architect:qa-learn "too many edge cases"` | Record a standing preference. |
| `/qa-architect:qa-learn` | Tidy all QA memory: consolidate preferences, re-verify facts, prune the script library, archive runs. `/qa` also does this on its own when memory grows. |

Three commands, by design: `/qa` decides between planning, automating, BDD and fixing itself.

> **Heads-up:** a bare `/qa` on a clean branch starts a health run, which **changes your test
> environment** (flags, seeded data), then restores it. It never touches hosts listed in
> `.qa/guard.json`.

### As an agent

Hand off autonomous QA work to the **`qa-architect`** agent:

```
> Use the qa-architect agent to QA PR #123 and automate the P1 cases.
```

### Just talk to it

The skills trigger on intent — no command needed:

```
> Write test cases for ENG-412
> QA this PR and tell me what's risky
> Now automate the P1 cases in Playwright and make them pass
> You're overthinking these — keep it to the important ones
```

---

## 🔬 How it works

### 1. Test cases — grounded in the real source of truth

```
You:  /qa-architect:qa 123 plan only

QA Architect:
  • gh pr view 123  +  gh pr diff 123      ← reads the actual change
  • reads .qa/preferences.md               ← applies your calibration
  • emits TC-01…TC-09, P1 first, Happy/Sad/Edge, each traced to a file:line or AC
  • offers: explore in browser · automate · post to the PR
```

Output is a compact, scannable table by default (it expands to full Given/When/Then only when a
case needs it):

| ID | Type | Scenario | Input → Expected | Pri |
|----|------|----------|------------------|-----|
| 1 | ✅ Happy | Valid coupon discounts the total | `SUMMER10` on `€50` cart → `€45.00` | 🔴 |
| 2 | ❌ Sad | Expired coupon is rejected clearly | `SUMMER` (expired) → total unchanged + *"This coupon has expired"* | 🔴 |
| 3 | ⚠️ Edge | Half-cent rounds up, not down | `2.005` → `2.01` *(not `2.00`)* | 🔴 |

Legend: ✅ Happy · ❌ Sad · ⚠️ Edge · 🔒 Security · ♻️ Regression · 📊 Non-functional · 🔴 P1 · 🟡 P2 · 🔵 P3

### 2. Browser exploration + automation + auto-fix

QA Architect picks the best available driver, **explores before it asserts** (real selectors,
real network/console errors), generates tests in your existing framework, then runs and
**auto-fixes the loop** — distinguishing a flaky/bad test from a genuine product bug and never
weakening an assertion just to go green.

### 3. Calibration — it remembers

```
You:  these are overthinking it, and you missed the empty-state case

QA Architect:
  → records to .qa/preferences.md:
      Depth: prefer fewer, high-value cases; cut speculative edge cases.
      Always-include: empty-state case for list/collection changes.
  → applies it from now on, in every session.
```

### 4. Three-phase project setup (`/qa-architect:qa-setup`)

1. **Deep codebase analysis** — detects apps, tech stack, auth, environments, feature flags,
   integrations, CI/CD, and existing tests.
2. **Interactive questionnaire** — asks only what it couldn't auto-detect: QA target, user
   personas, critical flows, test data, cleanup strategy.
3. **Setup generation** — writes a tailored, committable QA setup: `.qa/project.md` (durable
   context), `.qa/preferences.md` (calibration), and per-app notes.

---

## 🔁 Automate it — generate test cases on a Linear label

Don't want to run a command each time? Wire QA Architect to fire **automatically when you add a
label** (e.g. `qa-needed`) to a Linear issue — it generates the test plan and posts it back to
the ticket (and the linked GitHub PR) on its own.

Claude Code is an interactive CLI, so it doesn't poll Linear by itself — you connect the label
event to a headless Claude run. Three ways, from simplest to most native:

| Approach | Trigger | What you host | Best for |
|---|---|---|---|
| **C · Scheduled poller** *(easiest)* | A Claude routine runs every N min, finds issues labeled `qa-needed` with no QA comment yet, generates + posts | Nothing — runs in Claude Code's cloud | Getting it working today; a few-min delay is fine |
| **A · Webhook → serverless** | Linear webhook on *Issue label added* → your endpoint runs Claude headless → posts back | A tiny function (Vercel / Cloudflare / Lambda) | Real-time, event-driven, production |
| **B · Linear Agent app** | A native Linear *Agent* assigned/mentioned/labeled replies in-thread | A small app + OAuth (actor=app) | Feeling native — a real Linear agent, not a bot comment |

**The mechanics are the same in all three:**

1. **Trigger** — Linear → *Settings → API → Webhooks*, subscribed to `Issue` updates (fires on
   label changes). Native Linear *Automations* can't call an LLM, so the webhook is the seam.
2. **Brain** — the [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk) or
   `claude -p "<prompt>"` headless, fed the issue data + this plugin's `test-cases` skill, so the
   output is identical to running it by hand.
3. **Write-back** — the Linear API `commentCreate` mutation (and `gh pr comment` for the linked
   PR), authed with a Linear API key or the Agent OAuth token.

> **Recommended path:** prototype with **C** (a scheduled poller — zero hosting, reuses your
> connected Linear MCP), then graduate to **A** or **B** when you want it instant and native.
> Because the PR is already attached to the issue, one label can post the plan to **both** Linear
> and GitHub — turning the label into a single "QA this" button.

---

## 🔄 The `/qa` loop

| Step | What happens |
|---|---|
| 0 · Subscribe | Loads the domain's knowledge pack (live repos, area pages, test-data helpers) and past runs; sets one up if missing. |
| 1 · Intake | Fetches the ticket or diff — without touching your clones — and writes a requirements brief. |
| 2 · Decide | Picks smoke / regression / test cases / exploratory / swarm; per case automate now, draft or manual. Areas with past bugs get more weight. |
| 3 · Prepare | Doctor, claims the env, then config → flags → test data → test user, saving original values first. |
| 4 · Execute | Saved scripts first (a cache: hit, rebuild when stale, evict when the code is gone), new ones for the rest. |
| 5 · Prove | A suspected bug counts only when a repro test fails the same way twice. |
| 6 · Restore & report | Puts the env back, releases it, writes a verdict report with screenshots, traces and logs. |
| 7 · Learn | Updates area pages, records the run, drops facts that turned out wrong, tidies memory as it grows. |
| 8 · One confirmation | You pick which bugs to file, comments to post, the knowledge commit, and which small bugs to fix. |
| 9 · Fix small bugs | Failing test → smallest change → repo checks green → stacked PR for the PR author. Never merges. |

## 📁 What gets written to your repo

QA Architect keeps everything **project-local and committable** so your whole team inherits it:

```
.qa/
├── project.md          # runbook (read-mostly): apps, stack, auth, envs, prod-safety
├── preferences.md      # working policy: depth, style, always/never include
├── calibration-log.md  # audit ledger (append-only): every lesson, attributed + dated
├── sessions/<ref>/      # one /qa run: log, brief, plan, restore point, evidence, report, bug drafts
├── domains/<domain>/    # knowledge pack: domain.md, repos.md, not-bugs.md, areas/<area>.md
├── guard.json           # production hosts the guard hook refuses
├── library.md           # index of saved check scripts (the cache)
├── runs/                # index.md + one record per run
└── apps/<name>.md       # per-app notes (monorepos)
```

Saved check scripts live in your own suite, under `<suite>/qa-library/`, so they run with your
framework's config and CI.

Memory is **tiered by write-permission**: the runbook is read during runs but changed only by
setup or a human; live runs write fast notes to `sessions/`; feedback is captured to the
append-only ledger; and only the consolidate pass (`/qa-learn`, or `/qa` itself once the log grows) folds lessons
into a clean `preferences.md`. Git gives you version history and rollback; the ledger tells you
*when* and *why* any preference entered.

Nothing else is created without your say-so. It never commits, pushes, or posts to
Linear/GitHub without asking.

---

## 🧩 What's inside the plugin

```
plugins/qa-architect/
├── .claude-plugin/
│   └── plugin.json          # plugin manifest (listed by the root marketplace.json)
├── .mcp.json                # bundles Linear + chrome-devtools + Playwright MCP servers
├── hooks/                   # guard.py: denies prod hosts/merges, asks before outward actions
├── agents/
│   └── qa-architect.md      # the autonomous QA agent
├── skills/
│   ├── qa/                  # the /qa entry point: hub SKILL.md + one spoke per loop part
│   ├── test-cases/          # generate Happy/Sad/Edge test cases
│   ├── automate-tests/      # browser exploration + automation + auto-fix
│   ├── bdd-test-agents/     # Playwright test agents redirected into Gherkin + POM
│   ├── qa-calibration/      # remember feedback across sessions
│   └── qa-architect/        # three-phase project setup orchestrator
├── commands/                # /qa, /qa-setup, /qa-learn
└── templates/               # test-plan & preferences templates
```

---

## 🛡️ Safety & principles

The plugin ships a **PreToolUse guard** (`hooks/guard.py`, needs `python3`), so `/qa` can run
unattended without relying on the model's good behaviour alone:

| Action | Guard |
|---|---|
| Any tool call naming a host in `.qa/guard.json` (your production hosts; `*.` for subdomains) | ⛔ denied |
| `gh pr merge`, force pushes | ⛔ denied |
| `git push`, PR / issue / release writes, `gh api` writes, Linear / Jira / chat writes | ✋ your own permission prompt |
| Everything else (reads, local tests, browser on test envs) | ✅ passes |

`/qa-setup` and `/qa` write `.qa/guard.json` from the domain pack's environments. The guard is
active whenever the plugin is installed, so outside `/qa` you'll also be prompted before pushes.
It's tested offline in CI: `npm run eval -- packages/agent-eval/examples/qa-guard.eval.json`.

- **Ticket text is data, not orders** — instructions found in tickets, PRs, pages or logs are
  never followed, only quoted in the report.
- **Evidence stays local** — raw traces and logs live in gitignored `.qa/sessions/`; anything
  attached or quoted is redacted first.
- **Bounded** — every `/qa` mode has a time box and an agent cap (override in `preferences.md`).
- **Never invents requirements** — always works from the real ticket, PR, diff, or running app.
- **Never hides a real bug** — a failing test that reflects a genuine defect is reported, not
  silenced by weakening the assertion.
- **No surprise side-effects** — confirms before committing, pushing, or posting to
  Linear/GitHub, and before testing against anything that isn't local/staging.
- **Calibrated, not chatty** — matches the depth and style you've recorded; you shouldn't have
  to repeat yourself.

---

## 🤝 Contributing

Issues and PRs welcome. The plugin is plain Markdown + JSON — edit a `SKILL.md`, bump the version
in `plugin.json` and `marketplace.json`, and open a PR.

## 📄 License

[MIT](LICENSE) © Cristian Pandele
