# Report — prove, draft, report

## Prove

A suspected bug only counts once a **failing repro test** proves it.

1. **Not-bugs first.** Check the domain's `not-bugs.md` and the brief's ACs. A match → drop it,
   note why.
2. **Repro test.** Write the smallest test that asserts the **expected** behaviour (from the AC,
   the spec, or the behaviour before the change) on the shortest path to the failure.
3. **Run it twice** on a clean precondition. Same failure both times → **proven**. Passes once →
   **flaky**: report it as a flaky finding, not a bug. Fails differently → keep narrowing.
4. **Origin.** Did the PR under test introduce it? Run the repro against the base (a base
   build/env, or a worktree of the base) when you can; otherwise `git blame` the faulty lines
   against the PR's commits. Record `introduced by #<n>` or `pre-existing`.

Evidence per proven bug, saved under `<session>/evidence/<BUG-n>/`: the repro test, both
failing outputs, screenshot and trace, relevant console and network entries, env + build/commit,
and the test data used.

## Redact

Before any evidence is quoted in a draft, attached to a tracker or shown in chat, strip:
`Authorization`, `Cookie`, `Set-Cookie`, `X-Api-Key` and similar headers; bearer/JWT strings
(`eyJ…`); values of env vars that `domain.md` lists as credentials; passwords and emails of test
users (use the role name). Replace with `[redacted]`. Raw traces and HARs stay in the session dir
and are never attached — attach a redacted excerpt instead.

## Bug drafts

One file per proven bug, `<session>/bugs/<BUG-n>.md` — the triager's job:

```markdown
# <BUG-n>: <what is wrong, in user terms>
Severity: 🔴 critical · 🟠 major · 🟡 minor · 🔵 trivial   Area: <area>   Env: <env> @ <build/sha>
Introduced by: #<pr> (<sha>) | pre-existing   Fix grade: junior | needs-owner — <reason>
## Steps
1. …
## Expected / Actual
- Expected: … (from <AC / spec>)
- Actual: …
## Evidence
- Repro: `<path>` — fails 2/2
- Screenshot, trace, logs: `evidence/<BUG-n>/…`
```

Fix grade follows the rules in [`fix.md`](fix.md). Drafts are filed only if picked at step 8.

## The report — `<session>/report.md`

```markdown
# QA report — <ref>: <title>
Verdict: ✅ ship · ⚠️ ship with risks · ⛔ don't ship — <one line why>
Env: <env> @ <build/sha>  ·  Preflight: READY  ·  Restore: done, claim released

## Checks
| Check | Kind | Result | Evidence |
|---|---|---|---|
| TC-03 expired coupon | ❌ Sad | 🔴 fail → BUG-1 | evidence/BUG-1 |
| Smoke: checkout | ♻️ | 🟢 pass | trace.zip |

## Bugs
| Bug | Severity | Introduced by | Grade |
|---|---|---|---|

## Not covered
<draft and manual cases left open, flaky findings, anything skipped and why>

## Cache
hits <n> · rebuilt <n> · new <n> · evicted <n>
```

In chat, print the verdict line, the bugs table and the counts — the full report stays on disk.
