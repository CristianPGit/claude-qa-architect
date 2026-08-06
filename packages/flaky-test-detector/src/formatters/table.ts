import type { FlakyReport } from "../types.js";

export function formatTable(report: FlakyReport): string {
  const lines: string[] = [];

  lines.push("  RESULTS");
  lines.push("  " + "=".repeat(80));
  lines.push("");

  if (report.tests.length === 0) {
    lines.push("  No per-test results parsed. Only exit codes were tracked.");
    lines.push("");
    const passedRuns = report.totalRuns - report.flakyTests.length;
    lines.push(`  Runs: ${report.totalRuns}  |  Duration: ${formatMs(report.totalDuration)}`);
    return lines.join("\n");
  }

  const nameWidth = Math.min(
    50,
    Math.max(10, ...report.tests.map((t) => t.name.length))
  );

  const header = [
    pad("Test", nameWidth),
    pad("Pass", 6),
    pad("Fail", 6),
    pad("Rate", 8),
    pad("Avg ms", 8),
    "Status",
  ].join("  ");

  lines.push("  " + header);
  lines.push("  " + "-".repeat(header.length));

  for (const test of report.tests) {
    const status = test.passRate === 100
      ? "OK"
      : test.passRate === 0
        ? "BROKEN"
        : "FLAKY";

    const row = [
      pad(truncate(test.name, nameWidth), nameWidth),
      pad(String(test.passed), 6),
      pad(String(test.failed), 6),
      pad(`${test.passRate}%`, 8),
      pad(String(test.avgDuration), 8),
      status,
    ].join("  ");

    lines.push("  " + row);
  }

  lines.push("");
  lines.push("  " + "-".repeat(header.length));
  lines.push(
    `  Total: ${report.summary.totalTests} tests  |  ` +
    `Flaky: ${report.summary.flakyCount}  |  ` +
    `Always pass: ${report.summary.alwaysPass}  |  ` +
    `Always fail: ${report.summary.alwaysFail}`
  );
  lines.push(`  Runs: ${report.totalRuns}  |  Duration: ${formatMs(report.totalDuration)}`);

  if (report.flakyTests.length > 0) {
    lines.push("");
    lines.push("  FLAKY TESTS:");
    for (const t of report.flakyTests) {
      lines.push(`    - ${t.suite} > ${t.name} (${t.passRate}% pass rate)`);
    }
  }

  return lines.join("\n");
}

function pad(str: string, width: number): string {
  return str.padEnd(width);
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}
