#!/usr/bin/env bash
# bootstrap.sh — one-shot build of a gated-dual-clone topology (2-clone or
# 3-clone with a reproducibility gate).
#
# Creates a gateway repo (push source) and a satellite repo (fetch-only build
# tree) for projects where the upstream integration branch is protected and
# builds are heavy. The satellite's origin points at the local gateway path,
# so a stray `git push` from the compile tree is physically unable to reach
# the remote.
#
# Optional 3rd clone: a clean-verify repo on a separate disk (typically HDD
# for hardware-diversity reproducibility · or a separate machine). Runs
# from-scratch full builds before every push, and the gateway pre-push hook
# refuses to push unless clean-verify has OK'd the exact commit.
#
# 创建 gateway + satellite 双 clone 拓扑(或 + clean-verify 第 3 仓,push 前
# reproducibility 关卡)。gateway 负责 push,satellite 只读编译。satellite 的
# origin 指向本地 gateway 路径,编译树无法触达远程。clean-verify 在异硬盘/
# 异机器从零全量编,编通过才允许 push。
#
# Usage:
#   bootstrap.sh --remote=<url> --upstream-branch=<name> --push-branch=<name> \
#                --gateway-dir=<path> --satellite-dir=<path> \
#                --user-email=<email> --user-name=<name> \
#                [--clean-verify-dir=<path>] \
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
CLEAN_VERIFY_DIR=""
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
    --clean-verify-dir=*) CLEAN_VERIFY_DIR="${a#*=}" ;;
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
CLEAN_VERIFY_DIR="${CLEAN_VERIFY_DIR/#\~/$HOME}"

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
if [[ -n "$CLEAN_VERIFY_DIR" ]]; then
  cv_parent="$(dirname "$CLEAN_VERIFY_DIR")"
  [[ -d "$cv_parent" && -w "$cv_parent" ]] || {
    echo "clean-verify parent '$cv_parent' missing or not writeable" >&2; exit 2; }
fi

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
[[ -n "$CLEAN_VERIFY_DIR" ]] && check_target "$CLEAN_VERIFY_DIR" "clean-verify-dir"

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
echo "  gateway:       $GATEWAY_DIR$([[ $SKIP_GATEWAY -eq 1 ]] && echo ' (existing)')"
echo "  satellite:     $SATELLITE_DIR"
[[ -n "$CLEAN_VERIFY_DIR" ]] && echo "  clean-verify:  $CLEAN_VERIFY_DIR"
echo "  upstream:      ${REMOTE:-(skip-gateway: using existing)} · branch ${UPSTREAM_BRANCH:-(existing)}"
echo "  push-branch:   $PUSH_BRANCH"
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
# --skip-gateway semantics = "don't touch the existing gateway". The hook is
# gateway state, so it must not be overwritten. We previously reused the
# install-hooks.sh call here, which with an empty UPSTREAM_BRANCH in
# --skip-gateway mode silently wrote a hook with PROTECT="^$" (matches
# nothing). Now explicitly skip.
if [[ $SKIP_GATEWAY -eq 0 ]]; then
  step "Step 4/8 · Install pre-push hook on gateway"
  enforce_cv_flag=""
  [[ -n "$CLEAN_VERIFY_DIR" ]] && enforce_cv_flag=" --enforce-clean-verify"
  run "bash \"$SCRIPT_DIR/install-hooks.sh\" --repo=\"$GATEWAY_DIR\" --protect=\"$PROTECT\"${enforce_cv_flag}$([[ $DRY_RUN -eq 1 ]] && echo ' --dry-run')" || exit 4
else
  step "Step 4/8 · Install pre-push hook · SKIPPED (--skip-gateway: gateway hook assumed already in place)"
fi

# ------------------------------ Step 5 · Clone satellite --------------
step "Step 5/8 · Clone satellite from gateway (local path · hardlinked .git/objects)"
run "git clone \"$GATEWAY_DIR\" \"$SATELLITE_DIR\"" || exit 3

