#!/usr/bin/env node

import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";
import { runSuite } from "./runner.js";
import { analyze } from "./analyzer.js";
import { formatTable } from "./formatters/table.js";
import { formatMarkdown } from "./formatters/markdown.js";
import type { CliOptions, OutputFormat } from "./types.js";

const HELP = `
flaky - Run your test suite N times and find flaky tests

USAGE
  flaky [options] -- <test command>
  flaky -n 10 -- npx playwright test
  flaky -n 5 --parser cypress -- npx cypress run

OPTIONS
  -n, --runs <number>       Number of times to run (default: 5)
  -t, --threshold <number>  Min pass rate % to flag as flaky (default: 0)
  -f, --format <format>     Output format: table, json, markdown (default: table)
  -o, --output <file>       Write report to file instead of stdout
  -p, --parser <parser>     Result parser: auto, playwright, cypress, jest, exit-code (default: auto)
  -h, --help                Show this help
  -v, --version             Show version

EXAMPLES
  flaky -n 10 -- npx playwright test
  flaky -n 5 -f markdown -o report.md -- npm test
  flaky -n 20 --parser jest -- npx jest --testPathPattern=api
`;

function parseCliArgs(): CliOptions {
  const { values, positionals } = parseArgs({
    options: {
      runs: { type: "string", short: "n", default: "5" },
      threshold: { type: "string", short: "t", default: "0" },
      format: { type: "string", short: "f", default: "table" },
      output: { type: "string", short: "o" },
      parser: { type: "string", short: "p", default: "auto" },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
    },
    allowPositionals: true,
    strict: true,
  });

  if (values.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (values.version) {
    console.log("1.0.0");
    process.exit(0);
  }

  const command = positionals.join(" ");
  if (!command) {
    console.error("Error: no test command provided.\n");
    console.log(HELP);
    process.exit(1);
  }

  const validFormats: OutputFormat[] = ["table", "json", "markdown"];
  const format = (values.format ?? "table") as OutputFormat;
  if (!validFormats.includes(format)) {
    console.error(`Error: invalid format "${format}". Use: ${validFormats.join(", ")}`);
    process.exit(1);
  }

  const validParsers = ["auto", "playwright", "cypress", "jest", "exit-code"] as const;
  const parser = (values.parser ?? "auto") as typeof validParsers[number];
  if (!validParsers.includes(parser)) {
    console.error(`Error: invalid parser "${parser}". Use: ${validParsers.join(", ")}`);
    process.exit(1);
  }

  return {
    command,
    runs: parseInt(values.runs ?? "5", 10),
    threshold: parseFloat(values.threshold ?? "0"),
    format,
    output: values.output,
    parser,
  };
}

function main(): void {
  const opts = parseCliArgs();

  console.log(`\n  Flaky Test Detector`);
  console.log(`  Command:   ${opts.command}`);
  console.log(`  Runs:      ${opts.runs}`);
  console.log(`  Parser:    ${opts.parser}`);
  console.log(`  Threshold: ${opts.threshold}%\n`);

  const results = runSuite(opts.command, opts.runs, opts.parser, (run, total, exitCode) => {
    const status = exitCode === 0 ? "PASS" : "FAIL";
    const bar = progressBar(run, total);
    process.stdout.write(`\r  ${bar}  Run ${run}/${total} ${status}`);
  });

  console.log("\n");

  const report = analyze(opts.command, results, opts.threshold);

  let output: string;
  switch (opts.format) {
    case "json":
      output = JSON.stringify(report, null, 2);
      break;
    case "markdown":
      output = formatMarkdown(report);
      break;
    default:
      output = formatTable(report);
  }

  if (opts.output) {
    writeFileSync(opts.output, output, "utf-8");
    console.log(`  Report written to ${opts.output}`);
  } else {
    console.log(output);
  }

  const exitCode = report.flakyTests.length > 0 ? 1 : 0;
  process.exit(exitCode);
}

function progressBar(current: number, total: number): string {
  const width = 20;
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  return `[${"#".repeat(filled)}${"-".repeat(empty)}]`;
}

main();
