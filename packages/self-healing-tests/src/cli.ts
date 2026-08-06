#!/usr/bin/env node

import { parseArgs } from "node:util";
import { writeFileSync } from "node:fs";
import { parsePlaywrightErrors, runAndCapture } from "./error-parser.js";
import { healFailures } from "./healer.js";
import { applyPatches } from "./patcher.js";
import { formatTable, formatJson, formatMarkdown } from "./formatter.js";
import type { CliOptions, HealReport } from "./types.js";

const HELP = `
self-heal - Auto-fix broken Playwright selectors

USAGE
  self-heal [options] -- <playwright test command>
  self-heal -- npx playwright test
  self-heal --dry-run -- npx playwright test --project=chromium

OPTIONS
  --dry-run           Show fixes without applying them (default: false)
  --verify            Re-run tests after patching to confirm fixes (default: false)
  --max-retries <n>   Max heal+verify cycles (default: 1)
  --base-url <url>    Base URL if not detected from errors
  -f, --format        Output: table, json, markdown (default: table)
  -o, --output        Write report to file
  -h, --help          Show this help
  -v, --version       Show version

HOW IT WORKS
  1. Runs your Playwright tests
  2. Parses selector failures from the JSON report
  3. Opens the page in a headless browser
  4. Searches the DOM for matching elements using multiple strategies:
     - data-testid, aria-label, placeholder, role, text content
     - Fuzzy class matching (handles CSS module hash changes)
     - Structural similarity
  5. Patches your test/page-object files with the best match
  6. Optionally re-runs to verify the fix

EXAMPLES
  self-heal -- npx playwright test
  self-heal --dry-run -- npx playwright test --project=chromium
  self-heal --verify -f markdown -o report.md -- npm run test:e2e
`;

function parseCliArgs(): CliOptions {
  const { values, positionals } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      verify: { type: "boolean", default: false },
      "max-retries": { type: "string", default: "1" },
      "base-url": { type: "string" },
      format: { type: "string", short: "f", default: "table" },
      output: { type: "string", short: "o" },
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

  return {
    command,
    dryRun: values["dry-run"] ?? false,
    maxRetries: parseInt(values["max-retries"] ?? "1", 10),
    verify: values.verify ?? false,
    format: (values.format ?? "table") as CliOptions["format"],
    output: values.output,
    baseUrl: values["base-url"],
  };
}

async function main(): Promise<void> {
  const opts = parseCliArgs();

  console.log("");
  console.log("  Self-Healing Tests");
  console.log(`  Command:     ${opts.command}`);
  console.log(`  Dry run:     ${opts.dryRun}`);
  console.log(`  Verify:      ${opts.verify}`);
  console.log(`  Max retries: ${opts.maxRetries}`);
  console.log("");

  let attempt = 0;
  let allResults: HealReport["results"] = [];

  while (attempt < opts.maxRetries) {
    attempt++;
    console.log(`  --- Attempt ${attempt}/${opts.maxRetries} ---`);
    console.log("");

    console.log("  [1/4] Running tests...");
    const { exitCode, jsonReport, stderr } = runAndCapture(opts.command);

    if (exitCode === 0) {
      console.log("  All tests passed. Nothing to heal.");
      break;
    }

    console.log(`  Tests failed (exit code ${exitCode}).`);
    console.log("");

    console.log("  [2/4] Parsing selector failures...");
    const source = jsonReport ?? stderr;
    const failures = parsePlaywrightErrors(source);

    if (failures.length === 0) {
      console.log("  No selector failures found. Errors may be non-selector related.");
      break;
    }

    console.log(`  Found ${failures.length} broken selector(s).`);
    console.log("");

    console.log("  [3/4] Healing selectors (inspecting live DOM)...");
    const results = await healFailures(failures, opts.baseUrl);
    allResults = [...allResults, ...results];

    const healable = results.filter((r) => r.chosen);
    console.log(`  Found fixes for ${healable.length}/${failures.length} failure(s).`);
    console.log("");

    if (healable.length === 0) break;

    console.log(`  [4/4] ${opts.dryRun ? "Dry run — showing" : "Applying"} patches...`);
    const patches = applyPatches(results, opts.dryRun);
    const applied = patches.filter((p) => p.applied);
    console.log(`  ${opts.dryRun ? "Would patch" : "Patched"} ${applied.length} selector(s).`);
    console.log("");

    if (opts.verify && !opts.dryRun && applied.length > 0) {
      console.log("  Verifying fixes...");
      const { exitCode: verifyCode } = runAndCapture(opts.command);
      if (verifyCode === 0) {
        console.log("  Verification passed! All fixes confirmed.");
        for (const r of results) {
          if (r.patched) r.verified = true;
        }
        break;
      } else {
        console.log("  Some tests still failing. Retrying...");
        console.log("");
      }
    } else {
      break;
    }
  }

  const report: HealReport = {
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    command: opts.command,
    totalFailures: allResults.length,
    healed: allResults.filter((r) => r.patched).length,
    unhealed: allResults.filter((r) => !r.chosen).length,
    verified: allResults.filter((r) => r.verified).length,
    results: allResults,
  };

  const patches = allResults
    .filter((r) => r.chosen)
    .map((r) => ({
      file: r.failure.testFile,
      line: r.failure.line,
      oldSelector: r.failure.selector,
      newSelector: r.chosen!.selector,
      applied: r.patched,
    }));

  let output: string;
  switch (opts.format) {
    case "json":
      output = formatJson(report, patches);
      break;
    case "markdown":
      output = formatMarkdown(report, patches);
      break;
    default:
      output = formatTable(report, patches);
  }

  if (opts.output) {
    writeFileSync(opts.output, output, "utf-8");
    console.log(`  Report written to ${opts.output}`);
  } else {
    console.log(output);
  }

  process.exit(report.healed > 0 && report.unhealed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
