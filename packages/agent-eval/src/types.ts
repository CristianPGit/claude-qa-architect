import { z } from "zod";

export const DEFAULT_MODEL = "claude-opus-5-5";

const ignoreCase = z.boolean().default(true);

export const GraderSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("contains"), value: z.string(), ignoreCase }),
  z.object({ type: z.literal("not-contains"), value: z.string(), ignoreCase }),
  z.object({ type: z.literal("regex"), pattern: z.string(), flags: z.string().default("") }),
  /** Passes if the agent called `tool`; `input` keys must match (strings: case-insensitive substring). */
  z.object({
    type: z.literal("tool-called"),
    tool: z.string(),
    input: z.record(z.string(), z.unknown()).optional(),
  }),
  z.object({ type: z.literal("tool-not-called"), tool: z.string() }),
  z.object({ type: z.literal("max-tool-calls"), max: z.number().int().nonnegative() }),
  /** A judge model grades the transcript against a natural-language rubric. */
  z.object({ type: z.literal("llm-rubric"), rubric: z.string() }),
]);

export const TargetSchema = z.discriminatedUnion("type", [
  /** Any program: the task input arrives on stdin, stdout is the output. */
  z.object({
    type: z.literal("command"),
    command: z.string(),
    timeoutMs: z.number().int().positive().default(120_000),
  }),
  /** A bare Claude call — for evaluating a prompt / system prompt. */
  z.object({
    type: z.literal("claude"),
    model: z.string().default(DEFAULT_MODEL),
    system: z.string().optional(),
  }),
  /**
   * An MCP server over stdio. Claude gets the server's tools and the task input; the eval checks
   * which tools it picks and with what arguments. Tool calls are only executed against the server
   * when `execute` is true — leave it off for servers with side effects.
   */
  z.object({
    type: z.literal("mcp"),
    command: z.string(),
    args: z.array(z.string()).default([]),
    env: z.record(z.string(), z.string()).optional(),
    model: z.string().default(DEFAULT_MODEL),
    system: z.string().optional(),
    execute: z.boolean().default(false),
    maxTurns: z.number().int().positive().default(8),
  }),
]);

export const EvalFileSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  target: TargetSchema,
  trials: z.number().int().positive().default(3),
  judgeModel: z.string().default(DEFAULT_MODEL),
  tasks: z
    .array(
      z.object({
        id: z.string(),
        input: z.string(),
        graders: z.array(GraderSchema).min(1),
      })
    )
    .min(1),
});

export type Grader = z.infer<typeof GraderSchema>;
export type Target = z.infer<typeof TargetSchema>;
export type EvalFile = z.infer<typeof EvalFileSchema>;
export type Task = EvalFile["tasks"][number];

export interface ToolCall {
  name: string;
  input: unknown;
}

export interface Transcript {
  output: string;
  toolCalls: ToolCall[];
  turns: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  error?: string;
}

export interface GradeResult {
  grader: Grader["type"];
  pass: boolean;
  detail: string;
}

export interface TrialResult {
  trial: number;
  pass: boolean;
  grades: GradeResult[];
  transcript: Transcript;
}

export interface TaskStats {
  id: string;
  trials: number;
  passes: number;
  passRate: number;
  /** pass@k: at least one of the k trials passed — the agent *can* do it. */
  passAtK: boolean;
  /** pass^k: every trial passed — the agent *reliably* does it. */
  passAllK: boolean;
  flaky: boolean;
  avgLatencyMs: number;
  avgTokens: number;
  failingGraders: Record<string, number>;
  results: TrialResult[];
}

export interface EvalReport {
  name: string;
  target: Target["type"];
  startedAt: string;
  finishedAt: string;
  trials: number;
  minPassRate: number;
  tasks: TaskStats[];
  summary: {
    tasks: number;
    reliable: number;
    flaky: number;
    failing: number;
    passRate: number;
  };
}
