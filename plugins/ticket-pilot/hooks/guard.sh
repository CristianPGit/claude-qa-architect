#!/usr/bin/env bash
#
# ticket-pilot PreToolUse guard.
#
# Enforces the plugin's hard boundary at the harness level: no pushing, no PR
# creation, no Jira writes — even if the model is convinced (or prompt-injected
# via ticket text) into trying. The SKILL.md rules are instructions; this is
# mechanism. Exit 2 blocks the tool call and the stderr message is shown to
# the model.
set -uo pipefail

input=$(cat)

cmd=""
if command -v jq >/dev/null 2>&1; then
  cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null)
elif command -v python3 >/dev/null 2>&1; then
  cmd=$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null)
fi
[[ -z "$cmd" ]] && exit 0

deny_patterns=(
  'git[[:space:]]+push([^[:alnum:]_-]|$)'
  'git[[:space:]][^|;&]*[[:space:]]push([^[:alnum:]_-]|$)'
  'gh[[:space:]]+pr[[:space:]]+(create|merge|close)'
  'jira[[:space:]]+issue[[:space:]]+(edit|move|comment|assign|delete|create|link|clone)'
  'jira[[:space:]]+sprint[[:space:]]+(add|remove)'
  'jira[[:space:]]+epic[[:space:]]+(add|remove)'
)

for pat in "${deny_patterns[@]}"; do
  if [[ "$cmd" =~ $pat ]]; then
    echo "ticket-pilot guard: blocked — pushing, PR creation, and Jira writes are reserved for the human. (matched: $pat). Finish the pipeline and hand the branch to the user instead." >&2
    exit 2
  fi
done

exit 0
