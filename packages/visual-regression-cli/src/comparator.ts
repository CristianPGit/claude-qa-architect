import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

export interface CompareInput {
  baselineBuffer: Buffer;
  currentBuffer: Buffer;
  threshold: number;
  diffOutputPath?: string;
}

export interface CompareOutput {
  totalPixels: number;
  diffPixels: number;
  diffPercent: number;
  sizeMismatch: boolean;
  baselineDimensions: { width: number; height: number };
  currentDimensions: { width: number; height: number };
  diffPath: string | null;
}

export function compareImages(input: CompareInput): CompareOutput {
  const baseline = PNG.sync.read(input.baselineBuffer);
  const current = PNG.sync.read(input.currentBuffer);

  const baselineDims = { width: baseline.width, height: baseline.height };
  const currentDims = { width: current.width, height: current.height };

  if (baseline.width !== current.width || baseline.height !== current.height) {
    return {
      totalPixels: baseline.width * baseline.height,
      diffPixels: baseline.width * baseline.height,
      diffPercent: 100,
      sizeMismatch: true,
      baselineDimensions: baselineDims,
      currentDimensions: currentDims,
      diffPath: null,
    };
  }

  const { width, height } = baseline;
  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(
    baseline.data,
    current.data,
    diff.data,
    width,
    height,
    { threshold: input.threshold, includeAA: false }
  );

  const totalPixels = width * height;
  const diffPercent = (diffPixels / totalPixels) * 100;

  let diffPath: string | null = null;
  if (input.diffOutputPath && diffPixels > 0) {
    writeFileSync(input.diffOutputPath, PNG.sync.write(diff));
    diffPath = input.diffOutputPath;
  }

  return {
    totalPixels,
    diffPixels,
    diffPercent: Math.round(diffPercent * 100) / 100,
    sizeMismatch: false,
    baselineDimensions: baselineDims,
    currentDimensions: currentDims,
    diffPath,
  };
}

export function loadImage(path: string): Buffer {
  return readFileSync(path);
}
