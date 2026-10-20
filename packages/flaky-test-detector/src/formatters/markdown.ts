import type { FlakyReport } from "../types.js";

export function formatMarkdown(report: FlakyReport): string {
  const lines: string[] = [];

  lines.push("# Flaky Test Report");
  lines.push("");
  lines.push(`- **Command:** \`${report.command}\``);
  lines.push(`- **Runs:** ${report.totalRuns}`);
  lines.push(`- **Threshold:** ${report.threshold}%`);
  lines.push(`- **Duration:** ${formatMs(report.totalDuration)}`);
  lines.push(`- **Date:** ${report.finishedAt}`);
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total tests | ${report.summary.totalTests} |`);
  lines.push(`| Flaky | ${report.summary.flakyCount} |`);
  lines.push(`| Always pass | ${report.summary.alwaysPass} |`);
  lines.push(`| Always fail | ${report.summary.alwaysFail} |`);
  lines.push("");

  if (report.flakyTests.length > 0) {
    lines.push("## Flaky Tests");
    lines.push("");
    lines.push("| Test | Suite | Pass Rate | History | Pass / fail ms | Top error |");
    lines.push("|------|-------|-----------|---------|----------------|-----------|");
    for (const t of report.flakyTests) {
      const top = t.failures[0]?.error.split("\n")[0].replace(/\|/g, "\\|").slice(0, 100) ?? "";
      lines.push(
        `| ${t.name} | ${t.suite} | ${t.passRate}% | ${t.history} | ${t.avgPassDuration} / ${t.avgFailDuration} | ${top} |`
      );
    }
    lines.push("");

    const diagnosed = report.flakyTests.filter((t) => t.diagnosis);
    if (diagnosed.length > 0) {
      lines.push("## Diagnosis");
      lines.push("");
      for (const t of diagnosed) {
        const d = t.diagnosis!;
        lines.push(`### ${t.name}`);
        lines.push("");
        lines.push(`**${d.category}** · ${d.confidence} confidence${t.file ? ` · \`${t.file}${t.line ? `:${t.line}` : ""}\`` : ""}`);
        lines.push("");
        lines.push(d.rootCause);
        lines.push("");
        for (const e of d.evidence) lines.push(`- ${e}`);
        lines.push("");
        lines.push(`**Fix:** ${d.fix}`);
        lines.push("");
      }
    }
  }

  if (report.tests.length > 0) {
    lines.push("## All Tests");
    lines.push("");
    lines.push("| Test | Suite | Pass Rate | Status |");
    lines.push("|------|-------|-----------|--------|");
    for (const t of report.tests) {
      const status =
        t.passRate === 100 ? "OK" : t.passRate === 0 ? "BROKEN" : "FLAKY";
      lines.push(`| ${t.name} | ${t.suite} | ${t.passRate}% | ${status} |`);
    }
  }

  return lines.join("\n");
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}
