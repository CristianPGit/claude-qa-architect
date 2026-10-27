# Fix — small bugs as stacked PRs

The goal is a reviewable fix the original author approves, not a fix that lands on its own.
Never merge. Never push to the author's branch.

## Grade

A proven bug is **`junior`** only if all hold:
- the PR under test introduced it (Prove recorded `introduced by #<n>`);
- the root cause is understood and the fix is local — about **2 files, ~30 changed lines**;
- it touches no **migrations, auth/permissions, money (prices, payments, billing), config,
  infra, flags or secrets**, and changes no public API contract.

Anything else is **`needs-owner`**, with the reason in the bug draft. `needs-owner` bugs are
reported, never fixed.

## The fixer — one subagent per bug

Brief it with the bug draft, the repro test, the PR's head branch, and these two phases.

### `prepare`

1. `git fetch`, then `git worktree add <session>/wt/fix-<BUG> -b qa-fix/<BUG> origin/<pr-head>`.
2. Add the repro test to the repo's suite → run it → **red**, for the bug's reason.
3. Make the smallest change that turns it green. No refactors, no drive-by edits.
4. Run the repo's checks — lint, typecheck, the affected unit tests, the repro test → all **green**.
   A check that was already red on the PR head is noted, not fixed.
5. Return the diff, the red → green output, and the checks run. If the change grows past the
   `junior` limits, stop and regrade to `needs-owner`.

### `publish` — only after the user's go

1. `git push -u origin qa-fix/<BUG>`.
2. Open the stacked PR on top of the PR under test:
   `gh pr create --base <pr-head> --head qa-fix/<BUG> --title "fix(<area>): <bug title>" --body <body>`
   — body: link to the bug and the PR, the cause in two lines, the red → green output, and
   "Stacked on #<n> for its author to review; merge into #<n> if accepted."
3. Request review from the PR's author: `gh pr view <n> --json author -q .author.login`, then
   `gh pr edit <new-pr> --add-reviewer <login>`.
4. Remove the worktree. Report the PR URL.

## When it runs

- **In the loop (step 9):** the user already picked these bugs at step 8 — run `prepare`, then
  `publish` for each one that came back green.
- **Direct `fix <BUG-ID>`:** grade, run `prepare`, show the diff and red → green output, and stop.
  `publish` only on the user's go.
