import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { FLAKE_CATEGORIES, type Diagnosis, type TestStats } from "./types.js";

export const DEFAULT_MODEL = "claude-opus-5-5";

const DiagnosisSchema = z.object({
  category: z.enum(FLAKE_CATEGORIES),
  rootCause: z.string(),
  evidence: z.array(z.string()),
  fix: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
});

const SYSTEM = `You diagnose flaky automated tests: tests that both passed and failed across identical runs of the same code.

You get the pass/fail history in run order, the distinct failure messages with counts, average durations of passing and failing runs, and the test's source file.

Pick one category:
- timing: an action or assertion races the app (missing web-first wait, fixed sleeps, animation, debounce)
- test-order: depends on state left by other tests or on run order (shared account, storage, globals)
- test-data: depends on data that changes between runs (dates, random values, records others modify)
- environment: infrastructure, not the test or the app (slow backend, network, CI resources, timeouts near the limit)
- selector: a locator that matches inconsistently (several matches, hidden duplicates, generated classes)
- product-race: the application itself behaves nondeterministically. This is a real bug, not a test problem
- unknown: the evidence doesn't support any of the above

Ground every claim in the evidence given: quote the error line, the history pattern or the source line you rely on. A history such as ✓✓✗✓✗ with the same timeout every time points one way; alternating messages point another. Failing runs that are much slower than passing ones suggest timing or environment. Say how to confirm the diagnosis, and give the smallest fix. If the fix is "increase the timeout", explain why waiting longer is correct rather than hiding a bug. Set confidence to low when you are inferring more than the evidence shows.`;

let client: Anthropic | undefined;

export async function explainFlaky(test: TestStats, model: string): Promise<Diagnosis | null> {
  client ??= new Anthropic();

  const res = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "high", format: betaZodOutputFormat(DiagnosisSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: describe(test) }],
  });

  if (res.stop_reason === "refusal") return null;
  return res.parsed_output ?? null;
}

function describe(t: TestStats): string {
  const parts = [
    `<test>${t.suite} > ${t.name}</test>`,
    `<history runs="${t.history.length}" pass_rate="${t.passRate}%">${t.history}</history>`,
    `<durations avg_pass_ms="${t.avgPassDuration}" avg_fail_ms="${t.avgFailDuration}" />`,
    `<failures>\n${t.failures.map((f) => `<failure runs="${f.count}">\n${f.error}\n</failure>`).join("\n")}\n</failures>`,
  ];
  const source = readSource(t.file);
  if (source) parts.push(`<source file="${t.file}" test_line="${t.line ?? "?"}">\n${source}\n</source>`);
  return parts.join("\n\n");
}

/** The test file, numbered, capped so a huge file doesn't crowd out the evidence. */
function readSource(file?: string): string | null {
  if (!file) return null;
  const path = resolve(file);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8")
    .split("\n")
    .slice(0, 400)
    .map((line, i) => `${String(i + 1).padStart(4)}  ${line}`)
    .join("\n");
}
