---
name: bug-hunt
description: Run a multi-agent bug hunt over a test suite or project directory — parallel finders (logic, async, selectors, flakiness, config) with adversarial verification. Usage — /bug-hunt [directory], defaults to search-test-scenario.
---

# Bug Hunt

The user has explicitly invoked this command, which is an opt-in to multi-agent orchestration.

1. Determine the target directory from the arguments. If none given, default to `search-test-scenario`. It must be a directory that exists directly under the workspace root (`dev`, `search-test-scenario`, `search-test-scenario-cypress`, `demo-shop`, `flaky-test-detector`, etc.). If the argument doesn't match an existing directory, list the candidates and ask.
2. Call the Workflow tool with `{ name: "bug-hunt", args: { target: "<directory>" } }`.
3. When it completes, present the confirmed findings as a compact table (severity emoji 🔴/🟡/🟢, `file:line`, title) sorted by severity, with a one-line detail under each high-severity row. State how many candidates were found vs confirmed. Do NOT fix anything unless asked.

Known deliberate constraints the report must never flag: generous timeouts (slow FAT env), `workers: 1` (shared test account), no `webServer` config.
