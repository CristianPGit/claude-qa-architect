import type { TestResult } from "../types.js";

interface JestReport {
  testResults: JestSuite[];
}

interface JestSuite {
  testFilePath: string;
  testResults: JestTest[];
}

interface JestTest {
  fullName: string;
  ancestorTitles: string[];
  title: string;
  status: string;
  duration: number | null;
}

export function parseJest(data: JestReport): TestResult[] {
  const results: TestResult[] = [];

  for (const suite of data.testResults) {
    for (const test of suite.testResults) {
      results.push({
        name: test.title,
        suite: test.ancestorTitles.join(" > ") || suite.testFilePath,
        passed: test.status === "passed",
        duration: test.duration ?? 0,
      });
    }
  }

  return results;
}
