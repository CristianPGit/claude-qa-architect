export const meta = {
  name: 'bug-hunt',
  description: 'Multi-lens bug hunt over a target directory, adversarially verified',
  whenToUse: 'When the user runs /bug-hunt or asks for a thorough bug sweep of a suite/project',
  phases: [
    { title: 'Hunt', detail: 'parallel finders, one lens each' },
    { title: 'Verify', detail: 'adversarial refutation per finding' },
  ],
}

// args: { target?: string }  — repo-relative directory to hunt in
// args may arrive JSON-stringified; normalize before use
const a = typeof args === 'string' ? JSON.parse(args) : (args || {})
const target = a.target || 'e2e/george-search'
// EDIT ME — workflow scripts get no filesystem or env access, so this path must be a
// literal. Point it at your checkout of this repo.
const REPO_ROOT = '/absolute/path/to/claude-qa-architect'
const root = `${REPO_ROOT}/${target}`

const LENSES = [
  { key: 'logic', prompt: 'logic and correctness bugs: wrong assertions, inverted conditions, off-by-one, unhandled nulls, swallowed errors' },
  { key: 'async', prompt: 'async/race bugs: missing awaits, unawaited promises, race conditions, fixed sleeps that should be condition waits, timeout misuse' },
  { key: 'selector', prompt: 'selector fragility: hashed CSS-module classes, brittle nth-child/xpath, text selectors that break on i18n, duplicated selectors that drift' },
  { key: 'flaky', prompt: 'flakiness patterns: order-dependent tests, shared mutable state, network-dependent assertions without retry, time-of-day/timezone assumptions' },
  { key: 'config', prompt: 'config and dead-code issues: misconfigured timeouts/retries/workers, ignored env vars, unused fixtures/helpers, scripts that reference missing files' },
]

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'line', 'title', 'detail', 'severity'],
        properties: {
          file: { type: 'string' },
          line: { type: 'integer' },
          title: { type: 'string' },
          detail: { type: 'string' },
          severity: { enum: ['high', 'medium', 'low'] },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['refuted', 'reason'],
  properties: { refuted: { type: 'boolean' }, reason: { type: 'string' } },
}

const key = f => `${f.file}:${f.line}:${f.title}`
const seen = new Set()
const confirmed = []
let dry = 0
let round = 0

while (dry < 1 && round < 3) {
  round++
  phase('Hunt')
  const prior = [...seen].join('\n') || '(none yet)'
  const found = (await parallel(LENSES.map(l => () =>
    agent(
      `You are a bug finder examining the project at ${root} (an E2E test suite workspace; ` +
      `read its files with Read/Grep/Glob; CLAUDE.md at the workspace root has context). ` +
      `Hunt ONLY for ${l.prompt}. Known constraints you must NOT report as bugs: generous timeouts are ` +
      `deliberate (slow FAT environment), workers:1 is deliberate (shared test account), no webServer is deliberate. ` +
      `Already-reported findings (do not repeat):\n${prior}\n` +
      `Return every real finding with exact file (repo-relative) and line.`,
      { label: `hunt:${l.key}:r${round}`, phase: 'Hunt', schema: FINDINGS_SCHEMA }
    )
  ))).filter(Boolean).flatMap(r => r.findings)

  const fresh = found.filter(f => !seen.has(key(f)))
  if (!fresh.length) { dry++; continue }
  fresh.forEach(f => seen.add(key(f)))
  log(`Round ${round}: ${fresh.length} new candidate findings, verifying…`)

  phase('Verify')
  const judged = await parallel(fresh.map(f => () =>
    agent(
      `Adversarially verify this bug report against the actual code in ${root}. ` +
      `Read the cited file and surrounding context. Try hard to REFUTE it — default to refuted=true if ` +
      `the behavior is intentional, already handled elsewhere, or the report misreads the code.\n` +
      `Finding: ${f.title} — ${f.detail} (${f.file}:${f.line}, severity ${f.severity})`,
      { label: `verify:${f.file}:${f.line}`, phase: 'Verify', schema: VERDICT_SCHEMA }
    ).then(v => ({ ...f, verdict: v }))
  ))
  confirmed.push(...judged.filter(Boolean).filter(j => j.verdict && !j.verdict.refuted))
  log(`Round ${round}: ${confirmed.length} confirmed so far`)
}

return { target, rounds: round, candidates: seen.size, confirmed }
