# Domains — knowledge packs

A **domain** is one product surface with its own repos, environments and data — "payments",
"mobile app", "admin". A single-app repo has one domain, `default`. Each domain gets a pack the
loop subscribes to at step 0.

## Pack layout

```
.qa/domains/<domain>/
├── domain.md        # domain skills: environments, config, flags, test data, test users, recipes
├── repos.md         # which repos make up the domain, and which are live
├── not-bugs.md      # behaviour that looks wrong but is intended — checked before filing
└── areas/<area>.md  # one page per area: code paths, flows, selectors, bug history
```

### `domain.md` — the domain skills

```markdown
# Domain — <name>
## Environments
| Env | URL | Safe to mutate | Claim mechanism |
|---|---|---|---|
| local | http://localhost:3000 | yes | none |
| staging | https://staging.example.com | yes | <lock file / label / channel / API> |
| prod | https://example.com | **never** | — |
## Config
<knobs the tests set and how: env vars, admin settings, API calls — and how to read them back>
## Feature flags
<system, how to read a flag, how to write one; flags this domain's tests usually need>
## Test data
<seed scripts, fixtures, factory/API calls — the exact command, and how to clean up>
## Test users
<roles and where credentials come from — env var NAMES only, never values>
## Recipes
<setups that worked, by flow: "checkout with coupon → flag X on for user, seed cart Y">
```

### `repos.md`

```markdown
| Repo | Role | Status | Local path | Default branch | Notes |
|---|---|---|---|---|---|
| org/web | storefront UI | live | ../web | main | |
| org/cart-service-old | cart API | **superseded** by org/cart | — | master | archived 2026-03 |
```

### `areas/<area>.md`

```markdown
# Area — <name>
Code: `src/cart/**`, `api/cart/**`  ·  Entry: /cart  ·  Library tag: @qa:cart
## Flows
- <flow>: <steps in a line>
## Stable selectors
- <element>: `getByRole('button', { name: 'Apply coupon' })`
## Bug history
- 2026-10-12 · ENG-401 · half-cent rounding → fixed in #233
## Facts
- <fact> — verified 2026-10-20 (run pr-233)
```

Every fact carries `verified <date> (<run>)` or `unverified`. Learning ([`learning.md`](learning.md))
corrects or drops them.

## Pick the domain

Match the brief's repo, paths, tracker team/labels against each pack's `repos.md` and area code
paths. One match → use it. Several → use all touched, one pack each. None and only one pack
exists → use it. None at all → set one up.

## Set up a domain

Autonomous — detect, don't ask; whatever you can't find becomes an `unverified` line or an
assumption in the brief.

1. **Runbook first.** No `.qa/project.md` → run the `qa-architect` skill's Phase 1 analysis and
   write `project.md`, `preferences.md` and `calibration-log.md` from its templates, skipping the
   Phase 2 questionnaire (record the gaps as `unverified`).
2. **Repos.** Start from the current repo; add repos the code, CI or README reference. Mark a repo
   **superseded** when `gh repo view <r> --json isArchived` is true, its README says it moved, or
   another repo has taken over its paths with newer commits. Never read superseded code for intake.
3. **Areas.** Split by routes / screens / modules into ~5–12 areas a tester would name. One page
   each, with code globs, entry URL, flows and the selectors you can confirm from the code or a
   quick browser pass.
4. **Domain skills.** Environments from `.env.example`, config files and CI; flags from the flag
   client in the code; test data from seed scripts, fixtures and factories; users from fixtures
   and env var names. Write the exact commands.
5. **`not-bugs.md`** starts empty.
6. **Guard and ignore.** Write every host of every environment marked **never** into
   `.qa/guard.json` (`{"blockedHosts": ["shop.example.com", "*.prod.example.com"]}`, merged with
   what's there — `*.` covers subdomains). Add `.qa/sessions/` to the repo's `.gitignore` if it
   isn't covered.
7. Append `setup <domain> → <n> areas, <n> repos` to `log.md`. Nothing is committed here — the
   pack goes into the step 8 knowledge commit.
