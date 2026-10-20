import type { RunResult, TestStats, FlakyReport, TestResult } from "./types.js";

interface Entry {
  suite: string;
  name: string;
  file?: string;
  line?: number;
  /** Indexed by run; undefined when the test didn't report in that run. */
  outcomes: (TestResult | undefined)[];
}

export function analyze(
  command: string,
  runs: RunResult[],
  threshold: number
): FlakyReport {
  // Keyed by suite + name, but suite and name are kept as fields — a suite title can itself
  // contain " > ", so the key must never be split back apart.
  const testMap = new Map<string, Entry>();

  runs.forEach((run, runIndex) => {
    for (const test of run.tests) {
      const key = JSON.stringify([test.suite, test.name]);
      const entry: Entry = testMap.get(key) ?? {
        suite: test.suite,
        name: test.name,
        outcomes: new Array(runs.length).fill(undefined),
      };
      entry.outcomes[runIndex] = test;
      entry.file ??= test.file;
      entry.line ??= test.line;
      testMap.set(key, entry);
    }
  });

  const tests: TestStats[] = [];

  for (const entry of testMap.values()) {
    const reported = entry.outcomes.filter((o): o is TestResult => o !== undefined);
    const passes = reported.filter((o) => o.passed);
    const fails = reported.filter((o) => !o.passed);
    const totalRuns = reported.length;
    const passRate = totalRuns > 0 ? (passes.length / totalRuns) * 100 : 0;

    tests.push({
      name: entry.name,
      suite: entry.suite,
      runs: totalRuns,
      passed: passes.length,
      failed: fails.length,
      passRate: Math.round(passRate * 100) / 100,
      flaky: passRate > 0 && passRate < 100,
      avgDuration: avg(reported),
      history: entry.outcomes.map((o) => (o === undefined ? "·" : o.passed ? "✓" : "✗")).join(""),
      avgPassDuration: avg(passes),
      avgFailDuration: avg(fails),
      failures: countErrors(fails),
      file: entry.file,
      line: entry.line,
    });
  }

  tests.sort((a, b) => a.passRate - b.passRate);

  const flakyTests = tests.filter(
    (t) => t.flaky && t.passRate >= threshold && t.passRate < 100
  );

  const startedAt = runs.length > 0 ? new Date().toISOString() : "";
  const totalDuration = runs.reduce((sum, r) => sum + r.duration, 0);

  return {
    command,
    totalRuns: runs.length,
    threshold,
    startedAt,
    finishedAt: new Date().toISOString(),
    totalDuration,
    tests,
    flakyTests,
    summary: {
      totalTests: tests.length,
      flakyCount: flakyTests.length,
      alwaysPass: tests.filter((t) => t.passRate === 100).length,
      alwaysFail: tests.filter((t) => t.passRate === 0).length,
    },
  };
}

function avg(results: TestResult[]): number {
  if (results.length === 0) return 0;
  return Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length);
}

const ANSI = /\u001b\[[0-9;]*m/g;

/** Groups failures by their first error line, so "Timeout 5000ms exceeded" from 4 runs is one entry. */
function countErrors(fails: TestResult[]): { error: string; count: number }[] {
  const counts = new Map<string, { error: string; count: number }>();
  for (const f of fails) {
    const error = (f.error ?? "(no error message reported)").replace(ANSI, "").trim();
    const key = error.split("\n")[0];
    const entry = counts.get(key) ?? { error: error.slice(0, 2000), count: 0 };
    entry.count++;
    counts.set(key, entry);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}
