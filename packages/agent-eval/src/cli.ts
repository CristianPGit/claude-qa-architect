#!/usr/bin/env node

import { parseArgs } from "node:util";
import { readFileSync, writeFileSync } from "node:fs";
import { runEval } from "./runner.js";
import { listTargetTools } from "./targets.js";
import { failedGate, formatJson, formatMarkdown, formatTable } from "./report.js";
import { EvalFileSchema, type EvalFile, type EvalReport } from "./types.js";

const HELP = `
agent-eval - Evals for AI features and MCP servers

USAGE
  agent-eval [options] <eval.json> [more.json ...]

OPTIONS
  -n, --trials <n>         Override trials per task from the eval file
  --min-pass-rate <0..1>   Per-task pass rate required for exit code 0 (default: 1)
  --list-tools             mcp / webmcp targets: connect, print the tools, exit
                           (no Claude credentials needed — use it to write graders)
  -f, --format             Output: table, markdown, json (default: table)
  -o, --output             Write report to file
  -h, --help               Show this help

EVAL FILE (JSON)
  {
    "name": "playwright-mcp-tool-selection",
    "target": { "type": "mcp", "command": "npx", "args": ["playwright", "mcp", "--headless"] },
    "trials": 5,
    "tasks": [
      { "id": "open-page",
        "input": "Open https://playwright.dev",
        "graders": [{ "type": "tool-called", "tool": "browser_navigate",
                      "input": { "url": "playwright.dev" } }] }
    ]
  }

  Targets:  command (stdin -> stdout), claude (prompt), mcp (stdio server + Claude),
            webmcp (a page's WebMCP tools + Claude)
  Graders:  contains, not-contains, regex, tool-called, tool-not-called,
            max-tool-calls, llm-rubric

METRICS
  pass@k   at least one trial passed   — the agent can do it
  pass^k   every trial passed          — the agent reliably does it
  flaky    some trials passed, some did not
`;

function load(path: string, trials?: number): EvalFile {
  const parsed = EvalFileSchema.safeParse(JSON.parse(readFileSync(path, "utf-8")));
  if (!parsed.success) {
    console.error(`Invalid eval file ${path}:\n${parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`);
    process.exit(2);
  }
  return trials ? { ...parsed.data, trials } : parsed.data;
}

async function listTools(evalFile: EvalFile): Promise<void> {
  if (evalFile.target.type !== "mcp" && evalFile.target.type !== "webmcp") {
    console.error(`${evalFile.name}: --list-tools needs an mcp or webmcp target, got ${evalFile.target.type}`);
    process.exit(2);
  }
  const tools = await listTargetTools(evalFile.target);
  console.log(`\n  ${evalFile.name}: ${tools.length} tool(s)\n`);
  for (const t of tools) {
    console.log(`  ${t.name}(${t.params.join(", ")})`);
    if (t.description) console.log(`      ${t.description.split("\n")[0].slice(0, 110)}`);
  }
  console.log("");
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      trials: { type: "string", short: "n" },
      "min-pass-rate": { type: "string", default: "1" },
      "list-tools": { type: "boolean", default: false },
      format: { type: "string", short: "f", default: "table" },
      output: { type: "string", short: "o" },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: true,
    strict: true,
  });

  if (values.help || positionals.length === 0) {
    console.log(HELP);
    process.exit(values.help ? 0 : 1);
  }

  const trials = values.trials ? parseInt(values.trials, 10) : undefined;
  const minPassRate = parseFloat(values["min-pass-rate"] ?? "1");
  const evalFiles = positionals.map((p) => load(p, trials));

  if (values["list-tools"]) {
    for (const e of evalFiles) await listTools(e);
    return;
  }

  const reports: EvalReport[] = [];
  for (const evalFile of evalFiles) {
    console.log(`\n  Running ${evalFile.name}: ${evalFile.tasks.length} task(s) x ${evalFile.trials} trial(s)`);
    reports.push(
      await runEval(evalFile, minPassRate, (taskId, trial, pass) =>
        console.log(`    ${pass ? "✓" : "✗"} ${taskId} #${trial}`)
      )
    );
  }

  const format = values.format === "markdown" ? formatMarkdown : values.format === "json" ? formatJson : formatTable;
  const output = values.format === "json" && reports.length === 1 ? formatJson(reports[0]) : reports.map(format).join("\n");

  if (values.output) {
    writeFileSync(values.output, output, "utf-8");
    console.log(`\n  Report written to ${values.output}`);
  } else {
    console.log(output);
  }

  process.exit(reports.some(failedGate) ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
