# agent-eval

Evals for AI features and MCP servers. Run every task N times, grade each transcript with
deterministic checks and an LLM rubric, and report how often the system gets it right:

- **pass@k**: at least one of k trials passed, so the system *can* do it
- **pass^k**: all k trials passed, so the system does it *reliably*
- **flaky**: some trials passed and some failed. This is the same idea as `flaky-test-detector`,
  applied to model behaviour.

A unit test asks whether something works. An eval asks how often it works, because the same input
can produce a different answer on every run.

## Install

Not published to npm (the name is taken by an unrelated package). From the monorepo root:

```bash
npm install && npm run build
npm run eval -- packages/agent-eval/examples/command.eval.json
```

Claude-backed targets and the `llm-rubric` grader read credentials from `ANTHROPIC_API_KEY` or an
`ant auth login` profile. The `command` target with deterministic graders needs no credentials.

## Usage

```bash
agent-eval [options] <eval.json> [more.json ...]
```

| Flag | Default | Description |
|---|---|---|
| `-n, --trials <n>` | from file | Override trials per task |
| `--min-pass-rate <0..1>` | `1` | Per-task pass rate needed for exit code 0, so it can gate CI |
| `--list-tools` | | MCP targets: connect, print the server's tools, exit (no credentials needed) |
| `-f, --format` | `table` | `table`, `markdown` (PR comments), `json` |
| `-o, --output` | stdout | Write the report to a file |

## Eval files

```json
{
  "name": "playwright-mcp-tool-selection",
  "target": { "type": "mcp", "command": "npx", "args": ["playwright", "mcp", "--headless"] },
  "trials": 5,
  "tasks": [
    {
      "id": "navigate",
      "input": "Open https://playwright.dev in the browser.",
      "graders": [
        { "type": "tool-called", "tool": "browser_navigate", "input": { "url": "playwright.dev" } },
        { "type": "max-tool-calls", "max": 1 }
      ]
    }
  ]
}
```

A trial passes only if **every** grader on the task passes.

### Targets

| Type | What runs | Use it for |
|---|---|---|
| `command` | Any program. The task input goes to stdin and stdout is graded | Your own agent, a script, an API wrapper |
| `claude` | One Claude call with an optional `system` prompt | Prompt and system-prompt regressions |
| `mcp` | An MCP server over stdio. Claude gets its tools and the task input | **Do agents understand your MCP server?** Tool selection and arguments |

For `mcp`, tool calls are **recorded, not executed**, unless `"execute": true`. That makes it safe
to point at servers with side effects. With execution on, results are fed back to Claude for up
to `maxTurns` (default 8). Set `model` and `system` per target; the default model is
`claude-opus-5-5`.

### Graders

| Type | Passes when |
|---|---|
| `contains` / `not-contains` | Output does or doesn't include `value` (`ignoreCase`, default true) |
| `regex` | Output matches `pattern` (`flags` optional) |
| `tool-called` | `tool` was called. With `input`, every key must match: strings as case-insensitive substrings, everything else exactly |
| `tool-not-called` | `tool` was never called |
| `max-tool-calls` | At most `max` tool calls (`0` means "should answer without tools") |
| `llm-rubric` | A judge model (`judgeModel`, default `claude-opus-5-5`, low effort) says the transcript meets `rubric` |

Prefer deterministic graders. Use `llm-rubric` only for what can't be checked mechanically (tone,
correctness of free text), and write rubrics as concrete, checkable requirements.

## Examples

- [`examples/command.eval.json`](examples/command.eval.json) runs offline against a coin-flip
  "agent". It shows a reliable task, a flaky one and a failing one.
- [`examples/playwright-mcp.eval.json`](examples/playwright-mcp.eval.json) checks whether Claude
  picks the right Playwright MCP tool for plain-English browser requests, and answers general
  questions without tools.

```
  AGENT EVAL: coin-flip-agent  (target: command, 8 trial(s) per task)
  ==============================================================================
  STATUS  TASK                             PASS    pass@k  pass^k  AVG ms
  PASS    arithmetic                       8/8     yes     yes     58
  FLAKY   capital                          6/8     yes     no      58
          └ contains: did not find "Vienna"
  FAIL    unknown                          0/8     no      no      58
          └ not-contains: found "don't know"
  ------------------------------------------------------------------------------
  Tasks: 3  |  Reliable: 1  |  Flaky: 1  |  Failing: 1  |  Trial pass rate: 58%
```

## Cost

Each trial of a Claude-backed target is at least one model call, and each `llm-rubric` grader
adds one judge call per trial. Run `--trials 1` while you write tasks, then raise it for the real
measurement.
