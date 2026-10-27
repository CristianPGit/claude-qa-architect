#!/usr/bin/env python3
"""qa-architect PreToolUse guard.

The /qa loop runs without stopping, so its hard rules are enforced here, not just written down:

- deny: anything that names a production host listed in <project>/.qa/guard.json, merging a PR,
  and force pushes. Nothing the model says can get these through.
- ask: every other outward action (push, PR/issue writes, write calls to the GitHub API, tracker
  and chat writes). Claude Code shows the user its permission prompt, so the step 8 confirmation
  is the user's own click, not the model's say-so.

Anything else passes. Prints a PreToolUse decision as JSON and always exits 0.
"""
import json
import os
import re
import sys

DENY_BASH = [
    (r"\bgh\s+pr\s+merge\b", "merging is the PR author's call — /qa never merges"),
    (r"\bgit\s+push\b[^|;&]*\s(-f|--force|--force-with-lease)\b", "force pushes are never part of /qa"),
]

ASK_BASH = [
    r"\bgit\s+push\b",
    r"\bgh\s+pr\s+(create|comment|review|edit|close|reopen|ready)\b",
    r"\bgh\s+issue\s+(create|comment|edit|close|reopen|delete|transfer)\b",
    r"\bgh\s+release\s+(create|edit|delete|upload)\b",
    r"\bgh\s+api\b[^|;&]*\s(-X|--method)\s*(POST|PATCH|PUT|DELETE)\b",
    r"\bgh\s+api\b[^|;&]*\s(-f|-F|--field|--raw-field|--input)\s",
    r"\bjira\s+(issue|sprint|epic)\s+(create|edit|move|comment|assign|delete|link|clone|add|remove)\b",
    r"\bcurl\b[^|;&]*\bhooks\.slack\.com\b",
]

ASK_MCP = re.compile(
    r"linear.*__(save_|create_|delete_|update_|merge_|submit_|share_|resolve_|retire_|restore_)"
    r"|__(save_comment|save_issue|create_comment|create_issue|add_comment|send_message|create_draft|reply|forward)\b",
    re.I,
)

HOST = re.compile(r"(?:[a-z][a-z0-9+.-]*://)?(?:[^/\s@'\"]+@)?((?:[a-z0-9-]+\.)+[a-z]{2,})(?::\d+)?", re.I)


def decide(decision, reason):
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": decision,
        "permissionDecisionReason": f"qa-architect guard: {reason}",
    }}))
    sys.exit(0)


def blocked_hosts(cwd):
    for root in (cwd, os.environ.get("CLAUDE_PROJECT_DIR")):
        if not root:
            continue
        try:
            with open(os.path.join(root, ".qa", "guard.json")) as f:
                return [h.lower() for h in json.load(f).get("blockedHosts", [])]
        except (OSError, ValueError):
            continue
    return []


def host_blocked(host, rules):
    for rule in rules:
        if rule.startswith("*."):
            if host == rule[2:] or host.endswith(rule[1:]):
                return rule
        elif host == rule:
            return rule
    return None


def main():
    try:
        event = json.load(sys.stdin)
    except ValueError:
        return
    tool = event.get("tool_name", "")
    tool_input = event.get("tool_input") or {}
    text = tool_input.get("command", "") if tool == "Bash" else json.dumps(tool_input)

    rules = blocked_hosts(event.get("cwd"))
    for match in HOST.finditer(text):
        rule = host_blocked(match.group(1).lower(), rules)
        if rule:
            decide("deny", f"{match.group(1)} is a production host (.qa/guard.json: {rule}) — /qa never touches production")

    if tool == "Bash":
        for pattern, reason in DENY_BASH:
            if re.search(pattern, text):
                decide("deny", reason)
        for pattern in ASK_BASH:
            if re.search(pattern, text):
                decide("ask", "outward-facing action — needs the user's own approval")
    elif ASK_MCP.search(tool):
        decide("ask", f"{tool} writes to an external service — needs the user's own approval")


if __name__ == "__main__":
    main()
