import type { TestResult } from "../types.js";

interface CypressResult {
  stats: { suites: number; tests: number };
  results?: CypressSuite[];
}

interface CypressSuite {
  fullFile: string;
  suites: CypressNestedSuite[];
}

interface CypressNestedSuite {
  title: string;
  tests: CypressTest[];
  suites?: CypressNestedSuite[];
}

interface CypressTest {
  title: string;
  pass: boolean;
  fail: boolean;
  duration: number;
}

export function parseCypress(data: CypressResult): TestResult[] {
  const results: TestResult[] = [];

  if (!data.results) return results;

  for (const file of data.results) {
    for (const suite of file.suites) {
      walkCypressSuite(suite, [], results);
    }
  }

  return results;
}

function walkCypressSuite(
  suite: CypressNestedSuite,
  parents: string[],
  results: TestResult[]
): void {
  const path = [...parents, suite.title].filter(Boolean);

  for (const test of suite.tests) {
    results.push({
      name: test.title,
      suite: path.join(" > "),
      passed: test.pass,
      duration: test.duration,
    });
  }

  if (suite.suites) {
    for (const child of suite.suites) {
      walkCypressSuite(child, path, results);
    }
  }
}
