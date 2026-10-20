#!/usr/bin/env node

import { parseArgs } from "node:util";
import { spawnSync } from "node:child_process";
import { dirname, relative, resolve } from "node:path";
import { ALL, loadConfig, type Risk } from "./config.js";
import { changedFiles, repoRoot } from "./git.js";
import { grepPattern, select, type Selection } from "./select.js";

const HELP = `
test-impact - Pick the tests a change can break, from its git diff

USAGE
  test-impact [options]                     explain the selection
  test-impact [options] --run -- <command>  run <command> with --grep for the selection

OPTIONS
  -c, --config <file>   Rules file (default: ./test-impact.json)
  -b, --base <ref>      Compare against the merge base with <ref> (default: origin/main)
  --committed-only      Ignore uncommitted and untracked files (CI)
  -f, --format          table, markdown, json, grep (default: table)
  --run                 Run the command after --, filtered to the selection
  -h, --help            Show this help

SELECTION
  1. Each changed file is matched against the rules' globs -> tags (risk high/medium/low).
     A rule tag of "*" forces a full run (config, dependencies, shared fixtures).
  2. A changed .feature file selects its own scenarios by Feature name.
  3. "always" tags (default @smoke) are added to every selection.
  4. A file inside the suite that no rule covers forces a full run: an unmapped change
     is exactly where a narrow selection would miss a bug.

EXAMPLES
  test-impact -c e2e/my-suite/test-impact.json
  test-impact -f grep                      # just the pattern, for scripts
  test-impact --committed-only --run -- npx playwright test --project=chromium
`;

const RISK_EMOJI: Record<Risk, string> = { high: "🔴", medium: "🟡", low: "🟢" };

function formatTable(sel: Selection, changedCount: number, base: string): string {
  const lines = ["", `  TEST IMPACT  (${changedCount} changed file(s) vs ${base})`, "  " + "=".repeat(78)];
  if (sel.fullRun) {
    lines.push(`  ▶ FULL RUN  — ${sel.unmapped.length > 0 ? "unmapped changes" : `a rule selected "${ALL}"`}`);
  } else if (sel.selected.size === 0) {
    lines.push(`  ▶ ALWAYS ONLY  — nothing in the suite changed; running ${sel.always.join(", ") || "nothing"}`);
  } else {
    lines.push(`  ▶ SELECTED  — risk: ${sel.risk ?? "-"}`);
  }
  lines.push("");
  for (const [key, reasons] of sel.selected) {
    const risk = reasons.reduce<Risk>((r, x) => (x.risk === "high" || r === "high" ? "high" : x.risk === "medium" ? "medium" : r), "low");
    lines.push(`  ${RISK_EMOJI[risk]} ${key}`);
    for (const r of reasons) lines.push(`       ← ${r.file}  (${r.rule})`);
  }
  for (const tag of sel.always) if (!sel.selected.has(tag)) lines.push(`  ⚪ ${tag}  (always)`);
  if (sel.unmapped.length > 0) {
    lines.push("", "  Unmapped (forces a full run — add a rule or an ignore glob):");
    for (const f of sel.unmapped) lines.push(`       ? ${f}`);
  }
  if (sel.ignored.length > 0) lines.push("", `  Ignored: ${sel.ignored.join(", ")}`);
  if (sel.outside.length > 0) lines.push(`  Outside the suite: ${sel.outside.length} file(s)`);
  const pattern = grepPattern(sel);
  lines.push("", `  --grep ${pattern === null ? "(none — full run)" : JSON.stringify(pattern)}`, "");
  return lines.join("\n");
}

function formatMarkdown(sel: Selection, changedCount: number, base: string): string {
  const pattern = grepPattern(sel);
  const verdict = sel.fullRun
    ? "**Full run**" + (sel.unmapped.length > 0 ? ` — ${sel.unmapped.length} unmapped change(s)` : "")
    : `**Selective run** · risk ${sel.risk ? RISK_EMOJI[sel.risk] + " " + sel.risk : "none"}`;
  const rows = [...sel.selected].map(([key, reasons]) => {
    const files = [...new Set(reasons.map((r) => `\`${r.file}\``))].join(", ");
    const rules = [...new Set(reasons.map((r) => r.rule))].join(", ");
    return `| ${RISK_EMOJI[reasons[0].risk]} | \`${key}\` | ${rules} | ${files} |`;
  });
  return [
    `## 🎯 Test impact`,
    "",
    `${changedCount} changed file(s) vs \`${base}\` → ${verdict}`,
    "",
    "| Risk | Runs | Rule | Because of |",
    "|---|---|---|---|",
    ...rows,
    ...sel.always.filter((t) => !sel.selected.has(t)).map((t) => `| ⚪ | \`${t}\` | always | — |`),
    ...sel.unmapped.map((f) => `| 🔴 | everything | unmapped | \`${f}\` |`),
    "",
    pattern === null ? "_Full suite._" : `\`--grep ${JSON.stringify(pattern)}\``,
    "",
  ].join("\n");
}

function main(): void {
  const { values, positionals } = parseArgs({
    options: {
      config: { type: "string", short: "c", default: "test-impact.json" },
      base: { type: "string", short: "b", default: "origin/main" },
      "committed-only": { type: "boolean", default: false },
      format: { type: "string", short: "f", default: "table" },
      run: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: true,
    strict: true,
  });

  if (values.help) {
    console.log(HELP);
    return;
  }

  const configPath = resolve(values.config!);
  const config = loadConfig(configPath);
  const root = repoRoot(dirname(configPath));
  const suiteDir = relative(root, dirname(configPath));
  const base = values.base!;
  const changed = changedFiles(base, root, !values["committed-only"]);
  const sel = select(config, changed, suiteDir, root);
  const pattern = grepPattern(sel);

  if (values.run) {
    const command = positionals.join(" ");
    if (!command) throw new Error("--run needs a command after --");
    console.log(formatTable(sel, changed.length, base));
    const full = pattern === null ? command : `${command} --grep '${pattern.replace(/'/g, `'\\''`)}'`;
    console.log(`  $ ${full}\n`);
    const res = spawnSync(full, { shell: true, stdio: "inherit", cwd: dirname(configPath) });
    process.exit(res.status ?? 1);
  }

  switch (values.format) {
    case "grep":
      console.log(pattern ?? "");
      break;
    case "json":
      console.log(
        JSON.stringify(
          { base, changed, ...sel, selected: Object.fromEntries(sel.selected), grep: pattern },
          null,
          2
        )
      );
      break;
    case "markdown":
      console.log(formatMarkdown(sel, changed.length, base));
      break;
    default:
      console.log(formatTable(sel, changed.length, base));
  }
}

try {
  main();
} catch (err) {
  console.error(`test-impact: ${(err as Error).message}`);
  process.exit(2);
}
