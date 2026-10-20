import type { EvalReport, TaskStats } from "./types.js";

const pct = (n: number) => `${Math.round(n * 100)}%`;

function status(t: TaskStats, minPassRate: number): string {
  if (t.passes === 0) return "FAIL";
  if (t.passRate < minPassRate) return t.flaky ? "FLAKY" : "FAIL";
  return t.flaky ? "PASS~" : "PASS";
}

function firstFailure(t: TaskStats): string {
  for (const r of t.results) {
    const g = r.grades.find((x) => !x.pass);
    if (g) return `${g.grader}: ${g.detail}`;
  }
  return "";
}

export function formatTable(report: EvalReport): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(`  AGENT EVAL: ${report.name}  (target: ${report.target}, ${report.trials} trial(s) per task)`);
  lines.push("  " + "=".repeat(78));
  lines.push(`  ${"STATUS".padEnd(7)} ${"TASK".padEnd(32)} ${"PASS".padEnd(7)} ${"pass@k".padEnd(7)} ${"pass^k".padEnd(7)} AVG ms`);
  for (const t of report.tasks) {
    lines.push(
      `  ${status(t, report.minPassRate).padEnd(7)} ${t.id.slice(0, 32).padEnd(32)} ${`${t.passes}/${t.trials}`.padEnd(7)} ${(t.passAtK ? "yes" : "no").padEnd(7)} ${(t.passAllK ? "yes" : "no").padEnd(7)} ${t.avgLatencyMs}`
    );
    if (!t.passAllK) lines.push(`          └ ${firstFailure(t).slice(0, 100)}`);
  }
  lines.push("  " + "-".repeat(78));
  const s = report.summary;
  lines.push(
    `  Tasks: ${s.tasks}  |  Reliable: ${s.reliable}  |  Flaky: ${s.flaky}  |  Failing: ${s.failing}  |  Trial pass rate: ${pct(s.passRate)}`
  );
  lines.push("");
  return lines.join("\n");
}

export function formatMarkdown(report: EvalReport): string {
  const emoji = (t: TaskStats) => (t.passAllK ? "🟢" : t.passAtK ? "🟡" : "🔴");
  const lines = [
    `## 🧪 Agent eval: ${report.name}`,
    "",
    `Target \`${report.target}\` · ${report.trials} trial(s) per task · trial pass rate **${pct(report.summary.passRate)}** · ` +
      `${report.summary.reliable} reliable, ${report.summary.flaky} flaky, ${report.summary.failing} failing`,
    "",
    "| | Task | Pass | pass@k | pass^k | Avg ms | First failure |",
    "|---|---|---|---|---|---|---|",
    ...report.tasks.map(
      (t) =>
        `| ${emoji(t)} | ${t.id} | ${t.passes}/${t.trials} | ${t.passAtK ? "✅" : "❌"} | ${t.passAllK ? "✅" : "❌"} | ${t.avgLatencyMs} | ${firstFailure(t).replace(/\|/g, "\\|").slice(0, 120)} |`
    ),
    "",
  ];
  return lines.join("\n");
}

export function formatJson(report: EvalReport): string {
  return JSON.stringify(report, null, 2);
}

export function failedGate(report: EvalReport): boolean {
  return report.tasks.some((t) => t.passRate < report.minPassRate);
}
