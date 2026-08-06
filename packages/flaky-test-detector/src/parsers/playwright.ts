import type { TestResult } from "../types.js";

interface PlaywrightSuite {
  title: string;
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
}

interface PlaywrightSpec {
  title: string;
  tests: PlaywrightTest[];
}

interface PlaywrightTest {
  results: { status: string; duration: number }[];
}

interface PlaywrightReport {
  suites: PlaywrightSuite[];
}

export function parsePlaywright(data: PlaywrightReport): TestResult[] {
  const results: TestResult[] = [];
  walkSuites(data.suites, [], results);
  return results;
}

function walkSuites(
  suites: PlaywrightSuite[],
  parents: string[],
  results: TestResult[]
): void {
  for (const suite of suites) {
    const path = [...parents, suite.title].filter(Boolean);

    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          const lastResult = test.results[test.results.length - 1];
          if (!lastResult) continue;

          results.push({
            name: spec.title,
            suite: path.join(" > "),
            passed: lastResult.status === "passed" || lastResult.status === "expected",
            duration: lastResult.duration,
          });
        }
      }
    }

    if (suite.suites) {
      walkSuites(suite.suites, path, results);
    }
  }
}
