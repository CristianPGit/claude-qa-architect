export interface SelectorFailure {
  testFile: string;
  testName: string;
  selector: string;
  selectorType: "css" | "role" | "text" | "testid" | "locator" | "unknown";
  line: number;
  column: number;
  errorMessage: string;
  pageUrl: string;
}

export interface HealCandidate {
  selector: string;
  strategy: HealStrategy;
  confidence: number;
  element: {
    tag: string;
    text: string;
    attributes: Record<string, string>;
  };
}

export type HealStrategy =
  | "text-match"
  | "role-match"
  | "testid-match"
  | "placeholder-match"
  | "aria-label-match"
  | "structural-match"
  | "class-fuzzy-match"
  | "id-match";

export interface HealResult {
  failure: SelectorFailure;
  candidates: HealCandidate[];
  chosen: HealCandidate | null;
  patched: boolean;
  verified: boolean;
}

export interface HealReport {
  startedAt: string;
  finishedAt: string;
  command: string;
  totalFailures: number;
  healed: number;
  unhealed: number;
  verified: number;
  results: HealResult[];
}

export interface CliOptions {
  command: string;
  dryRun: boolean;
  maxRetries: number;
  verify: boolean;
  format: "table" | "json" | "markdown";
  output?: string;
  baseUrl?: string;
}
