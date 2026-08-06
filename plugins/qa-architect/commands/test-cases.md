---
description: Generate Happy/Sad/Edge test cases for a Linear task, GitHub PR, diff, or feature description.
argument-hint: [LINEAR-ID | PR #/URL | "feature description" | (blank = current branch diff)]
---

Generate QA test cases for: **$ARGUMENTS**

If no argument was given, use the current branch's diff against the base branch as the source.

Invoke the `test-cases` skill. Follow its flow: load `.qa/preferences.md`, fetch the real source
of truth (Linear MCP / `gh pr view` + `gh pr diff` / `git diff`), then produce clear, concise,
traceable test cases grouped Happy Path / Sad Path / Edge cases (plus security, regression, and
non-functional when relevant), P1 first. End by offering to explore in a browser, automate, or
post the plan to the tracker.
