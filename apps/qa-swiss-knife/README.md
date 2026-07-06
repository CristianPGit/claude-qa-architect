# ✚ QA Swiss Knife

A single-file, offline **testing toolbox** for QA engineers — plus a crew of AI teammates for Claude Code.

Open [`index.html`](index.html) in any browser. No build step, no server, no dependencies. Everything you paste stays in your browser — nothing is sent anywhere.

## What's inside

### 🧰 Tools (in the page)

Working, client-side utilities you reach for every day:

| Tool | What it does |
|------|--------------|
| **JSON Formatter** | Validate, pretty-print or minify JSON payloads and responses |
| **JWT Decoder** | Decode header + payload, check expiry — fully offline |
| **Encode / Decode** | Base64, URL, HTML-entity — UTF-8 safe (emoji & diacritics) |
| **Regex Tester** | Live JS regex with highlighted matches and capture groups |
| **Test Data Generator** | UUIDs, names, emails, phones, valid-checksum IBANs, test cards, passwords, dates |
| **Edge-Case Strings** | Copy-paste ammo — boundaries, Unicode, injection probes, format traps |
| **Timestamp Converter** | Epoch ⇄ human dates, relative time, live clock |
| **Diff Checker** | Line-by-line LCS diff — expected vs actual |
| **Bug Report Builder** | Fill the facts → pasteable Markdown ticket, environment auto-detected |
| **HTTP Status Codes** | Searchable reference with a QA slant |

### 🧰 The Arsenal

A curated list of extensions, apps and online tools worth installing — browser extensions, API/network tools, automation frameworks, security & quality scanners, and reference sites. All free or with a solid free tier.

### 🤖 The Agent Crew

AI teammates for [Claude Code](https://claude.com/claude-code). Their definitions live in [`.claude/agents/`](.claude/agents/). Copy that folder into any project (or into `~/.claude/agents/` for global use) and invoke them by name.

| Agent | Role |
|-------|------|
| 🧭 **interpreter** | Maps project logic — what the system is *supposed* to do |
| 🎯 **hunter** | Black-box bug hunting — API + browser, hostile inputs |
| 🔍 **reviewer** | Skeptical code review, hunts contradictions |
| 🔧 **fixer** | Minimal, proven bug fixes |
| 🎼 **orchestrator** | Manages the crew + builds automated test suites |
| ✍️ **scribe** | Test cases (emoji tables), bug tickets, release notes |
| 💣 **saboteur** | Negative tests, races, interrupted flows, hostile locales |
| 🚦 **gatekeeper** | Honest release go / no-go |
| 🕰️ **historian** | Flaky-test & regression forensics |

Beyond the five you asked for, the crew adds the **scribe** (paperwork), **saboteur** (destructive design), **gatekeeper** (release call) and **historian** (regression forensics) to cover the full QA lifecycle: understand → find → verify → fix → automate → document → judge.

#### Using the crew

Copy the agents into a project:

```bash
cp -r qa-swiss-knife/.claude/agents/ your-project/.claude/agents/
```

Then in Claude Code:

```
Use the hunter agent to black-box test the search API.

Orchestrator: full quality pass on the payments feature —
map it, hunt bugs, review the fixes, and write the regression tests.
```

## Deploy the page

It's a static file. Any of these work:

- **GitHub Pages:** Settings → Pages → deploy from `main` / root. Lives at `https://<user>.github.io/qa-swiss-knife/`.
- **Local:** just open `index.html`.
- **Any static host:** Netlify, Vercel, S3 — drop the file in.

## Contributing

Add a tool by dropping a `<section>` and a render/handler function into `index.html` (it's deliberately one file). Add an agent by adding a Markdown file under `.claude/agents/`.

## License

MIT — see [LICENSE](LICENSE).
