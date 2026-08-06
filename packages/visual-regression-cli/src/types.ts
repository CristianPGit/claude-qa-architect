export interface SnapshotOptions {
  /** Pixel difference threshold (0-1). Default: 0.1 */
  threshold?: number;
  /** Max percentage of pixels allowed to differ before failing. Default: 0 (any diff fails) */
  maxDiffPercent?: number;
  /** Selectors to mask before screenshot (timestamps, ads, dynamic content) */
  mask?: string[];
  /** Take full-page screenshot. Default: true */
  fullPage?: boolean;
  /** Only screenshot a specific element selector */
  selector?: string;
  /** Browser/viewport label, used in storage path. Default: "default" */
  variant?: string;
  /** Override baseline directory. Default: ".visual-regression/baselines" */
  baselineDir?: string;
  /** Override output directory for current + diff. Default: ".visual-regression" */
  outputDir?: string;
}

export interface DiffResult {
  /** Test snapshot name */
  name: string;
  /** Variant (e.g. "chromium-desktop") */
  variant: string;
  /** Total pixel count of the comparison area */
  totalPixels: number;
  /** Number of pixels that differ */
  diffPixels: number;
  /** Percentage of pixels that differ */
  diffPercent: number;
  /** Path to the baseline image */
  baselinePath: string;
  /** Path to the current image */
  currentPath: string;
  /** Path to the diff image (if any diff) */
  diffPath: string | null;
  /** True if diff is within tolerance */
  passed: boolean;
  /** Reason for failure: "new" (no baseline), "diff" (pixels differ), "size" (dimensions mismatch) */
  failureReason: "new" | "diff" | "size" | null;
  /** True if this is the first snapshot (no baseline existed) */
  isNew: boolean;
}

export interface VisualReport {
  generatedAt: string;
  results: DiffResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    newBaselines: number;
  };
}