# ------------------------------ Step 5b · Clone clean-verify (optional) -----
# The reproducibility gate. On a separate disk (typically HDD for hardware-
# diversity · catches SSD-cache / filesystem-specific build bugs) or on a
# separate machine. Clones from the local gateway (same as satellite) —
# NEVER from the upstream remote — so 'push the exact commit clean-verify
# OK'd' is a well-defined question.
if [[ -n "$CLEAN_VERIFY_DIR" ]]; then
  step "Step 5b · Clone clean-verify from gateway (local path · pre-push reproducibility gate)"
  run "git clone \"$GATEWAY_DIR\" \"$CLEAN_VERIFY_DIR\"" || exit 3
fi

# ------------------------------ Step 6 · Configure satellite ----------
step "Step 6/8 · Configure satellite (disable push, set identity, check out push-branch)"
run "cd \"$SATELLITE_DIR\" && git remote set-url --push origin DISABLED" || exit 4
run "cd \"$SATELLITE_DIR\" && git config user.email \"$EMAIL\"" || exit 4
run "cd \"$SATELLITE_DIR\" && git config user.name \"$NAME\"" || exit 4
run "cd \"$SATELLITE_DIR\" && git checkout \"$PUSH_BRANCH\"" || exit 4

# ------------------------------ Step 6b · Configure clean-verify ------
# Same hardening as satellite: origin push disabled. Plus an optional
# 'upstream' remote pointing at the real remote URL — for diagnostic-only
# fetch ability (never pushes from clean-verify · pushurl DISABLED too).
if [[ -n "$CLEAN_VERIFY_DIR" ]]; then
  step "Step 6b · Configure clean-verify (push DISABLED on both remotes, check out push-branch)"
  run "cd \"$CLEAN_VERIFY_DIR\" && git remote set-url --push origin DISABLED" || exit 4
  run "cd \"$CLEAN_VERIFY_DIR\" && git config user.email \"$EMAIL\"" || exit 4
  run "cd \"$CLEAN_VERIFY_DIR\" && git config user.name \"$NAME\"" || exit 4
  run "cd \"$CLEAN_VERIFY_DIR\" && git checkout \"$PUSH_BRANCH\"" || exit 4
  # Add diagnostic upstream remote with push DISABLED. If REMOTE is unset
  # (--skip-gateway with a gateway that has its own origin), pull it from
  # the gateway's origin config.
  eff_remote="$REMOTE"
  if [[ -z "$eff_remote" ]]; then
    eff_remote="$(cd "$GATEWAY_DIR" && git remote get-url origin 2>/dev/null || echo '')"
  fi
  if [[ -n "$eff_remote" ]]; then
    run "cd \"$CLEAN_VERIFY_DIR\" && git remote add upstream \"$eff_remote\"" || true
    run "cd \"$CLEAN_VERIFY_DIR\" && git remote set-url --push upstream DISABLED" || true
  fi
