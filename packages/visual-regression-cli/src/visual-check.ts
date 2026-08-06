import type { Page, Locator } from "playwright";
import { readFileSync } from "node:fs";
import { compareImages } from "./comparator.js";
import {
  getPaths,
  hasBaseline,
  saveBuffer,
  appendResult,
  ensureDir,
  DEFAULT_BASELINE_DIR,
  DEFAULT_OUTPUT_DIR,
} from "./storage.js";
import type { SnapshotOptions, DiffResult } from "./types.js";

export class VisualMismatchError extends Error {
  constructor(public readonly result: DiffResult) {
    super(
      `Visual mismatch in "${result.name}" (${result.variant}): ` +
      `${result.diffPixels} pixels differ (${result.diffPercent}%). ` +
      `Reason: ${result.failureReason}. ` +
      `See ${result.diffPath ?? result.currentPath}`
    );
    this.name = "VisualMismatchError";
  }
}

export async function visualCheck(
  page: Page,
  name: string,
  options: SnapshotOptions = {}
): Promise<DiffResult> {
  const {
    threshold = 0.1,
    maxDiffPercent = 0,
    mask = [],
    fullPage = true,
    selector,
    variant = "default",
    baselineDir = DEFAULT_BASELINE_DIR,
    outputDir = DEFAULT_OUTPUT_DIR,
  } = options;

  const paths = getPaths(name, variant, baselineDir, outputDir);

  const maskLocators: Locator[] = mask.map((sel) => page.locator(sel));

  let screenshot: Buffer;
  if (selector) {
    const locator = page.locator(selector);
    screenshot = await locator.screenshot({
      mask: maskLocators.length > 0 ? maskLocators : undefined,
    });
  } else {
    screenshot = await page.screenshot({
      fullPage,
      mask: maskLocators.length > 0 ? maskLocators : undefined,
    });
  }

  ensureDir(paths.current);
  saveBuffer(paths.current, screenshot);

  if (!hasBaseline(paths)) {
    saveBuffer(paths.baseline, screenshot);
    const result: DiffResult = {
      name,
      variant,
      totalPixels: 0,
      diffPixels: 0,
      diffPercent: 0,
      baselinePath: paths.baseline,
      currentPath: paths.current,
      diffPath: null,
      passed: true,
      failureReason: null,
      isNew: true,
    };
    appendResult(result, outputDir);
    return result;
  }

  const baselineBuffer = readFileSync(paths.baseline);

  ensureDir(paths.diff);
  const cmp = compareImages({
    baselineBuffer,
    currentBuffer: screenshot,
    threshold,
    diffOutputPath: paths.diff,
  });

  const passed = !cmp.sizeMismatch && cmp.diffPercent <= maxDiffPercent;
  const failureReason: DiffResult["failureReason"] = passed
    ? null
    : cmp.sizeMismatch
      ? "size"
      : "diff";

  const result: DiffResult = {
    name,
    variant,
    totalPixels: cmp.totalPixels,
    diffPixels: cmp.diffPixels,
    diffPercent: cmp.diffPercent,
    baselinePath: paths.baseline,
    currentPath: paths.current,
    diffPath: cmp.diffPath,
    passed,
    failureReason,
    isNew: false,
  };

  appendResult(result, outputDir);

  if (!passed) {
    throw new VisualMismatchError(result);
  }

  return result;
}
