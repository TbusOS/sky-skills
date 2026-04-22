#!/usr/bin/env bash
# bootstrap.sh — one-shot build of a gated-dual-clone topology.
#
# Creates a gateway repo (push source) and a satellite repo (fetch-only build
# tree) for projects where the upstream integration branch is protected and
# builds are heavy. The satellite's origin points at the local gateway path,
# so a stray `git push` from the compile tree is physically unable to reach
# the remote.
#
# 创建 gateway + satellite 双 clone 拓扑。gateway 负责 push,satellite 只读
# 编译。satellite 的 origin 指向本地 gateway 路径,编译树无法触达远程。
#
# Usage:
#   bootstrap.sh --remote=<url> --upstream-branch=<name> --push-branch=<name> \
#                --gateway-dir=<path> --satellite-dir=<path> \
#                --user-email=<email> --user-name=<name> \
#                [--protect=<regex>] [--dry-run] [--force] [--skip-gateway]
#
# Exit codes:
#   0 success · 1 bad CLI · 2 pre-flight fail · 3 clone fail ·
#   4 configure fail · 5 post-setup gate fail

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ------------------------------ Defaults ------------------------------
REMOTE=""
UPSTREAM_BRANCH=""
PUSH_BRANCH=""
GATEWAY_DIR=""
SATELLITE_DIR=""
EMAIL=""
NAME=""
PROTECT=""
DRY_RUN=0
FORCE=0
SKIP_GATEWAY=0

# ------------------------------ Args parsing --------------------------
usage() {
  sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

for a in "$@"; do
  case "$a" in
    --remote=*)           REMOTE="${a#*=}" ;;
    --upstream-branch=*)  UPSTREAM_BRANCH="${a#*=}" ;;
    --push-branch=*)      PUSH_BRANCH="${a#*=}" ;;
    --gateway-dir=*)      GATEWAY_DIR="${a#*=}" ;;
    --satellite-dir=*)    SATELLITE_DIR="${a#*=}" ;;
    --user-email=*)       EMAIL="${a#*=}" ;;
    --user-name=*)        NAME="${a#*=}" ;;
    --protect=*)          PROTECT="${a#*=}" ;;
    --dry-run)            DRY_RUN=1 ;;
    --force)              FORCE=1 ;;
    --skip-gateway)       SKIP_GATEWAY=1 ;;
    -h|--help)            usage 0 ;;
    *)                    echo "unknown flag: $a" >&2; usage 1 ;;
  esac
done

# Required flag check — skip-gateway mode relaxes gateway-specific flags.
missing=""
[[ -z "$SATELLITE_DIR" ]] && missing="$missing --satellite-dir"
[[ -z "$PUSH_BRANCH" ]] && missing="$missing --push-branch"
[[ -z "$EMAIL" ]] && missing="$missing --user-email"
[[ -z "$NAME" ]] && missing="$missing --user-name"
if [[ $SKIP_GATEWAY -eq 0 ]]; then
  [[ -z "$REMOTE" ]] && missing="$missing --remote"
  [[ -z "$UPSTREAM_BRANCH" ]] && missing="$missing --upstream-branch"
  [[ -z "$GATEWAY_DIR" ]] && missing="$missing --gateway-dir"
fi
if [[ -n "$missing" ]]; then
  echo "missing required:$missing" >&2
  echo "run with --help" >&2
  exit 1
fi

# Default protected-branch regex = upstream branch literal.
[[ -z "$PROTECT" ]] && PROTECT="^${UPSTREAM_BRANCH}$"

# Expand ~ in dir paths.
GATEWAY_DIR="${GATEWAY_DIR/#\~/$HOME}"
SATELLITE_DIR="${SATELLITE_DIR/#\~/$HOME}"

# ------------------------------ Dry-run helpers -----------------------
run() {
  if [[ $DRY_RUN -eq 1 ]]; then
    printf '    %s\n' "$*"
  else
    eval "$@"
  fi
}

step() {
  echo ""
  echo "━━ $* ━━"
}

# ------------------------------ Step 1 · Pre-flight -------------------
step "Step 1/8 · Pre-flight check"

