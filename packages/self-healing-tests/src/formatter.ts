import type { HealReport } from "./types.js";
import type { PatchSummary } from "./patcher.js";

export function formatTable(report: HealReport, patches: PatchSummary[]): string {
  const lines: string[] = [];

  lines.push("");
  lines.push("  SELF-HEALING REPORT");
  lines.push("  " + "=".repeat(78));
  lines.push("");

  if (report.results.length === 0) {
    lines.push("  No selector failures detected. All tests passed.");
    return lines.join("\n");
  }

  for (const r of report.results) {
    const status = r.chosen ? (r.patched ? "HEALED" : "CANDIDATE") : "NO FIX";
    lines.push(`  ${status}  ${r.failure.testName}`);
    lines.push(`    File:     ${r.failure.testFile}:${r.failure.line}`);
    lines.push(`    Broken:   ${r.failure.selector}`);

    if (r.chosen) {
      lines.push(`    Fix:      ${r.chosen.selector}`);
      lines.push(`    Strategy: ${r.chosen.strategy} (${Math.round(r.chosen.confidence * 100)}% confidence)`);
      lines.push(`    Element:  <${r.chosen.element.tag}> "${r.chosen.element.text.slice(0, 60)}"`);
    } else {
      lines.push("    Fix:      (no candidates found)");
    }

    if (r.candidates.length > 1) {
      lines.push(`    Other candidates: ${r.candidates.length - 1}`);
      for (const c of r.candidates.slice(1, 4)) {
        lines.push(`      - ${c.selector} [${c.strategy}, ${Math.round(c.confidence * 100)}%]`);
      }
    }

    lines.push("");
  }

  lines.push("  " + "-".repeat(78));
  lines.push(
    `  Failures: ${report.totalFailures}  |  ` +
    `Healed: ${report.healed}  |  ` +
    `Unhealed: ${report.unhealed}  |  ` +
    `Verified: ${report.verified}`
  );

  if (patches.length > 0) {
    lines.push("");
    lines.push("  PATCHES:");
    for (const p of patches) {
      const icon = p.applied ? "+" : "~";
      lines.push(`    ${icon} ${p.file}:${p.line}`);
      lines.push(`      - ${p.oldSelector}`);
      lines.push(`      + ${p.newSelector}`);
    }
  }

  return lines.join("\n");
}

export function formatJson(report: HealReport, patches: PatchSummary[]): string {
  return JSON.stringify({ ...report, patches }, null, 2);
}

export function formatMarkdown(report: HealReport, patches: PatchSummary[]): string {
  const lines: string[] = [];

  lines.push("# Self-Healing Test Report");
  lines.push("");
  lines.push(`- **Command:** \`${report.command}\``);
  lines.push(`- **Failures found:** ${report.totalFailures}`);
  lines.push(`- **Healed:** ${report.healed}`);
  lines.push(`- **Unhealed:** ${report.unhealed}`);
  lines.push(`- **Date:** ${report.finishedAt}`);
  lines.push("");

  if (report.results.length > 0) {
    lines.push("## Results");
    lines.push("");
    lines.push("| Test | Broken Selector | Fix | Strategy | Confidence |");
    lines.push("|------|----------------|-----|----------|------------|");

    for (const r of report.results) {
      const fix = r.chosen?.selector ?? "_(no fix)_";
      const strategy = r.chosen?.strategy ?? "-";
      const conf = r.chosen ? `${Math.round(r.chosen.confidence * 100)}%` : "-";
      lines.push(`| ${r.failure.testName} | \`${r.failure.selector}\` | \`${fix}\` | ${strategy} | ${conf} |`);
    }
  }

  if (patches.length > 0) {
    lines.push("");
    lines.push("## Patches");
    lines.push("");
    for (const p of patches) {
      lines.push(`### ${p.file}:${p.line}`);
      lines.push("```diff");
      lines.push(`- ${p.oldSelector}`);
      lines.push(`+ ${p.newSelector}`);
      lines.push("```");
      lines.push(p.applied ? "_Applied_" : "_Dry run — not applied_");
      lines.push("");
    }
  }

  return lines.join("\n");
}
