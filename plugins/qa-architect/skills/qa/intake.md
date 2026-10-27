# Intake — from reference to requirements brief

Goal: one file, `<session>/brief.md`, that every later step reads instead of re-fetching.

## Session dir

`.qa/sessions/<ref>/` where `<ref>` is the ticket ID (`ENG-412`), `pr-<n>`, `build-<version>`,
or the branch name slugified. If it already exists with a `log.md` and the request isn't
`resume`, start a fresh `<ref>-2` rather than overwrite a previous run.

## Fetch the source

Never invent requirements — every AC in the brief points to where it came from.

| Reference | Fetch |
|---|---|
| Linear ID | Linear MCP `get_issue`: title, description, ACs, comments, sub-issues, attachments, linked PRs. Follow linked PRs too. |
| Jira key (`PROJ-123`) | The Atlassian MCP server if connected, else `jira issue view <key> --plain --comments 20`; same fields as Linear. Neither available → work from what the user pasted and say so in *Assumptions*. |
| GitHub PR (`#123` / URL) | `gh pr view <n> --json title,body,files,commits,baseRefName,headRefName,author,url` and `gh pr diff <n>`. Follow the linked issue. |
| Build / version | The release's tag range: `git log --oneline <previous-tag>..<tag>`, release notes, and every PR/ticket those commits name. |
| Bug ID (for `fix`) | The tracker issue plus the PR it links or names; no PR → ask nothing, grade it `needs-owner` in [`fix.md`](fix.md). |
| Spec file / failing test | The test, the code it exercises (its imports and page objects), and the last failure output. |
| Feature description only | The text itself; every AC is marked `stated in request`, gaps go to *Assumptions*. |
| Nothing | (After the no-reference rules in `SKILL.md` chose "test the diff".) The current branch: base from `gh pr view --json baseRefName` (if a PR exists) else `git symbolic-ref refs/remotes/origin/HEAD`; then `git fetch` and `git diff origin/<base>...HEAD`. |

For code in another repo or branch: find the live repo in `repos.md`, `git fetch` there, and read
with `git show origin/<branch>:<path>` / `git grep <pattern> origin/<branch>`. Never check out.

## Locate the code

Map each changed file to an **area** from the domain pack (`areas/*.md` list their code paths).
Read the changed code itself — the diff's new branches, error states and inputs are where the
cases come from. Note `file:line` for each behaviour the brief mentions.

## Requirements brief

Write `<session>/brief.md`:

```markdown
# Brief — <ref>: <title>
Source: <links>  ·  Domain: <pack>  ·  Base: <base>@<sha>  ·  Head: <head>@<sha>

## Change
<2–4 lines: what changes for the user, in plain words>

## Acceptance criteria
| # | Criterion | From |
|---|---|---|
| 1 | <criterion> | ticket AC 2 / PR body / inferred from `cart.js:41` |

## Code touched
- `<file:line>` — <what it does> — area `<area>`

## Risk
- Areas touched and their bug history (from the runs index): <area: n bugs in last 10 runs>
- Sensitive: auth · money · data integrity · migrations · flags — <which apply>

## Assumptions
- <where the source was silent and what you assumed instead — each one is a reviewable line>

## Out of scope
- <what you will deliberately not test, and why>
```

Inferred criteria are fine; unmarked ones are not. Append `intake → brief.md` to `log.md`.
