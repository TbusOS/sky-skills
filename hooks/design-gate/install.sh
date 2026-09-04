#!/usr/bin/env bash
# install.sh — wire the design gate into Claude Code's settings.json.
#
#   hooks/design-gate/install.sh            install (or refresh) both hooks
#   hooks/design-gate/install.sh --dry-run  show what would change
#   hooks/design-gate/install.sh uninstall  remove them again
#
# Entries carry an absolute path to this checkout, so a second checkout replaces
# the first rather than stacking. The matcher is intentionally left off: both
# hooks read the payload and exit 0 in a microsecond when it is not theirs, and
# a matcher expression that silently stops matching after a schema change is
# harder to notice than a hook that runs and says nothing.

set -uo pipefail
PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CMD=install
DRY=0
for a in "$@"; do
  case "$a" in
    uninstall) CMD=uninstall ;;
    --dry-run) DRY=1 ;;
    -h|--help) sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown argument: $a" >&2; exit 2 ;;
  esac
done

command -v jq >/dev/null 2>&1 || { echo "jq is required" >&2; exit 3; }
SETTINGS="$HOME/.claude/settings.json"
POST_CMD="bash $HERE/post-edit.sh"
STOP_CMD="bash $HERE/stop.sh"
# Any entry pointing at a design-gate checkout is ours, wherever it lives.
STRIP_RE="design-gate/(post-edit|stop)\\.sh"

say() { printf '%s\n' "$*"; }

merge() {   # <event> <command>
  local ev="$1" cmd="$2" tmp
  if [ "$DRY" = 1 ]; then say "  [dry-run] hooks.$ev += $cmd"; return; fi
  [ -f "$SETTINGS" ] || { mkdir -p "$(dirname "$SETTINGS")"; printf '{}' > "$SETTINGS"; }
  tmp="$(mktemp "${SETTINGS%/*}/.dgate.XXXXXX")"
  jq --arg ev "$ev" --arg cmd "$cmd" --arg re "$STRIP_RE" '
    .hooks = (.hooks // {})
    | .hooks[$ev] = ((((.hooks[$ev]) // [])
        | map(select((.hooks // []) | map(.command) | any(test($re)) | not)))
        + [{hooks:[{type:"command", command:$cmd}]}])
  ' "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"
}

unmerge() { # <event...>
  [ -f "$SETTINGS" ] || return 0
  local ev tmp
  for ev in "$@"; do
    if [ "$DRY" = 1 ]; then say "  [dry-run] hooks.$ev −= design-gate"; continue; fi
    tmp="$(mktemp "${SETTINGS%/*}/.dgate.XXXXXX")"
    jq --arg ev "$ev" --arg re "$STRIP_RE" '
      if (.hooks[$ev]?) then .hooks[$ev] = ((.hooks[$ev]) | map(select((.hooks // []) | map(.command) | any(test($re)) | not))) else . end
    ' "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"
  done
}

[ -f "$SETTINGS" ] && [ "$DRY" = 0 ] && cp "$SETTINGS" "$SETTINGS.bak"

if [ "$CMD" = uninstall ]; then
  say "removing the design gate from $SETTINGS"
  unmerge PostToolUse Stop
  say "done. .design-gate/ state directories are left alone; delete them if you want."
  exit 0
fi

say "installing the design gate into $SETTINGS"
say "  PostToolUse → post-edit.sh   (verify.py on every HTML write, 0.05s)"
say "  Stop        → stop.sh        (names files that never had the full run)"
merge PostToolUse "$POST_CMD"
merge Stop        "$STOP_CMD"
[ "$DRY" = 1 ] && exit 0

if jq -e --arg re "$STRIP_RE" '
     [(.hooks.PostToolUse // []), (.hooks.Stop // [])] | flatten
     | map((.hooks // []) | map(.command)) | flatten
     | map(select(test($re))) | length == 2
   ' "$SETTINGS" >/dev/null 2>&1; then
  say "verified: both entries are in place."
else
  say "WARNING: the entries are not where they were expected — check $SETTINGS by hand." >&2
  exit 1
fi
say ""
say "Turn it off for one session with DESIGN_GATE_HOOK=off, or remove it with:"
say "  $HERE/install.sh uninstall"
say "Restart Claude Code for the change to take effect."
