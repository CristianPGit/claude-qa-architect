export interface TestResult {
  name: string;
  suite: string;
  passed: boolean;
  duration: number;
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
}
