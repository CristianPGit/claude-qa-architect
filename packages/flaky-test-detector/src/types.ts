export interface TestResult {
  name: string;
  suite: string;
  passed: boolean;
  duration: number;
  /** First error message of a failed test, when the reporter provides one. */
  error?: string;
  file?: string;
  line?: number;
}

export interface RunResult {
  runIndex: number;
  exitCode: number;
  tests: TestResult[];
  duration: number;
  raw: string;
}

export interface TestStats {
  name: string;
  suite: string;
  runs: number;
  passed: number;
  failed: number;
  passRate: number;
  flaky: boolean;
  avgDuration: number;
  /** One character per run, in order: ✓ passed, ✗ failed, · not reported in that run. */
  history: string;
  avgPassDuration: number;
  avgFailDuration: number;
  /** Distinct failure messages with how many runs produced each. */
  failures: { error: string; count: number }[];
  file?: string;
  line?: number;
  diagnosis?: Diagnosis;
}

export const FLAKE_CATEGORIES = [
  "timing",
  "test-order",
  "test-data",
  "environment",
  "selector",
  "product-race",
  "unknown",
] as const;

export interface Diagnosis {
  category: (typeof FLAKE_CATEGORIES)[number];
  rootCause: string;
  evidence: string[];
  fix: string;
  confidence: "low" | "medium" | "high";
}

export interface FlakyReport {
  command: string;
  totalRuns: number;
  threshold: number;
  startedAt: string;
  finishedAt: string;
  totalDuration: number;
  tests: TestStats[];
  flakyTests: TestStats[];
  summary: {
    totalTests: number;
    flakyCount: number;
    alwaysPass: number;
    alwaysFail: number;
  };
}

export type OutputFormat = "table" | "json" | "markdown";

export interface CliOptions {
  command: string;
  runs: number;
  threshold: number;
  format: OutputFormat;
  output?: string;
  parser: "auto" | "playwright" | "cypress" | "jest" | "exit-code";
  explain: boolean;
  model: string;
}
