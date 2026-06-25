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
| `/qa-architect:test-cases ENG-412` | Generate a test plan for a Linear task… |
| `/qa-architect:test-cases 123` | …or a GitHub PR… |
| `/qa-architect:test-cases` | …or your current branch diff (no argument). |
| `/qa-architect:qa-automate` | Explore in a browser, write + run + auto-fix automated tests. |
| `/qa-architect:qa-setup` | Run the three-phase project setup. |
| `/qa-architect:qa-calibrate "too many edge cases"` | Record a standing preference. |

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
You:  /qa-architect:test-cases 123

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

## 📁 What gets written to your repo

QA Architect keeps everything **project-local and committable** so your whole team inherits it:

```
.qa/
├── preferences.md     # your calibration — depth, style, always/never include
├── project.md         # apps, stack, auth, environments, critical flows (from setup)
└── apps/<name>.md     # per-app notes (monorepos)
```

Nothing else is created without your say-so. It never commits, pushes, or posts to
Linear/GitHub without asking.

---

## 🧩 What's inside the plugin

```
claude-qa-architect/
├── .claude-plugin/
│   ├── plugin.json          # plugin manifest
│   └── marketplace.json     # marketplace listing
├── .mcp.json                # bundles Linear + chrome-devtools + Playwright MCP servers
├── agents/
│   └── qa-architect.md      # the autonomous QA agent
├── skills/
│   ├── test-cases/          # generate Happy/Sad/Edge test cases
│   ├── automate-tests/      # browser exploration + automation + auto-fix
│   ├── qa-calibration/      # remember feedback across sessions
│   └── qa-architect/        # three-phase project setup orchestrator
├── commands/                # /test-cases, /qa-automate, /qa-setup, /qa-calibrate
└── templates/               # test-plan & preferences templates
```

---

## 🛡️ Safety & principles

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