# git version ≥ 2.20 for `remote set-url --push` semantics we rely on.
git_version="$(git --version | awk '{print $3}')"
git_major="$(echo "$git_version" | cut -d. -f1)"
git_minor="$(echo "$git_version" | cut -d. -f2)"
if [[ "$git_major" -lt 2 ]] || { [[ "$git_major" -eq 2 ]] && [[ "$git_minor" -lt 20 ]]; }; then
  echo "git $git_version < 2.20 · please upgrade" >&2
  exit 2
fi

# Gateway / satellite parent dirs must exist + be writeable.
if [[ $SKIP_GATEWAY -eq 0 ]]; then
  gw_parent="$(dirname "$GATEWAY_DIR")"
  [[ -d "$gw_parent" && -w "$gw_parent" ]] || {
    echo "gateway parent '$gw_parent' missing or not writeable" >&2; exit 2; }
fi
sat_parent="$(dirname "$SATELLITE_DIR")"
[[ -d "$sat_parent" && -w "$sat_parent" ]] || {
  echo "satellite parent '$sat_parent' missing or not writeable" >&2; exit 2; }

# Target dirs must not exist (or be empty with --force).
check_target() {
  local path="$1"
  local label="$2"
  if [[ -e "$path" ]]; then
    if [[ $FORCE -eq 1 ]]; then
      if [[ -d "$path" ]] && [[ -z "$(ls -A "$path" 2>/dev/null)" ]]; then
        return 0
      fi
      echo "$label '$path' exists and is NOT empty · refusing (clean by hand first)" >&2
      exit 2
    fi
    echo "$label '$path' already exists · use --force for empty dirs only" >&2
    exit 2
  fi
}
if [[ $SKIP_GATEWAY -eq 0 ]]; then
  check_target "$GATEWAY_DIR" "gateway-dir"
else
  [[ -d "$GATEWAY_DIR" ]] || { echo "--skip-gateway set but gateway '$GATEWAY_DIR' does not exist" >&2; exit 2; }
fi
check_target "$SATELLITE_DIR" "satellite-dir"

# Optional: SSH connectivity probe (ssh-based remotes only). Non-fatal — the
# clone itself will be the real test.
case "$REMOTE" in
  git@*|ssh://*)
    host="$(echo "$REMOTE" | sed -E 's|^(ssh://)?(git@)?([^:/]+).*|\3|')"
    if [[ -n "$host" ]] && ! ssh -o BatchMode=yes -o ConnectTimeout=5 -T "git@$host" 2>&1 | grep -qiE "successfully|you've authenticated|welcome|does not provide shell"; then
      echo "warning: ssh probe to git@$host did not respond as expected; continuing anyway" >&2
    fi
    ;;
esac

echo "  git: $git_version"
echo "  gateway:   $GATEWAY_DIR$([[ $SKIP_GATEWAY -eq 1 ]] && echo ' (existing)')"
echo "  satellite: $SATELLITE_DIR"
echo "  upstream:  ${REMOTE:-(skip-gateway: using existing)} · branch ${UPSTREAM_BRANCH:-(existing)}"
echo "  push-branch: $PUSH_BRANCH"
echo "  protect regex: $PROTECT"

# ------------------------------ Step 2 · Clone gateway ----------------
if [[ $SKIP_GATEWAY -eq 0 ]]; then
  step "Step 2/8 · Clone gateway from upstream"
  run "git clone --progress \"$REMOTE\" \"$GATEWAY_DIR\"" || exit 3
else
  step "Step 2/8 · Clone gateway · SKIPPED (--skip-gateway)"
fi

# ------------------------------ Step 3 · Configure gateway ------------
if [[ $SKIP_GATEWAY -eq 0 ]]; then
  step "Step 3/8 · Configure gateway (identity + branches)"
  run "cd \"$GATEWAY_DIR\" && git config user.email \"$EMAIL\"" || exit 4
  run "cd \"$GATEWAY_DIR\" && git config user.name \"$NAME\"" || exit 4
  run "cd \"$GATEWAY_DIR\" && git checkout -B \"$UPSTREAM_BRANCH\" \"origin/$UPSTREAM_BRANCH\"" || exit 4
  run "cd \"$GATEWAY_DIR\" && git checkout -b \"$PUSH_BRANCH\" \"$UPSTREAM_BRANCH\"" || exit 4
else
  step "Step 3/8 · Configure gateway · SKIPPED"
fi

