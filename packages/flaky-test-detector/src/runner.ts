import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { RunResult, TestResult } from "./types.js";
import { parsePlaywright } from "./parsers/playwright.js";
import { parseCypress } from "./parsers/cypress.js";
import { parseJest } from "./parsers/jest.js";

const RESULTS_DIR = ".flaky-results";

type ParserType = "auto" | "playwright" | "cypress" | "jest" | "exit-code";

export function runSuite(
  command: string,
  totalRuns: number,
  parser: ParserType,
  onProgress: (run: number, total: number, exitCode: number) => void
): RunResult[] {
  mkdirSync(RESULTS_DIR, { recursive: true });

  const results: RunResult[] = [];

  for (let i = 0; i < totalRuns; i++) {
    const start = Date.now();
    let stdout = "";
    let exitCode = 0;

    const jsonOutPath = join(RESULTS_DIR, `run-${i}.json`);
    const cmdWithReporter = injectReporter(command, parser, jsonOutPath);

    try {
      stdout = execSync(cmdWithReporter, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        maxBuffer: 50 * 1024 * 1024,
      });
    } catch (err: unknown) {
      const execErr = err as { status?: number; stdout?: string; stderr?: string };
      exitCode = execErr.status ?? 1;
      stdout = execErr.stdout ?? "";
    }

    const duration = Date.now() - start;

    let tests: TestResult[] = [];
    const detectedParser = parser === "auto" ? detectParser(command) : parser;

    if (detectedParser !== "exit-code" && existsSync(jsonOutPath)) {
      const raw = readFileSync(jsonOutPath, "utf-8");
      tests = parseJsonResults(raw, detectedParser);
    }

    results.push({ runIndex: i, exitCode, tests, duration, raw: stdout });
    onProgress(i + 1, totalRuns, exitCode);
  }

  return results;
}

function detectParser(command: string): ParserType {
  if (command.includes("playwright")) return "playwright";
  if (command.includes("cypress")) return "cypress";
  if (command.includes("jest") || command.includes("vitest")) return "jest";
  return "exit-code";
}

function injectReporter(
  command: string,
  parser: ParserType,
  outPath: string
): string {
  const resolved = parser === "auto" ? detectParser(command) : parser;

  switch (resolved) {
    case "playwright":
      return `PLAYWRIGHT_JSON_OUTPUT_NAME=${outPath} ${command} --reporter=json`;
    case "cypress":
      return `${command} --reporter json > ${outPath} 2>&1 || true`;
    case "jest":
      return `${command} --json --outputFile=${outPath}`;
    case "exit-code":
    default:
      return command;
  }
}

function parseJsonResults(raw: string, parser: ParserType): TestResult[] {
  try {
    const data = JSON.parse(raw);
    switch (parser) {
      case "playwright":
        return parsePlaywright(data);
      case "cypress":
        return parseCypress(data);
      case "jest":
        return parseJest(data);
      default:
        return [];
    }
  } catch {
    return [];
  }
}
