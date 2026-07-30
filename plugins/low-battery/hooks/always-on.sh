#!/usr/bin/env sh
# SessionStart hook: injects the whole low-battery rule set when the user has opted in
# by creating a flag file. Opt-in only — installing the plugin changes nothing by itself.
#
# Flag file, first match wins:
#   $CLAUDE_CONFIG_DIR/.low-battery-always   (default ~/.claude)
#   $CODEX_HOME/.low-battery-always          (default ~/.codex)
#
# WHO NEEDS THIS
#   Codex     — yes. Codex has no output-style concept, so this is its always-on route.
#   Claude Code — usually NOT. The plugin ships an output style with `force-for-plugin: true`,
#               which already applies the same rules to every main-conversation turn. Only set the
#               Claude Code flag if you turned that output style off and still want always-on.
#               Setting both is harmless but loads the same text twice, for nothing.
#
# Pure POSIX sh so it runs wherever a command hook runs (sh on macOS/Linux, Git Bash on
# Windows) with no Node or Python on PATH. Never blocks session start: every failure exits 0.

for dir in "${CLAUDE_CONFIG_DIR:-$HOME/.claude}" "${CODEX_HOME:-$HOME/.codex}"; do
  if [ -f "$dir/.low-battery-always" ]; then
    flag_path="$dir/.low-battery-always"
    break
  fi
done

# Only fire when the user has opted in.
[ -n "$flag_path" ] || exit 0

# $0 is the absolute script path substituted in by the harness, so resolve SKILL.md
# relative to it instead of trusting an exported env var.
script_dir=$(dirname -- "$0")
skill_path="$script_dir/../skills/low-battery/SKILL.md"
[ -f "$skill_path" ] || exit 0

# Strip a leading YAML frontmatter block (--- ... --- at the very top of the file).
body=$(awk '
  NR == 1 && $0 ~ /^---[[:space:]]*$/ { in_fm = 1; next }
  in_fm && $0 ~ /^---[[:space:]]*$/   { in_fm = 0; next }
  !in_fm                              { print }
' "$skill_path") || exit 0

printf 'LOW BATTERY MODE ACTIVE (always-on). The rules below apply to every response in this session. Say "stop low-battery" or "normal mode" to turn them off for this session; delete %s to turn always-on off for good.\n\n%s\n' \
  "$flag_path" "$body"
