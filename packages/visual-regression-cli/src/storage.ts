import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, copyFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import type { DiffResult } from "./types.js";

const DEFAULT_BASELINE_DIR = ".visual-regression/baselines";
const DEFAULT_OUTPUT_DIR = ".visual-regression";

export interface StoragePaths {
  baseline: string;
  current: string;
  diff: string;
}

export function getPaths(
  name: string,
  variant: string,
  baselineDir: string = DEFAULT_BASELINE_DIR,
  outputDir: string = DEFAULT_OUTPUT_DIR
): StoragePaths {
  const safeName = sanitize(name);
  const safeVariant = sanitize(variant);
  const filename = `${safeName}.png`;

  return {
    baseline: join(baselineDir, safeVariant, filename),
    current: join(outputDir, "current", safeVariant, filename),
    diff: join(outputDir, "diff", safeVariant, filename),
  };
}

export function sanitize(str: string): string {
  return str.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}

export function ensureDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

export function saveBuffer(filePath: string, buffer: Buffer): void {
  ensureDir(filePath);
  writeFileSync(filePath, buffer);
}

export function hasBaseline(paths: StoragePaths): boolean {
  return existsSync(paths.baseline);
}

export function approveBaseline(paths: StoragePaths): void {
  if (!existsSync(paths.current)) {
    throw new Error(`No current snapshot to approve at ${paths.current}`);
  }
  ensureDir(paths.baseline);
  copyFileSync(paths.current, paths.baseline);
}

export function approveAll(
  outputDir: string = DEFAULT_OUTPUT_DIR,
  baselineDir: string = DEFAULT_BASELINE_DIR
): { approved: string[]; total: number } {
  const currentDir = join(outputDir, "current");
  if (!existsSync(currentDir)) {
    return { approved: [], total: 0 };
  }

  const approved: string[] = [];
  const files = walkDir(currentDir);

  for (const file of files) {
    if (!file.endsWith(".png")) continue;
    const relative = file.slice(currentDir.length + 1);
    const baselinePath = join(baselineDir, relative);
    ensureDir(baselinePath);
    copyFileSync(file, baselinePath);
    approved.push(relative);
  }

  return { approved, total: approved.length };
}

export function listBaselines(baselineDir: string = DEFAULT_BASELINE_DIR): string[] {
  if (!existsSync(baselineDir)) return [];
  return walkDir(baselineDir)
    .filter((f) => f.endsWith(".png"))
    .map((f) => f.slice(baselineDir.length + 1));
}

export function listResults(outputDir: string = DEFAULT_OUTPUT_DIR): DiffResult[] {
  const resultsPath = join(outputDir, "results.json");
  if (!existsSync(resultsPath)) return [];
  try {
    return JSON.parse(readFileSync(resultsPath, "utf-8"));
  } catch {
    return [];
  }
}

export function appendResult(
  result: DiffResult,
  outputDir: string = DEFAULT_OUTPUT_DIR
): void {
  const resultsPath = join(outputDir, "results.json");
  ensureDir(resultsPath);

  const existing = listResults(outputDir);
  const filtered = existing.filter(
    (r) => !(r.name === result.name && r.variant === result.variant)
  );
  filtered.push(result);
  writeFileSync(resultsPath, JSON.stringify(filtered, null, 2));
}

export function clearResults(outputDir: string = DEFAULT_OUTPUT_DIR): void {
  const resultsPath = join(outputDir, "results.json");
  const currentDir = join(outputDir, "current");
  const diffDir = join(outputDir, "diff");

  if (existsSync(resultsPath)) rmSync(resultsPath);
  if (existsSync(currentDir)) rmSync(currentDir, { recursive: true, force: true });
  if (existsSync(diffDir)) rmSync(diffDir, { recursive: true, force: true });
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

export { DEFAULT_BASELINE_DIR, DEFAULT_OUTPUT_DIR };
