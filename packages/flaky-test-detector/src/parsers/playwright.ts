import { isAbsolute, join } from "node:path";
import type { TestResult } from "../types.js";

interface PlaywrightSuite {
  title: string;
  suites?: PlaywrightSuite[];
  specs?: PlaywrightSpec[];
}

interface PlaywrightSpec {
  title: string;
  file?: string;
  line?: number;
  tests: PlaywrightTest[];
}

interface PlaywrightTest {
  results: { status: string; duration: number; errors?: { message?: string }[] }[];
}

interface PlaywrightReport {
  config?: { rootDir?: string };
  suites: PlaywrightSuite[];
}

export function parsePlaywright(data: PlaywrightReport): TestResult[] {
  const results: TestResult[] = [];
  walkSuites(data.suites, [], results, data.config?.rootDir);
  return results;
}

function walkSuites(
  suites: PlaywrightSuite[],
  parents: string[],
  results: TestResult[],
  rootDir?: string
): void {
  for (const suite of suites) {
    const path = [...parents, suite.title].filter(Boolean);

    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          const lastResult = test.results[test.results.length - 1];
          if (!lastResult) continue;

          const passed = lastResult.status === "passed" || lastResult.status === "expected";
          results.push({
            name: spec.title,
            suite: path.join(" > "),
            passed,
            duration: lastResult.duration,
            error: passed ? undefined : lastResult.errors?.find((e) => e.message)?.message,
            // The JSON reporter gives spec paths relative to the config's rootDir.
            file: spec.file && rootDir && !isAbsolute(spec.file) ? join(rootDir, spec.file) : spec.file,
            line: spec.line,
          });
        }
      }
    }

    if (suite.suites) {
      walkSuites(suite.suites, path, results, rootDir);
    }
  }
}
