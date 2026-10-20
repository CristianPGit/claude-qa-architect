import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { claude, FALLBACKS } from "./claude.js";
import type { GradeResult, Grader, Task, Transcript } from "./types.js";

const Verdict = z.object({ pass: z.boolean(), reasoning: z.string() });

const JUDGE_SYSTEM = `You grade one transcript of an AI system against a rubric.
Judge only what the rubric asks. Pass only if every requirement in the rubric is met; when the transcript is ambiguous, fail it and say what is missing. Keep the reasoning to two sentences.`;

export async function grade(
  grader: Grader,
  task: Task,
  t: Transcript,
  judgeModel: string
): Promise<GradeResult> {
  const result = (pass: boolean, detail: string): GradeResult => ({ grader: grader.type, pass, detail });

  switch (grader.type) {
    case "contains":
    case "not-contains": {
      const found = includes(t.output, grader.value, grader.ignoreCase);
      const pass = grader.type === "contains" ? found : !found;
      return result(pass, `${found ? "found" : "did not find"} "${grader.value}"`);
    }
    case "regex": {
      const pass = new RegExp(grader.pattern, grader.flags).test(t.output);
      return result(pass, `/${grader.pattern}/${grader.flags} ${pass ? "matched" : "did not match"}`);
    }
    case "tool-called": {
      const calls = t.toolCalls.filter((c) => c.name === grader.tool);
      if (calls.length === 0) return result(false, `${grader.tool} not called (called: ${names(t)})`);
      const match = calls.find((c) => inputMatches(c.input, grader.input));
      return match
        ? result(true, `${grader.tool} called`)
        : result(false, `${grader.tool} called with ${JSON.stringify(calls[0].input)}`);
    }
    case "tool-not-called": {
      const called = t.toolCalls.some((c) => c.name === grader.tool);
      return result(!called, called ? `${grader.tool} was called` : `${grader.tool} not called`);
    }
    case "max-tool-calls": {
      const n = t.toolCalls.length;
      return result(n <= grader.max, `${n} tool call(s), max ${grader.max}`);
    }
    case "llm-rubric":
      return judge(grader.rubric, task, t, judgeModel).then((v) => result(v.pass, v.reasoning));
  }
}

async function judge(rubric: string, task: Task, t: Transcript, model: string) {
  const res = await claude().beta.messages.parse({
    ...FALLBACKS,
    model,
    max_tokens: 16000,
    output_config: { effort: "low", format: betaZodOutputFormat(Verdict) },
    system: JUDGE_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          `<rubric>\n${rubric}\n</rubric>`,
          `<task_input>\n${task.input}\n</task_input>`,
          `<tool_calls>\n${JSON.stringify(t.toolCalls, null, 2)}\n</tool_calls>`,
          `<output>\n${t.output}\n</output>`,
        ].join("\n\n"),
      },
    ],
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) {
    return { pass: false, reasoning: "judge returned no verdict" };
  }
  return res.parsed_output;
}

function includes(haystack: string, needle: string, ignoreCase: boolean): boolean {
  return ignoreCase ? haystack.toLowerCase().includes(needle.toLowerCase()) : haystack.includes(needle);
}

function names(t: Transcript): string {
  return t.toolCalls.map((c) => c.name).join(", ") || "none";
}

/** Every expected key must match: strings as case-insensitive substrings, everything else by JSON equality. */
function inputMatches(actual: unknown, expected?: Record<string, unknown>): boolean {
  if (!expected) return true;
  const obj = (actual ?? {}) as Record<string, unknown>;
  return Object.entries(expected).every(([key, want]) => {
    const got = obj[key];
    if (typeof want === "string") return typeof got === "string" && includes(got, want, true);
    return JSON.stringify(got) === JSON.stringify(want);
  });
}
