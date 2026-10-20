import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

/** Shared client; credentials come from ANTHROPIC_API_KEY or an `ant auth login` profile. */
export function claude(): Anthropic {
  client ??= new Anthropic();
  return client;
}

/** Every request opts into server-side refusal fallbacks. */
export const FALLBACKS: Pick<Anthropic.Beta.MessageCreateParamsNonStreaming, "betas" | "fallbacks"> = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};
