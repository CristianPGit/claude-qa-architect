# Library — code as a cache

Knowledge (area pages, cases) compiles into test scripts. Scripts are a **cache** of that
knowledge: reuse them while they still match the code, rebuild them when they don't, delete them
when the code is gone.

## Where scripts live

- **The repo has a test suite** → `<suite>/qa-library/<domain>/<area>/*.spec.ts` (or the
  framework's equivalent), so they run with the project's own config, fixtures and CI.
- **No suite** → don't introduce a framework. Scripts are drafts in `<session>/scripts/`, and
  adding a suite is offered at step 8.

Shared helpers go in `<suite>/qa-library/helpers/` — login per role, data setup/cleanup, flag
set/restore, env URL. Specs call helpers; they never re-implement them.

## The index — `.qa/library.md`

```markdown
| Check | Area | Covers | Script | Watches | Last green | Status |
|---|---|---|---|---|---|---|
| cart-expired-coupon | cart | ENG-412 TC-03 | qa-library/default/cart/coupon.spec.ts | src/cart/coupon*.ts | 2026-10-20 @a1b2c3d | fresh |
```

`Watches` are the source globs whose change can break the check. `Status` is
`fresh` · `stale` · `broken` · `evicted <date>`.

## Lookup, per planned check

1. **Evict** — every `Watches` glob matches nothing on the head → delete the script, mark the row
   `evicted <date>`. The behaviour it covered is gone.
2. **Hit** — `git diff --quiet <last-green-sha> <head> -- <watches>` → unchanged. Run it as is.
3. **Stale** — watched files changed. Run it anyway:
   - passes → `fresh`, update `Last green`;
   - fails on the **test** side (selector, wait, changed copy the ACs approve) → rebuild through
     `automate-tests`' fix loop, then `fresh`;
   - fails on the **product** side → keep the script unchanged; it's a suspected bug for Prove.
4. **Miss** — no row → write it with `automate-tests`, tag it `@qa:<area> @check:<id>`, add the row.

## Script rules

- One behaviour per script file section, named after its case (`TC-03 expired coupon is rejected`).
- Data and users through helpers, cleaned up by the test itself.
- Web-first assertions, no fixed sleeps, no retries added to hide timing.
- Never weaken an assertion to go green — a red check that matches a real bug stays red.

Report cache stats in the report: hits · rebuilt · new · evicted.