# ------------------------------ Step 4 · Install pre-push hook --------
step "Step 4/8 · Install pre-push hook on gateway"
run "bash \"$SCRIPT_DIR/install-hooks.sh\" --repo=\"$GATEWAY_DIR\" --protect=\"$PROTECT\"$([[ $DRY_RUN -eq 1 ]] && echo ' --dry-run')" || exit 4

# ------------------------------ Step 5 · Clone satellite --------------
step "Step 5/8 · Clone satellite from gateway (local path · hardlinked .git/objects)"
run "git clone \"$GATEWAY_DIR\" \"$SATELLITE_DIR\"" || exit 3

# ------------------------------ Step 6 · Configure satellite ----------
step "Step 6/8 · Configure satellite (disable push, set identity, check out push-branch)"
run "cd \"$SATELLITE_DIR\" && git remote set-url --push origin DISABLED" || exit 4
run "cd \"$SATELLITE_DIR\" && git config user.email \"$EMAIL\"" || exit 4
run "cd \"$SATELLITE_DIR\" && git config user.name \"$NAME\"" || exit 4
run "cd \"$SATELLITE_DIR\" && git checkout \"$PUSH_BRANCH\"" || exit 4

# ------------------------------ Step 7 · Post-setup gates -------------
step "Step 7/8 · Post-setup · 3 safety gates"

if [[ $DRY_RUN -eq 1 ]]; then
  echo "  (dry-run · gates skipped)"
else
  # Gate A · satellite push must be rejected.
  if (cd "$SATELLITE_DIR" && git push 2>&1 | grep -qiE "DISABLED|does not accept|unable"); then
    echo "  ✓ Gate A · Protocol wall · satellite push rejected"
  else
    echo "  ✗ Gate A FAIL · satellite push was NOT rejected" >&2
    exit 5
  fi

  # Gate B · satellite push URL is the literal string DISABLED.
  actual_push="$(cd "$SATELLITE_DIR" && git remote get-url --push origin 2>&1 || true)"
  if echo "$actual_push" | grep -qi "DISABLED"; then
    echo "  ✓ Gate B · Explicit disable · satellite push URL = DISABLED"
  else
    echo "  ✗ Gate B FAIL · satellite push URL is '$actual_push'" >&2
    exit 5
  fi

  # Gate C · gateway pre-push to upstream branch must be rejected by the hook.
  if [[ $SKIP_GATEWAY -eq 0 ]]; then
    if (cd "$GATEWAY_DIR" && git push origin "$UPSTREAM_BRANCH" --dry-run 2>&1 | grep -qiE "REJECTED|protected|hook declined"); then
      echo "  ✓ Gate C · Pre-push hook · protected-branch push rejected"
    else
      echo "  ✗ Gate C FAIL · gateway hook did not reject push to '$UPSTREAM_BRANCH'" >&2
      echo "    (check: $GATEWAY_DIR/.git/hooks/pre-push exists + is executable)" >&2
      exit 5
    fi
  else
    echo "  · Gate C · skipped (--skip-gateway)"
  fi
fi

# ------------------------------ Step 8 · Summary ----------------------
step "Step 8/8 · Ready"
echo "  gateway   · $GATEWAY_DIR"
echo "  satellite · $SATELLITE_DIR"
echo ""
echo "  Gateway origin:   $(cd "$GATEWAY_DIR" 2>/dev/null && git remote get-url origin 2>/dev/null || echo '(dry-run)')"
echo "  Satellite origin: $(cd "$SATELLITE_DIR" 2>/dev/null && git remote get-url origin 2>/dev/null || echo '(dry-run)')"
echo "  Satellite push:   $(cd "$SATELLITE_DIR" 2>/dev/null && git remote get-url --push origin 2>/dev/null || echo '(dry-run)')"
echo ""
echo "  Next steps:"
echo "    1. edit code in gateway, commit on branch '$PUSH_BRANCH'"
echo "    2. run 'scripts/sync-satellite.sh --satellite-dir=$SATELLITE_DIR --mode=reset-hard' before each build"
echo "    3. build in satellite · your build commands (make / ninja / soong / etc.)"
echo "    4. push from gateway · 'git push origin $PUSH_BRANCH'"
echo "    5. raise MR/PR · $PUSH_BRANCH → $UPSTREAM_BRANCH on the hosting platform"
echo ""
echo "  See references/daily-workflow.md for the cheatsheet."

exit 0
