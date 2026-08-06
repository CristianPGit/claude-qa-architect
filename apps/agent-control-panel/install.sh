#!/usr/bin/env bash
# Install the control-panel kit into a Claude Code workspace's .claude/ directory.
# Usage: ./install.sh /path/to/workspace
set -euo pipefail

TARGET="${1:?usage: ./install.sh /path/to/workspace}"
KIT="$(cd "$(dirname "$0")/kit" && pwd)"

mkdir -p "$TARGET/.claude/workflows" "$TARGET/.claude/skills"
cp -R "$KIT/workflows/." "$TARGET/.claude/workflows/"
cp -R "$KIT/skills/." "$TARGET/.claude/skills/"

echo "Installed skills + workflows into $TARGET/.claude/"
echo
echo "Now edit the path constants at the top of:"
echo "  $TARGET/.claude/workflows/bug-hunt.js       (workspace root)"
echo "  $TARGET/.claude/workflows/spec-to-plan.js   (workspace root)"
echo "  $TARGET/.claude/workflows/audit-sessions.js (session transcript dir)"
