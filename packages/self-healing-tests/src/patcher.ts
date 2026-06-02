import { readFileSync, writeFileSync } from "node:fs";
import type { HealResult } from "./types.js";

export interface PatchSummary {
  file: string;
  line: number;
  oldSelector: string;
  newSelector: string;
  applied: boolean;
}

export function applyPatches(
  results: HealResult[],
  dryRun: boolean
): PatchSummary[] {
  const patches: PatchSummary[] = [];

  const byFile = new Map<string, HealResult[]>();
  for (const r of results) {
    if (!r.chosen) continue;
    const group = byFile.get(r.failure.testFile) ?? [];
    group.push(r);
    byFile.set(r.failure.testFile, group);
  }

  for (const [file, fileResults] of byFile) {
    let content: string;
    try {
      content = readFileSync(file, "utf-8");
    } catch {
      for (const r of fileResults) {
        patches.push({
          file,
          line: r.failure.line,
          oldSelector: r.failure.selector,
          newSelector: r.chosen!.selector,
          applied: false,
        });
      }
      continue;
    }

    let modified = content;

    for (const r of fileResults) {
      const old = r.failure.selector;
      const replacement = r.chosen!.selector;

      const escaped = escapeForRegex(old);
      const regex = new RegExp(escaped, "g");

      if (regex.test(modified)) {
        if (!dryRun) {
          modified = modified.replace(regex, replacement);
          r.patched = true;
        }

        patches.push({
          file,
          line: r.failure.line,
          oldSelector: old,
          newSelector: replacement,
          applied: !dryRun,
        });
      } else {
        patches.push({
          file,
          line: r.failure.line,
          oldSelector: old,
          newSelector: replacement,
          applied: false,
        });
      }
    }

    if (!dryRun && modified !== content) {
      writeFileSync(file, modified, "utf-8");
    }
  }

  return patches;
}

function escapeForRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