fi

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

  # Gate C · gateway pre-push hook must reject protected-branch push. We
  # invoke the hook script directly with synthetic stdin — git's own
  # --dry-run short-circuits with "Everything up-to-date" when local = remote
  # and never runs the hook. Testing the hook's logic directly is the
  # reliable approach.
  if [[ $SKIP_GATEWAY -eq 0 ]]; then
    hook_path="$GATEWAY_DIR/.git/hooks/pre-push"
    if [[ -x "$hook_path" ]]; then
      # Synthetic stdin: pretend we're pushing <upstream-branch> ref
      # (format: local_ref local_sha remote_ref remote_sha per githooks docs).
      hook_out="$(printf 'refs/heads/%s 1111 refs/heads/%s 0000\n' "$UPSTREAM_BRANCH" "$UPSTREAM_BRANCH" | bash "$hook_path" origin "$GATEWAY_DIR" 2>&1 || true)"
      if echo "$hook_out" | grep -qiE "REJECTED|protected"; then
        echo "  ✓ Gate C · Pre-push hook · protected-branch push rejected"
      else
        echo "  ✗ Gate C FAIL · hook did not reject synthetic push to '$UPSTREAM_BRANCH'" >&2
        echo "    hook output: $(echo "$hook_out" | head -3 | tr '\n' ' / ')" >&2
        exit 5
      fi
    else
      echo "  ✗ Gate C FAIL · pre-push hook missing or not executable at $hook_path" >&2
      exit 5
    fi
  else
    echo "  · Gate C · skipped (--skip-gateway)"
  fi

  # Gate D · clean-verify push URLs (origin + upstream if present) must be
  # the literal DISABLED. Only runs when --clean-verify-dir was provided.
  if [[ -n "$CLEAN_VERIFY_DIR" ]]; then
    cv_ok=1
    cv_origin_push="$(cd "$CLEAN_VERIFY_DIR" && git remote get-url --push origin 2>&1 || true)"
    if ! echo "$cv_origin_push" | grep -qi "DISABLED"; then
      echo "  ✗ Gate D FAIL · clean-verify origin push URL is '$cv_origin_push'" >&2
      cv_ok=0
    fi
    if (cd "$CLEAN_VERIFY_DIR" && git remote | grep -qx upstream); then
      cv_up_push="$(cd "$CLEAN_VERIFY_DIR" && git remote get-url --push upstream 2>&1 || true)"
      if ! echo "$cv_up_push" | grep -qi "DISABLED"; then
        echo "  ✗ Gate D FAIL · clean-verify upstream push URL is '$cv_up_push'" >&2
        cv_ok=0
      fi
    fi
    if [[ $cv_ok -eq 1 ]]; then
      echo "  ✓ Gate D · Clean-verify push URLs = DISABLED (origin$(cd "$CLEAN_VERIFY_DIR" && git remote | grep -qx upstream && echo ' + upstream'))"
    else
      exit 5
    fi
  fi
fi

# ------------------------------ Step 8 · Summary ----------------------
step "Step 8/8 · Ready"
echo "  gateway      · $GATEWAY_DIR"
echo "  satellite    · $SATELLITE_DIR"
[[ -n "$CLEAN_VERIFY_DIR" ]] && echo "  clean-verify · $CLEAN_VERIFY_DIR"
echo ""
echo "  Gateway origin:     $(cd "$GATEWAY_DIR" 2>/dev/null && git remote get-url origin 2>/dev/null || echo '(dry-run)')"
echo "  Satellite origin:   $(cd "$SATELLITE_DIR" 2>/dev/null && git remote get-url origin 2>/dev/null || echo '(dry-run)')"
echo "  Satellite push:     $(cd "$SATELLITE_DIR" 2>/dev/null && git remote get-url --push origin 2>/dev/null || echo '(dry-run)')"
if [[ -n "$CLEAN_VERIFY_DIR" ]]; then
  echo "  Clean-verify origin:  $(cd "$CLEAN_VERIFY_DIR" 2>/dev/null && git remote get-url origin 2>/dev/null || echo '(dry-run)')"
  echo "  Clean-verify push:    $(cd "$CLEAN_VERIFY_DIR" 2>/dev/null && git remote get-url --push origin 2>/dev/null || echo '(dry-run)')"
fi
echo ""
echo "  Next steps:"
echo "    1. edit code in gateway, commit on branch '$PUSH_BRANCH'"
echo "    2. run 'scripts/sync-satellite.sh --satellite-dir=$SATELLITE_DIR --mode=reset-hard' before each build"
echo "    3. build in satellite · your build commands (make / ninja / soong / etc.)"
if [[ -n "$CLEAN_VERIFY_DIR" ]]; then
  echo "    4. before each push · run clean-verify gate:"
  echo "         scripts/clean-verify-run.sh \\"
  echo "           --gateway-dir=$GATEWAY_DIR \\"
  echo "           --clean-verify-dir=$CLEAN_VERIFY_DIR \\"
  echo "           --push-branch=$PUSH_BRANCH \\"
  echo "           --build-cmd='<your full-build command>'"
  echo "    5. if clean-verify passes · push from gateway · 'git push origin $PUSH_BRANCH'"
  echo "    6. raise MR/PR · $PUSH_BRANCH → $UPSTREAM_BRANCH on the hosting platform"
else
  echo "    4. push from gateway · 'git push origin $PUSH_BRANCH'"
  echo "    5. raise MR/PR · $PUSH_BRANCH → $UPSTREAM_BRANCH on the hosting platform"
fi
echo ""
echo "  See references/daily-workflow.md for the cheatsheet."

exit 0
