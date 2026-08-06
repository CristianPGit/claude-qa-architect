#!/usr/bin/env node

import { parseArgs } from "node:util";
import { existsSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { platform } from "node:os";
import {
  approveAll,
  listBaselines,
  listResults,
  clearResults,
  DEFAULT_BASELINE_DIR,
  DEFAULT_OUTPUT_DIR,
} from "./storage.js";
import { generateHtmlReport } from "./report.js";

const HELP = `
vreg - Visual regression testing utilities for Playwright

USAGE
  vreg <command> [options]

COMMANDS
  init                 Create starter visual-check setup files
  approve              Promote all current snapshots to baselines
  report               Generate HTML report from latest results
  list                 List existing baselines
  status               Show pass/fail counts from last run
  clear                Delete current + diff (keeps baselines)
  help                 Show this help

GLOBAL OPTIONS
  --baseline-dir <dir>   Override baseline dir (default: ${DEFAULT_BASELINE_DIR})
  --output-dir <dir>     Override output dir (default: ${DEFAULT_OUTPUT_DIR})
  --no-open              Don't auto-open the HTML report

EXAMPLES
  vreg init
  vreg report
  vreg approve
  vreg status
`;

const STARTER_EXAMPLE = `import { test } from "@playwright/test";
import { visualCheck } from "visual-regression-cli";

test("homepage looks correct", async ({ page }) => {
  await page.goto("https://example.com");
  await visualCheck(page, "homepage", {
    variant: "chromium-desktop",
    maxDiffPercent: 0.1,
    mask: [".timestamp", "[data-testid='ad-slot']"],
  });
});
`;

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      "baseline-dir": { type: "string", default: DEFAULT_BASELINE_DIR },
      "output-dir": { type: "string", default: DEFAULT_OUTPUT_DIR },
      "no-open": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: true,
    strict: true,
  });

  if (values.help || positionals.length === 0) {
    console.log(HELP);
    process.exit(0);
  }

  const command = positionals[0];
  const baselineDir = values["baseline-dir"] ?? DEFAULT_BASELINE_DIR;
  const outputDir = values["output-dir"] ?? DEFAULT_OUTPUT_DIR;

  switch (command) {
    case "init":
      cmdInit();
      break;
    case "approve":
      cmdApprove(outputDir, baselineDir);
      break;
    case "report":
      cmdReport(outputDir, !values["no-open"]);
      break;
    case "list":
      cmdList(baselineDir);
      break;
    case "status":
      cmdStatus(outputDir);
      break;
    case "clear":
      cmdClear(outputDir);
      break;
    case "help":
      console.log(HELP);
      break;
    default:
      console.error(`Unknown command: ${command}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

function cmdInit(): void {
  const examplePath = "tests/visual.example.spec.ts";
  if (existsSync(examplePath)) {
    console.log(`  ${examplePath} already exists. Skipping.`);
  } else {
    writeFileSync(examplePath, STARTER_EXAMPLE, "utf-8");
    console.log(`  Created ${examplePath}`);
  }

  console.log("");
  console.log("  Next steps:");
  console.log("    1. Run your tests:  npx playwright test");
  console.log("    2. Generate report: npx vreg report");
  console.log("    3. Approve changes: npx vreg approve");
}

function cmdApprove(outputDir: string, baselineDir: string): void {
  const result = approveAll(outputDir, baselineDir);
  if (result.total === 0) {
    console.log("  No current snapshots to approve.");
    return;
  }

  console.log(`  Approved ${result.total} snapshot(s):`);
  for (const file of result.approved) {
    console.log(`    + ${file}`);
  }
}

function cmdReport(outputDir: string, openReport: boolean): void {
  const path = generateHtmlReport(outputDir);
  console.log(`  Report written to ${path}`);

  if (openReport) {
    openFile(path);
  }
}

function cmdList(baselineDir: string): void {
  const baselines = listBaselines(baselineDir);
  if (baselines.length === 0) {
    console.log("  No baselines found.");
    return;
  }

  console.log(`  ${baselines.length} baseline(s) in ${baselineDir}:`);
  for (const file of baselines) {
    console.log(`    - ${file}`);
  }
}

function cmdStatus(outputDir: string): void {
  const results = listResults(outputDir);
  if (results.length === 0) {
    console.log("  No results found. Run your tests first.");
    return;
  }

  const passed = results.filter((r) => r.passed && !r.isNew).length;
  const failed = results.filter((r) => !r.passed).length;
  const newCount = results.filter((r) => r.isNew).length;

  console.log("");
  console.log(`  Total:    ${results.length}`);
  console.log(`  Passed:   ${passed}`);
  console.log(`  Failed:   ${failed}`);
  console.log(`  New:      ${newCount}`);
  console.log("");

  if (failed > 0) {
    console.log("  Failures:");
    for (const r of results.filter((x) => !x.passed)) {
      console.log(`    - ${r.name} (${r.variant}): ${r.diffPercent}% diff`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

function cmdClear(outputDir: string): void {
  clearResults(outputDir);
  console.log(`  Cleared current + diff snapshots in ${outputDir}.`);
  console.log(`  Baselines preserved.`);
}

function openFile(path: string): void {
  const cmd =
    platform() === "darwin" ? "open" :
    platform() === "win32" ? "start" : "xdg-open";
  try {
    execSync(`${cmd} "${path}"`, { stdio: "ignore" });
  } catch {
    /* fail silently */
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
