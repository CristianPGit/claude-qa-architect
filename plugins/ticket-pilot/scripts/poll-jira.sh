#!/usr/bin/env bash
#
# poll-jira.sh — watch for Jira tickets newly assigned to you and launch the
# ticket-pilot pipeline headlessly for each one.
#
# Requirements:
#   - jira-cli (https://github.com/ankitpokhrel/jira-cli), configured (`jira init`)
#   - claude (Claude Code CLI) on PATH
#   - Run from the root of the target repo, or set REPO_DIR
#
# Usage:
#   ./poll-jira.sh                 # single poll (use with cron/launchd)
#   ./poll-jira.sh --watch         # poll forever, every POLL_INTERVAL seconds
#   DRY_RUN=1 ./poll-jira.sh       # print what would launch, launch nothing
#
# Cron example (every 10 min, weekdays 9-18):
#   */10 9-18 * * 1-5  cd /path/to/repo && /path/to/poll-jira.sh >> ~/.ticket-pilot/poll.log 2>&1
#
set -euo pipefail

REPO_DIR="${REPO_DIR:-$(pwd)}"
STATE_DIR="${STATE_DIR:-$HOME/.ticket-pilot}"
SEEN_FILE="$STATE_DIR/seen-tickets"
POLL_INTERVAL="${POLL_INTERVAL:-600}"
# Only pick up tickets in this status — move a ticket here when YOU decide the
# agent should start, rather than triggering on raw assignment.
TRIGGER_STATUS="${TRIGGER_STATUS:-To Do}"
# Plan-approval gate is skipped in headless mode (no one is there to approve).
# The push gate is NEVER skipped — the pipeline ends at a local branch.
CLAUDE_ARGS=(--permission-mode acceptEdits -p)

mkdir -p "$STATE_DIR"
touch "$SEEN_FILE"

command -v jira >/dev/null || { echo "jira-cli not found; see https://github.com/ankitpokhrel/jira-cli" >&2; exit 1; }
command -v claude >/dev/null || { echo "claude CLI not found" >&2; exit 1; }

poll_once() {
  local keys
  keys=$(jira issue list -a"$(jira me)" -s"$TRIGGER_STATUS" --plain --no-headers --columns key 2>/dev/null | awk '{print $1}') || {
    echo "$(date -Iseconds) jira query failed" >&2
    return 0
  }

  for key in $keys; do
    grep -qxF "$key" "$SEEN_FILE" && continue

    echo "$(date -Iseconds) new ticket: $key"
    if [[ "${DRY_RUN:-0}" == "1" ]]; then
      echo "  DRY_RUN: would run: claude ${CLAUDE_ARGS[*]} '/ticket-pilot:ticket $key --auto'"
    else
      # Mark seen BEFORE launching so a crash can't cause a duplicate run.
      echo "$key" >> "$SEEN_FILE"
      (
        cd "$REPO_DIR"
        claude "${CLAUDE_ARGS[@]}" "/ticket-pilot:ticket $key --auto" \
          > "$STATE_DIR/run-$key.log" 2>&1
      ) &
      echo "  launched; log: $STATE_DIR/run-$key.log"
    fi
  done
}

if [[ "${1:-}" == "--watch" ]]; then
  echo "watching for tickets in status '$TRIGGER_STATUS' every ${POLL_INTERVAL}s (repo: $REPO_DIR)"
  while true; do
    poll_once
    sleep "$POLL_INTERVAL"
  done
else
  poll_once
fi
