import type { RunResult, TestStats, FlakyReport } from "./types.js";

export function analyze(
  command: string,
  runs: RunResult[],
  threshold: number
): FlakyReport {
  const testMap = new Map<string, { passed: number; failed: number; durations: number[] }>();

  for (const run of runs) {
    if (run.tests.length === 0) continue;

    for (const test of run.tests) {
      const key = `${test.suite} > ${test.name}`;
      const entry = testMap.get(key) ?? { passed: 0, failed: 0, durations: [] };

      if (test.passed) {
        entry.passed++;
      } else {
        entry.failed++;
      }
      entry.durations.push(test.duration);
      testMap.set(key, entry);
    }
  }

  const tests: TestStats[] = [];

  for (const [key, stats] of testMap) {
    const [suite, ...nameParts] = key.split(" > ");
    const name = nameParts.join(" > ");
    const totalRuns = stats.passed + stats.failed;
    const passRate = totalRuns > 0 ? (stats.passed / totalRuns) * 100 : 0;
    const avgDuration =
      stats.durations.length > 0
        ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
        : 0;

    const flaky = passRate > 0 && passRate < 100;

    tests.push({
      name,
      suite,
      runs: totalRuns,
      passed: stats.passed,
      failed: stats.failed,
      passRate: Math.round(passRate * 100) / 100,
      flaky,
      avgDuration: Math.round(avgDuration),
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
