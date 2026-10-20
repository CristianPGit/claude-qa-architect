import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Locator, Page } from "playwright";
import type { HealCandidate, SelectorFailure } from "./types.js";

export const DEFAULT_MODEL = "claude-opus-5-5";

const LOCATOR_METHODS = [
  "getByRole",
  "getByLabel",
  "getByPlaceholder",
  "getByText",
  "getByTestId",
  "getByTitle",
  "getByAltText",
] as const;

const Suggestion = z.object({
  found: z.boolean(),
  ref: z.string(),
  method: z.enum(LOCATOR_METHODS),
  value: z.string(),
  name: z.string().nullable(),
  exact: z.boolean(),
  confidence: z.number(),
  rationale: z.string(),
});

type Suggestion = z.infer<typeof Suggestion>;

const SYSTEM = `You repair broken Playwright locators.

You get a locator that no longer matches, the error it produced, and an aria snapshot of the live page in which every element carries a ref such as [ref=e12].

Pick the element the broken locator was most likely meant to target, and describe a user-facing locator for it:
- prefer getByRole with an accessible name, then getByLabel, getByPlaceholder, getByText, getByTestId
- never rely on CSS classes, generated ids, or DOM position
- "value" is the first argument: the role for getByRole, otherwise the text, label or test id
- "name" is the accessible name for getByRole and null for every other method
- "ref" is the ref of the element you chose, copied exactly from the snapshot

If no element on the page plausibly matches the intent, set found to false and explain why in rationale. Never invent a ref.`;

let client: Anthropic | undefined;

export async function aiCandidate(
  page: Page,
  failure: SelectorFailure,
  model: string
): Promise<HealCandidate | null> {
  const snapshot = await page.ariaSnapshot({ mode: "ai" });
  client ??= new Anthropic();

  const response = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(Suggestion) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          `Broken locator: ${failure.selector}`,
          `Test: ${failure.testName} (${failure.testFile}:${failure.line})`,
          `Error:\n${failure.errorMessage}`,
          `Aria snapshot of ${page.url()}:\n${snapshot}`,
        ].join("\n\n"),
      },
    ],
  });

  if (response.stop_reason === "refusal") return null;
  const suggestion = response.parsed_output;
  if (!suggestion?.found) return null;

  const locator = buildLocator(page, suggestion);
  if (!(await resolvesToRef(page, locator, suggestion.ref))) return null;

  const element = await locator.evaluate((node) => {
    const attrs: Record<string, string> = {};
    for (const attr of (node as HTMLElement).attributes) attrs[attr.name] = attr.value;
    return {
      tag: node.tagName.toLowerCase(),
      text: (node.textContent ?? "").trim().slice(0, 100),
      attributes: attrs,
    };
  });

  return {
    selector: renderLocator(suggestion),
    strategy: "ai-aria-match",
    confidence: Math.max(0, Math.min(suggestion.confidence, 0.95)),
    element,
    rationale: suggestion.rationale,
  };
}

function buildLocator(page: Page, s: Suggestion): Locator {
  const exact = { exact: s.exact };
  switch (s.method) {
    case "getByRole":
      return page.getByRole(s.value as Parameters<Page["getByRole"]>[0], {
        ...(s.name ? { name: s.name } : {}),
        ...exact,
      });
    case "getByTestId":
      return page.getByTestId(s.value);
    default:
      return page[s.method](s.value, exact);
  }
}

/**
 * The suggestion only counts if its locator is unique on the page and lands on the very
 * element the model pointed at — a plausible-looking locator that hits a different
 * element would turn a red test into a silently wrong green one.
 */
async function resolvesToRef(page: Page, locator: Locator, ref: string): Promise<boolean> {
  try {
    if ((await locator.count()) !== 1) return false;
    const target = await page.getByRef(ref).elementHandle({ timeout: 2_000 });
    if (!target) return false;
    return await locator.evaluate((node, other) => node === other, target);
  } catch {
    return false;
  }
}

function renderLocator(s: Suggestion): string {
  const opts: string[] = [];
  if (s.method === "getByRole" && s.name) opts.push(`name: ${quote(s.name)}`);
  if (s.exact && s.method !== "getByTestId") opts.push("exact: true");
  const tail = opts.length > 0 ? `, { ${opts.join(", ")} }` : "";
  return `${s.method}(${quote(s.value)}${tail})`;
}

function quote(text: string): string {
  return `'${text.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}
