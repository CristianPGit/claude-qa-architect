# Strategy — decide the mix, then decide per case

Input: the brief, the domain pack, the runs index, the library index. Output: `<session>/plan.md`
and a decision block printed to the user. No questions — the words in the request can force a
mode; otherwise you pick.

## 1. The mix

| Mode | Pick it when |
|---|---|
| **Smoke** | Always, as the first gate: the domain's critical flows from `project.md`, from the cache. A smoke failure stops the rest — report it as an env or build problem. |
| **Regression** | The diff reaches existing tests. Run only those ([Reachable tests](#reachable-tests)), not the whole suite. |
| **Test cases** | There are ACs or new behaviour — the `test-cases` skill turns the brief into the table. |
| **Exploratory** | UI-facing change, thin ACs, or an area with bugs in recent runs. One explorer per risky area, each with a charter ([`swarm.md`](swarm.md)). |
| **Swarm** | Release / build, or more than ~3 areas touched, or more than ~15 cases to automate. |
| **Bug bash** | Only when asked (`bug bash <area>`). |

**Risk weighting.** An area with bugs in the last 10 runs (runs index) gets one level more:
+1 explore charter, Sad/Edge cases kept that calibration would otherwise trim. Areas whose recent
runs were clean get the leaner treatment. Sensitive areas from the brief (auth, money, data
integrity) are never trimmed below P1 + their Sad paths.

## 2. Per case: automate now / draft / manual

| Verdict | When |
|---|---|
| 🤖 **Automate now** | P1/P2, deterministic, the UI or API is stable enough, and the check will be worth re-running. Goes to `automate-tests` and into the cache. |
| 📝 **Draft** | Worth automating but blocked now: data or env not available, UI still moving, flag not ready. The script is written to the session dir, not the library, and listed in the report. |
| 👤 **Manual** | One-off, visual judgement, third-party UI, or cost greater than value. Run it now by driving the browser; keep the steps in the report. |

## 3. Cache state per check

For each planned check, look it up in the library index ([`library.md`](library.md)):
**hit** (run it as is) · **stale** (run it, rebuild on a test-side failure) · **miss** (write it) ·
**evict** (its code is gone — delete it).

## Reachable tests

Pick the existing tests the diff can reach, in this order:
1. The repo's own selection tool, if configured (e.g. a `test-impact.json` → `test-impact -c <file>`).
2. Specs that import, or are tagged with the area of, a changed file (`git grep` on the paths).
3. Nothing found → the area's specs from its area page; still nothing → smoke only, and say so.

## Budget

Defaults, overridable in `.qa/preferences.md` (*Budget* section):

| Mode | Time box | Max parallel agents |
|---|---|---|
| plan only | 10 min | 0 |
| a PR / ticket, no swarm | 45 min | 2 |
| health run | 30 min | 2 |
| swarm / release | 2 h | 6 |
| bug bash | 60 min | 10 |

Also: at most 4 fix attempts per failing script, 2 review rounds per packet, 1 rebuild per stale
check. Note the start time in `log.md`; check it after each step. Out of budget → finish the
current check, skip to Restore, and list everything not done under *Not covered*.

## Decision block

Write the full plan to `<session>/plan.md`, then print only this:

```
doing: <modes>, because <one-line reason from the brief/risk>  ·  budget: <time box>, <n> agents
| Check | Area | Kind | Verdict | Cache |
|---|---|---|---|---|
| Smoke: checkout | checkout | ♻️ | 🤖 | hit |
| TC-03 expired coupon | cart | ❌ | 🤖 | miss |
| Explore: coupon stacking | cart | 🔍 | 👤 | — |
```

Then carry on to Prepare. `plan only` ends here, after the `test-cases` table.
