import { readFileSync } from "node:fs";
import { z } from "zod";

/** A rule tag of "*" means "this change can affect anything — run the whole suite". */
export const ALL = "*";

export const RISK = ["high", "medium", "low"] as const;
export type Risk = (typeof RISK)[number];

export const ConfigSchema = z.object({
  /** Globs are relative to the config file's directory; use ../ for files outside the suite. */
  rules: z
    .array(
      z.object({
        name: z.string(),
        paths: z.array(z.string()).min(1),
        tags: z.array(z.string()).min(1),
        risk: z.enum(RISK).default("medium"),
      })
    )
    .default([]),
  /** Tags that always run, whatever changed — the safety net. */
  always: z.array(z.string()).default(["@smoke"]),
  /** Changes that never affect tests (docs, assets). */
  ignore: z.array(z.string()).default(["**/*.md"]),
  /** Feature files: a changed feature selects its own scenarios by feature name. */
  features: z.string().default("features/**/*.feature"),
  /**
   * What to do when a file inside the suite changed and no rule covers it. "all" (default) runs
   * the full suite — an unmapped change is exactly where a selection would silently miss a bug.
   */
  unmapped: z.enum(["all", "ignore"]).default("all"),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(path: string): Config {
  const parsed = ConfigSchema.safeParse(JSON.parse(readFileSync(path, "utf-8")));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid ${path}:\n${issues}`);
  }
  return parsed.data;
}
