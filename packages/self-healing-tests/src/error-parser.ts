import { execSync } from "node:child_process";
import { existsSync, readFileSync, mkdirSync } from "node:fs";
import type { SelectorFailure } from "./types.js";

interface PlaywrightJsonError {
  suites: PwSuite[];
}

interface PwSuite {
  title: string;
  file: string;
  suites?: PwSuite[];
  specs?: PwSpec[];
}

interface PwSpec {
  title: string;
  tests: PwTest[];
}

interface PwTest {
  results: PwResult[];
}

interface PwResult {
  status: string;
  errors: PwError[];
}

interface PwError {
  message: string;
  location?: { file: string; line: number; column: number };
}

const SELECTOR_PATTERNS = [
  {
    regex: /locator\('([^']+)'\)/,
    type: "locator" as const,
  },
  {
    regex: /getByRole\('([^']+)'(?:,\s*\{[^}]*\})?\)/,
    type: "role" as const,
  },
  {
    regex: /getByText\('([^']+)'\)/,
    type: "text" as const,
  },
  {
    regex: /getByTestId\('([^']+)'\)/,
    type: "testid" as const,
  },
  {
    regex: /locator\("([^"]+)"\)/,
    type: "locator" as const,
  },
  {
    regex: /selector resolved to hidden/,
    type: "css" as const,
  },
  {
    regex: /waiting for locator\('([^']+)'\)/,
    type: "locator" as const,
  },
  {
    regex: /waiting for locator\("([^"]+)"\)/,
    type: "locator" as const,
  },
];

const CSS_SELECTOR_RE = /locator\(['"]([.#\[][^'"]+)['"]\)/;
const URL_RE = /navigating to "([^"]+)"|url:\s+"([^"]+)"|goto\(['"]([^'"]+)['"]\)/;

export function parsePlaywrightErrors(jsonReport: string): SelectorFailure[] {
  const failures: SelectorFailure[] = [];

  try {
    const report: PlaywrightJsonError = JSON.parse(jsonReport);
    walkSuites(report.suites, failures);
  } catch {
    parseFromStderr(jsonReport, failures);
  }

  return failures;
}

function walkSuites(suites: PwSuite[], failures: SelectorFailure[]): void {
  for (const suite of suites) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          for (const result of test.results) {
            if (result.status !== "failed" && result.status !== "timedOut") continue;

            for (const error of result.errors) {
              const failure = extractFailure(
                error.message,
                spec.title,
                suite.file,
                error.location
              );
              if (failure) failures.push(failure);
            }
          }
        }
      }
    }

    if (suite.suites) {
      walkSuites(suite.suites, failures);
    }
  }
}

function extractFailure(
  message: string,
  testName: string,
  testFile: string,
  location?: { file: string; line: number; column: number }
): SelectorFailure | null {
  let selector = "";
  let selectorType: SelectorFailure["selectorType"] = "unknown";

  for (const pattern of SELECTOR_PATTERNS) {
    const match = message.match(pattern.regex);
    if (match) {
      selector = match[1] ?? match[0];
      selectorType = pattern.type;
      break;
    }
  }

  if (!selector) {
    const cssMatch = message.match(CSS_SELECTOR_RE);
    if (cssMatch) {
      selector = cssMatch[1];
      selectorType = "css";
    }
  }

  if (!selector) return null;

  const urlMatch = message.match(URL_RE);
  const pageUrl = urlMatch?.[1] ?? urlMatch?.[2] ?? urlMatch?.[3] ?? "";

  return {
    testFile: location?.file ?? testFile,
    testName,
    selector,
    selectorType,
    line: location?.line ?? 0,
    column: location?.column ?? 0,
    errorMessage: message.slice(0, 500),
    pageUrl,
  };
}

function parseFromStderr(output: string, failures: SelectorFailure[]): void {
  const errorBlocks = output.split(/\d+\)\s+/);

  for (const block of errorBlocks) {
    const testNameMatch = block.match(/^(.+?)(?:\s+={3,}|\s+─{3,}|\n)/);
    const testName = testNameMatch?.[1]?.trim() ?? "unknown";

    const fileMatch = block.match(/at\s+.*?(\S+\.ts):(\d+):(\d+)/);
    const testFile = fileMatch?.[1] ?? "unknown";
    const line = parseInt(fileMatch?.[2] ?? "0", 10);
    const column = parseInt(fileMatch?.[3] ?? "0", 10);

    const failure = extractFailure(block, testName, testFile, {
      file: testFile,
      line,
      column,
    });

    if (failure) failures.push(failure);
  }
}

export function runAndCapture(command: string): {
  exitCode: number;
  stdout: string;
  stderr: string;
  jsonReport: string | null;
} {
  const reportDir = ".heal-reports";
  const reportPath = `${reportDir}/report.json`;
  mkdirSync(reportDir, { recursive: true });

  const cmd = `PLAYWRIGHT_JSON_OUTPUT_NAME=${reportPath} ${command} --reporter=json`;

  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  try {
    stdout = execSync(cmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    exitCode = e.status ?? 1;
    stdout = e.stdout ?? "";
    stderr = e.stderr ?? "";
  }

  const jsonReport = existsSync(reportPath)
    ? readFileSync(reportPath, "utf-8")
    : null;

  return { exitCode, stdout, stderr, jsonReport };
}
