export const meta = {
  name: 'spec-to-plan',
  description: 'Turn a spec into an implementation plan via competing designs and a judge panel',
  whenToUse: 'When the user runs /spec-to-plan with a feature spec or requirement text',
  phases: [
    { title: 'Understand', detail: 'map the relevant code' },
    { title: 'Design', detail: '3 independent design attempts' },
    { title: 'Judge', detail: 'score designs, synthesize final plan' },
  ],
}

// args: { spec: string, target?: string }
// args may arrive JSON-stringified; normalize before use
const a = typeof args === 'string' ? JSON.parse(args) : (args || {})
const spec = a.spec
if (!spec) return { error: 'No spec provided. Pass args: { spec: "..." }' }
const target = a.target || '.'
// EDIT ME — workflow scripts get no filesystem or env access, so this path must be a
// literal. Point it at your checkout of this repo.
const REPO_ROOT = '/absolute/path/to/claude-qa-architect'
const root = `${REPO_ROOT}/${target}`

phase('Understand')
const CONTEXT_SCHEMA = {
  type: 'object',
  required: ['summary', 'keyFiles', 'constraints'],
  properties: {
    summary: { type: 'string' },
    keyFiles: { type: 'array', items: { type: 'string' } },
    constraints: { type: 'array', items: { type: 'string' } },
  },
}
const context = await agent(
  `Explore ${root} (read CLAUDE.md at the workspace root too) and map everything relevant to ` +
  `implementing this spec:\n\n${spec}\n\nReturn: a summary of the relevant architecture, the key ` +
  `files (repo-relative paths) a plan must touch or respect, and hard constraints (conventions, ` +
  `env quirks, test patterns) the plan must honor.`,
  { label: 'map-codebase', schema: CONTEXT_SCHEMA }
)

phase('Design')
const ANGLES = [
  { key: 'mvp', brief: 'MVP-first: smallest change that satisfies the spec, minimal new surface area' },
  { key: 'risk', brief: 'risk-first: identify what can break (flakiness, env quirks, auth, timing) and design around the failure modes' },
  { key: 'test', brief: 'testability-first: design for verifiability — clear seams, deterministic waits, tags, reporting' },
]
const designs = (await parallel(ANGLES.map(a => () =>
  agent(
    `Design an implementation plan for this spec, taking a ${a.brief} approach.\n\n` +
    `SPEC:\n${spec}\n\nCODEBASE CONTEXT:\n${JSON.stringify(context, null, 2)}\n\n` +
    `You may read files under ${root} to check assumptions. Return a concrete step-by-step plan: ` +
    `ordered steps, files to create/modify (repo-relative), and how each step is verified. ` +
    `Plain markdown, no preamble.`,
    { label: `design:${a.key}`, phase: 'Design' }
  ).then(plan => ({ angle: a.key, plan }))
))).filter(Boolean)

if (!designs.length) return { error: 'All design agents failed' }

phase('Judge')
const FINAL_SCHEMA = {
  type: 'object',
  required: ['winner', 'scores', 'finalPlan'],
  properties: {
    winner: { type: 'string' },
    scores: { type: 'string' },
    finalPlan: { type: 'string' },
  },
}
const result = await agent(
  `You are a judge panel. Score these ${designs.length} implementation plans for the spec below ` +
  `on: correctness vs the spec, fit with codebase constraints, verifiability, and effort. ` +
  `Then synthesize ONE final plan from the winner, grafting in the best ideas from the others.\n\n` +
  `SPEC:\n${spec}\n\nCONSTRAINTS:\n${(context.constraints || []).join('\n')}\n\n` +
  designs.map(d => `=== PLAN (${d.angle}) ===\n${d.plan}`).join('\n\n') +
  `\n\nReturn winner (angle name), scores (short markdown table), and finalPlan (full markdown: ` +
  `numbered steps, files touched, verification per step, open questions).`,
  { label: 'judge-and-synthesize', schema: FINAL_SCHEMA, effort: 'high' }
)

return { spec, context, winner: result.winner, scores: result.scores, finalPlan: result.finalPlan }
