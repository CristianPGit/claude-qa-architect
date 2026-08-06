export { visualCheck, VisualMismatchError } from "./visual-check.js";
export { generateHtmlReport } from "./report.js";
export {
  approveAll,
  approveBaseline,
  listBaselines,
  listResults,
  clearResults,
  getPaths,
} from "./storage.js";
export type {
  SnapshotOptions,
  DiffResult,
  VisualReport,
} from "./types.js";
