#!/usr/bin/env bash
# install-hooks.sh — write a pre-push hook that rejects pushes to protected
# branches on the gateway repo. The hook is a client-side advisory layer —
# see SKILL.md "Safety model" on why server-side protection is still needed.
#
# Usage:
#   install-hooks.sh --repo=<gateway-dir> [--protect=<regex>] [--dry-run]
#
# --protect default: '^(main|master)$'

set -eu

REPO=""
PROTECT='^(main|master)$'
DRY_RUN=0

for a in "$@"; do
  case "$a" in
    --repo=*)     REPO="${a#*=}" ;;
    --protect=*)  PROTECT="${a#*=}" ;;
    --dry-run)    DRY_RUN=1 ;;
    -h|--help)    sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)            echo "unknown flag: $a" >&2; exit 1 ;;
  esac
done

REPO="${REPO/#\~/$HOME}"

[[ -n "$REPO" ]] || { echo "--repo=<path> required" >&2; exit 1; }
[[ -d "$REPO/.git" ]] || { echo "$REPO is not a git repo (.git missing)" >&2; exit 1; }

HOOK_PATH="$REPO/.git/hooks/pre-push"

# Hook body. The regex is substituted in at install time so the hook file is
# self-contained — no external dependencies, no env vars read at push time.
HOOK_BODY="$(cat <<EOF
#!/usr/bin/env bash
# pre-push hook · installed by sky-skills/gated-dual-clone/install-hooks.sh
# Rejects pushes to any branch matching the protected regex below.
# CAVEAT: client-side hooks are advisory. --no-verify bypasses them.
# Real protection = server-side protected-branch rules (GitLab / GitHub / Gerrit).

set -e
protected='__PROTECT__'
while read -r local_ref local_sha remote_ref remote_sha; do
  branch="\${remote_ref#refs/heads/}"
  if [[ "\$branch" =~ \$protected ]]; then
    echo "=========================================" >&2
    echo "REJECTED: push to protected branch '\$branch'" >&2
    echo "  Use MR/PR flow instead — push to your" >&2
    echo "  personal branch and raise a merge request." >&2
    echo "  Hook: .git/hooks/pre-push (installed by" >&2
    echo "  sky-skills/gated-dual-clone)" >&2
    echo "=========================================" >&2
    exit 1
  fi
done
exit 0
EOF
)"

# Substitute the regex into the hook body.
HOOK_BODY="${HOOK_BODY//__PROTECT__/$PROTECT}"

if [[ $DRY_RUN -eq 1 ]]; then
  echo "would write: $HOOK_PATH"
  echo "contents:"
  echo "$HOOK_BODY" | sed 's/^/  /'
  exit 0
fi

# Warn if overwriting an existing hook.
if [[ -e "$HOOK_PATH" ]]; then
  echo "warning: overwriting existing $HOOK_PATH" >&2
  echo "  (backup saved as $HOOK_PATH.bak-$(date +%s))" >&2
  cp "$HOOK_PATH" "$HOOK_PATH.bak-$(date +%s)"
fi

echo "$HOOK_BODY" > "$HOOK_PATH"
chmod +x "$HOOK_PATH"

echo "installed: $HOOK_PATH  (protect regex: $PROTECT)"
