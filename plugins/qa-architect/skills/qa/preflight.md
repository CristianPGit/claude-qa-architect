# Preflight — make the environment ready before any assertion

Nothing is asserted until preflight says READY. Every change it makes is recorded before it is
made, so it can always be put back.

## Scopes

| Scope | Used by | Covers |
|---|---|---|
| `full` | a normal run, `preflight <flow>` | everything below, for the run's flows |
| `shared` | the swarm orchestrator, once | Doctor, env claim, config, flags shared by all packets |
| `packet` | each swarm packet | that packet's own test data and test user only |

## 1. Doctor

Check, and fix what you can without asking:
- tools: `gh auth status`, the browser MCP server answers, node / the test runner runs;
- target: the env is in `domain.md` and marked safe to mutate — anything else, or anything that
  resolves to the prod URL, is refused outright;
- guard: `.qa/guard.json` lists the domain's production hosts and `.qa/sessions/` is gitignored —
  missing either → write it now (from `domain.md`), before anything touches an environment;
- reachability: the env's URL answers (`curl -sf -o /dev/null -w '%{http_code}' <url>`);
- credentials: the env var names `domain.md` lists are set (check presence, never print values);
- ownership: locks, deploys or flags someone else holds. These are the only mid-run stop — ask
  about all of them at once, now.

## 2. Claim the environment

Use the claim mechanism in `domain.md` (lock file, PR label, channel message, API). Record the
claim in the restore point. No mechanism listed → note "unclaimed" in the report.

## 3. Apply preconditions — config → flags → data → user

For each change, **first** append its original value to `<session>/restore.json`, **then**
write, **then** read it back:

```json
{ "env": "staging", "claim": "lock:staging-2 by qa/ENG-412", "restored": false,
  "changes": [
    { "kind": "flag", "key": "new-checkout", "before": { "...full flag..." }, "after": { "..." } },
    { "kind": "data", "id": "cart:qa-ENG-412", "before": null, "cleanup": "npm run seed:cart -- --delete qa-ENG-412" }
  ] }
```

**Flags — merge, never overwrite.** Read the whole flag object, change only the keys the test
needs (e.g. a targeting rule for the test user, not the global default), write the merged
object. Prefer per-user targeting over flipping a flag for everyone.

**Data** goes through the domain's helpers with a recognisable prefix (`qa-<ref>`), so cleanup
can find it. **Users** are the domain's test accounts — never real users.

Reuse a matching recipe from `domain.md` *Recipes*; save a new one there when a setup worked.

## 4. Verdict

| Status | Meaning |
|---|---|
| **READY** | Every precondition applied and read back. |
| **READY_WITH_WARNINGS** | Usable, with listed caveats (e.g. unclaimed env, seed partially applied for a P3 flow). |
| **NOT_READY** | A blocker. **Roll back what was applied first**, then report the blocker and what would unblock it. |

Print the verdict with one line per precondition. `preflight <flow>` ends here (after restoring).

## 5. Restore

At step 6, and on any abort: undo `restore.json` changes in **reverse** order, read each back,
release the claim, set `"restored": true`. A run resumed with `"restored": false` restores (or
continues the run that needs them) before anything else. The report states the restore result.
