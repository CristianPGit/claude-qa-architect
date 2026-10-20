import type { Page } from '@playwright/test';

export type WebMcpTool = Awaited<ReturnType<Page['webmcp']['tools']>>[number];

export interface LintIssue {
  tool: string;
  rule: string;
  message: string;
}

type JsonSchema = {
  type?: string;
  properties?: Record<string, { description?: string }>;
  required?: string[];
};

/**
 * Checks the WebMCP tools a page registers against what an agent needs to use them well. Agents
 * pick tools only from name + description + schema, so a vague description or an undocumented
 * parameter is a functional bug, not a style nit.
 */
export function lintWebMcpTools(tools: WebMcpTool[]): LintIssue[] {
  const issues: LintIssue[] = [];
  const issue = (tool: string, rule: string, message: string) => issues.push({ tool, rule, message });
  const seen = new Set<string>();

  for (const t of tools) {
    if (seen.has(t.name)) issue(t.name, 'unique-name', 'registered more than once');
    seen.add(t.name);

    if (!/^[a-z][a-z0-9_]*$/.test(t.name)) issue(t.name, 'snake-case-name', 'use snake_case, like MCP tool names');
    if ((t.description ?? '').trim().length < 20) {
      issue(t.name, 'descriptive', 'description under 20 characters; say what it does and when to use it');
    }

    const schema = t.inputSchema as JsonSchema | undefined;
    if (!schema) {
      issue(t.name, 'input-schema', 'no inputSchema; agents will guess the arguments');
      continue;
    }
    if (schema.type !== 'object') issue(t.name, 'input-schema', 'inputSchema.type must be "object"');

    const props = Object.entries(schema.properties ?? {});
    for (const [prop, def] of props) {
      if (!def.description) issue(t.name, 'param-description', `parameter "${prop}" has no description`);
    }
    for (const req of schema.required ?? []) {
      if (!(schema.properties ?? {})[req]) issue(t.name, 'required-exists', `required "${req}" is not a property`);
    }
    if (props.length > 0 && !schema.required) {
      issue(t.name, 'required-declared', 'declare which parameters are required');
    }
  }
  return issues;
}
