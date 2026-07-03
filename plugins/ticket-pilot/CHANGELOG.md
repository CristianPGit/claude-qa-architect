# Changelog

## 0.4.0 — 2026-07-03

CrewAI-inspired release: manager-style arbitration, persistent memory, and a
learning loop (see Acknowledgments in the README).

- **`tech-lead` agent:** the Phase 4 review panel's raw reports now go to an
  arbiter that dedupes, resolves reviewer conflicts by reading the code,
  rejects findings with evidence (no silent drops), and issues one ordered
  fix list plus a completion assessment. Security STOP verdicts cannot be
  overruled downward.
- **Pipeline memory** (`.ticket-work/memory.md`): repo gotchas, conventions,
  reviewer calibration, estimate calibration, and human preferences persist
  across runs — importance-tagged, recency-weighted, pruned on retro. Read
  at Phase 0 by `ticket` and by `triage`; updated at wrap-up.
- **`/retro` skill:** after a PR merges, compares pipeline output with what
  actually shipped, diagnoses each difference, writes durable lessons to the
  memory, calibrates estimates, and proposes CLAUDE.md/config edits when the
  same assumption fails twice.

## 0.3.1 — 2026-07-03

- Repo made public; author contact switched to GitHub noreply address.
- README: Gemini CLI / Antigravity setup steps and feature-parity table.
- Added this changelog.

## 0.3.0 — 2026-07-03

- **Autonomy levels 1/2/3** (pair / autopilot / headless) via `--level` or
  per-repo `.ticket-pilot.json`; safety stops apply at every level; levels
  2–3 log every judgment call to `assumptions.md`.
- **New agents:** `code-reviewer`, `security-auditor`, `test-designer`.
- **Phase 4 review panel:** code-reviewer + acceptance-reviewer +
  security-auditor run in parallel; a security STOP verdict halts the
  pipeline at any level.
- **TDD mode** (`--tdd` or config): failing tests designed and written
  before implementation.
- **New skills:** `/inbox` (assigned-ticket triage with recommended pickup
  order), `/preflight` (rebase on latest main, drift re-review, full
  re-verification, GO/NO-GO before the human pushes).
- **Poller:** `PILOT_LEVEL` (default 3, always worktree-isolated), macOS
  notifications, exit-code files.

## 0.2.0 — 2026-07-03

- **Guard hook** (`hooks/guard.sh`, PreToolUse): mechanically blocks
  `git push`, `gh pr create/merge`, and Jira writes — the no-push boundary
  enforced by the harness, not just instructions.
- **Resume:** per-phase `state.md` logging; re-running the skill continues
  from the last completed phase.
- `--worktree` flag for parallel tickets.
- New skills: `/triage`, `/standup`.

## 0.1.0 — 2026-07-03

- Initial release: `/ticket` 6-phase pipeline (ingest → analyze → plan →
  implement → review → QA), `requirements-analyst` and `acceptance-reviewer`
  agents, Jira poller script, permissions template. Never pushes, never
  writes to Jira.
