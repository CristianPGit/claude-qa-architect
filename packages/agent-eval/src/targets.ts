import { spawnSync } from "node:child_process";
import type Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { claude, FALLBACKS } from "./claude.js";
import type { Target, ToolCall, Transcript } from "./types.js";

type BetaMessageParam = Anthropic.Beta.BetaMessageParam;
type BetaTool = Anthropic.Beta.BetaTool;
type BetaToolResultBlockParam = Anthropic.Beta.BetaToolResultBlockParam;

export interface Runner {
  run(input: string): Promise<Transcript>;
  close(): Promise<void>;
}

export async function createRunner(target: Target): Promise<Runner> {
  switch (target.type) {
    case "command":
      return commandRunner(target);
    case "claude":
      return claudeRunner(target);
    case "mcp":
      return mcpRunner(target);
  }
}

function commandRunner(target: Extract<Target, { type: "command" }>): Runner {
  return {
    async run(input) {
      const start = Date.now();
      const res = spawnSync(target.command, {
        shell: true,
        input,
        encoding: "utf-8",
        timeout: target.timeoutMs,
        maxBuffer: 20 * 1024 * 1024,
      });
      const failed = res.error ?? (res.status !== 0 ? new Error(`exit code ${res.status}: ${res.stderr.trim()}`) : null);
      return {
        output: res.stdout ?? "",
        toolCalls: [],
        turns: 1,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - start,
        ...(failed ? { error: failed.message } : {}),
      };
    },
    async close() {},
  };
}

function claudeRunner(target: Extract<Target, { type: "claude" }>): Runner {
  return {
    async run(input) {
      return agentLoop({ model: target.model, system: target.system, input, tools: [], maxTurns: 1 });
    },
    async close() {},
  };
}

async function mcpRunner(target: Extract<Target, { type: "mcp" }>): Promise<Runner> {
  const mcp = await connectMcp(target);
  const { tools } = await mcp.listTools();
  const claudeTools: BetaTool[] = tools.map((t) => ({
    name: t.name,
    description: t.description ?? "",
    input_schema: t.inputSchema as BetaTool["input_schema"],
  }));

  const execute = target.execute
    ? async (call: ToolCall): Promise<string> => {
        const result = await mcp.callTool({ name: call.name, arguments: call.input as Record<string, unknown> });
        return JSON.stringify(result.content);
      }
    : undefined;

  return {
    run(input) {
      return agentLoop({
        model: target.model,
        system: target.system,
        input,
        tools: claudeTools,
        // Without execution there are no tool results to feed back, so one turn — the
        // tool-selection decision — is all there is to grade.
        maxTurns: execute ? target.maxTurns : 1,
        execute,
      });
    },
    close: () => mcp.close(),
  };
}

export async function connectMcp(target: Extract<Target, { type: "mcp" }>): Promise<Client> {
  const transport = new StdioClientTransport({
    command: target.command,
    args: target.args,
    env: { ...(process.env as Record<string, string>), ...target.env },
    stderr: "ignore",
  });
  const client = new Client({ name: "agent-eval", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

interface LoopOptions {
  model: string;
  system?: string;
  input: string;
  tools: BetaTool[];
  maxTurns: number;
  execute?: (call: ToolCall) => Promise<string>;
}

async function agentLoop(opts: LoopOptions): Promise<Transcript> {
  const start = Date.now();
  const messages: BetaMessageParam[] = [{ role: "user", content: opts.input }];
  const toolCalls: ToolCall[] = [];
  let output = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let turns = 0;

  try {
    while (turns < opts.maxTurns) {
      turns++;
      const res = await claude().beta.messages.create({
        ...FALLBACKS,
        model: opts.model,
        max_tokens: 16000,
        ...(opts.system ? { system: opts.system } : {}),
        ...(opts.tools.length > 0 ? { tools: opts.tools } : {}),
        messages,
      });
      inputTokens += res.usage.input_tokens;
      outputTokens += res.usage.output_tokens;
      messages.push({ role: "assistant", content: res.content });

      output = res.content
        .flatMap((b) => (b.type === "text" ? [b.text] : []))
        .join("\n");
      const uses = res.content.filter((b) => b.type === "tool_use");
      for (const u of uses) toolCalls.push({ name: u.name, input: u.input });

      if (res.stop_reason === "refusal") {
        return finish({ error: `refused (${res.stop_details?.category ?? "no category"})` });
      }
      if (res.stop_reason !== "tool_use" || !opts.execute) break;

      const results: BetaToolResultBlockParam[] = await Promise.all(
        uses.map(async (u) => {
          try {
            const content = await opts.execute!({ name: u.name, input: u.input });
            return { type: "tool_result" as const, tool_use_id: u.id, content };
          } catch (err) {
            return { type: "tool_result" as const, tool_use_id: u.id, content: (err as Error).message, is_error: true };
          }
        })
      );
      messages.push({ role: "user", content: results });
    }
    return finish({});
  } catch (err) {
    return finish({ error: (err as Error).message });
  }

  function finish(extra: { error?: string }): Transcript {
    return { output, toolCalls, turns, inputTokens, outputTokens, latencyMs: Date.now() - start, ...extra };
  }
}
