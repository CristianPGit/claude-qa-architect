export const meta = {
  name: 'audit-sessions',
  description: 'Audit recent Claude Code sessions in this workspace: what was done, what is unfinished, lessons worth remembering',
  whenToUse: 'When the user runs /audit-sessions or asks what recent sessions did / left unfinished',
  phases: [
    { title: 'Discover', detail: 'list recent session transcripts' },
    { title: 'Audit', detail: 'one auditor per session' },
    { title: 'Synthesize', detail: 'cross-session report' },
  ],
}

// args: { count?: number }  — how many recent sessions to audit (default 5)
// args may arrive JSON-stringified; normalize before use
const a = typeof args === 'string' ? JSON.parse(args) : (args || {})
const count = a.count || 5
const dir = '/Users/cristianpandele/.claude/projects/-Users-cristianpandele-Documents-learn-dev'

phase('Discover')
const LIST_SCHEMA = {
  type: 'object',
  required: ['sessions'],
  properties: {
    sessions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['path', 'modified', 'sizeKb'],
        properties: {
          path: { type: 'string' },
          modified: { type: 'string' },
          sizeKb: { type: 'number' },
        },
      },
    },
  },
}
const listing = await agent(
  `List the ${count} most recently modified session transcript files (*.jsonl, files only — ` +
  `skip directories and anything under memory/) in ${dir}. ` +
  `Use: ls -lt ${dir}/*.jsonl | head -${count + 2}. Exclude the currently-active session if it is ` +
  `clearly this audit run itself (the newest file mentioning "audit-sessions"). ` +
  `Return absolute path, modified date, and size in KB for each.`,
  { label: 'list-sessions', schema: LIST_SCHEMA, effort: 'low' }
)
const sessions = (listing.sessions || []).slice(0, count)
if (!sessions.length) return { error: `No session transcripts found in ${dir}` }
log(`Auditing ${sessions.length} sessions`)

const AUDIT_SCHEMA = {
  type: 'object',
  required: ['goal', 'outcome', 'unfinished', 'lessons'],
  properties: {
    goal: { type: 'string' },
    outcome: { type: 'string' },
    unfinished: { type: 'array', items: { type: 'string' } },
    lessons: { type: 'array', items: { type: 'string' } },
    filesTouched: { type: 'array', items: { type: 'string' } },
  },
}

phase('Audit')
const audits = await pipeline(
  sessions,
  s => agent(
    `Audit the Claude Code session transcript at ${s.path} (${s.sizeKb} KB). It is JSONL: one JSON ` +
    `object per line with user/assistant messages and tool calls. Large file — do NOT read it whole. ` +
    `Sample it: head -c 20000, tail -c 30000, and grep for user messages ` +
    `(jq -r 'select(.type=="user") | .message.content | if type=="array" then .[0].text? else . end' with fallback to grep '"type":"user"'). ` +
    `Determine: (1) goal — what the user asked for; (2) outcome — what actually got done and whether it was verified; ` +
    `(3) unfinished — promised or started work with no completion evidence; (4) lessons — corrections the user made, ` +
    `approaches that failed, preferences expressed; (5) filesTouched — main files created/edited. Be concrete.`,
    { label: `audit:${s.path.split('/').pop().slice(0, 12)}`, phase: 'Audit', schema: AUDIT_SCHEMA }
  ).then(a => ({ session: s.path.split('/').pop(), modified: s.modified, ...a }))
)

const done = audits.filter(Boolean)

phase('Synthesize')
const report = await agent(
  `Synthesize a cross-session audit report from these per-session audits of a QA engineer's Claude Code ` +
  `workspace (E2E test suites for a banking app):\n\n${JSON.stringify(done, null, 2)}\n\n` +
  `Return markdown with: (1) a compact table — one row per session: date, goal, outcome status emoji ` +
  `(✅ done / ⚠️ partial / ❌ abandoned), unfinished count; (2) "Unfinished work" — deduplicated, ordered by ` +
  `likely importance, each with its source session; (3) "Lessons & recurring patterns" — things that came up ` +
  `in more than one session or that the user explicitly corrected; (4) "Suggested memory entries" — at most 3, ` +
  `only durable facts not derivable from the repo. No preamble.`,
  { label: 'synthesize-report', effort: 'high' }
)

return { sessionsAudited: done.length, report }
