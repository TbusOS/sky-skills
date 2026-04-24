#!/usr/bin/env bash
# clean-verify-run.sh — the pre-push reproducibility gate for a 3-clone
# gated-dual-clone topology.
#
# Flow:
#   1. Sync clean-verify from gateway (fetch + reset --hard origin/<branch>).
#   2. git clean -fdx   — drop every file not under version control, so the
#      build runs against a bit-exact replica of the gateway's HEAD.
#   3. Run the user-supplied --build-cmd end-to-end.
#   4. On success, write a verification stamp to
#      gateway/.git/last-clean-verify containing:
#          <commit-sha>  <ISO-8601 timestamp>  <sha256 of build cmd>
#      The pre-push hook (install-hooks.sh --enforce-clean-verify) reads
#      this stamp and refuses to push any commit whose sha doesn't match.
#   5. On failure, NOTHING is written — the push stays blocked.
#
# 3 仓拓扑的 push 前 reproducibility 关卡。sync + git clean -fdx + 全量编;
# 编通过才在 gateway/.git/last-clean-verify 写入 <sha> <ts> <cmd-hash>。
# pre-push hook 读这文件 · commit 不匹配就拒推。
#
# Usage:
#   clean-verify-run.sh --gateway-dir=<path> --clean-verify-dir=<path> \
#                       --push-branch=<name> --build-cmd='<full build cmd>' \
#                       [--no-clean] [--yes] [--dry-run]
#
# Exit codes:
#   0 build passed · stamp written
#   1 bad CLI
#   2 sync failed
#   3 build failed (stamp NOT written · pre-push will stay blocked)
#   4 stamp write failed

set -eu

# ------------------------------ Defaults -----------------------------
GATEWAY_DIR=""
CLEAN_VERIFY_DIR=""
PUSH_BRANCH=""
BUILD_CMD=""
NO_CLEAN=0
YES=0
DRY_RUN=0

usage() {
  sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

for a in "$@"; do
  case "$a" in
    --gateway-dir=*)        GATEWAY_DIR="${a#*=}" ;;
    --clean-verify-dir=*)   CLEAN_VERIFY_DIR="${a#*=}" ;;
    --push-branch=*)        PUSH_BRANCH="${a#*=}" ;;
    --build-cmd=*)          BUILD_CMD="${a#*=}" ;;
    --no-clean)             NO_CLEAN=1 ;;
    --yes)                  YES=1 ;;
    --dry-run)              DRY_RUN=1 ;;
    -h|--help)              usage 0 ;;
    *)                      echo "unknown flag: $a" >&2; usage 1 ;;
  esac
done

# ------------------------------ Required -----------------------------
missing=""
[[ -z "$GATEWAY_DIR"      ]] && missing="$missing --gateway-dir"
[[ -z "$CLEAN_VERIFY_DIR" ]] && missing="$missing --clean-verify-dir"
[[ -z "$PUSH_BRANCH"      ]] && missing="$missing --push-branch"
[[ -z "$BUILD_CMD"        ]] && missing="$missing --build-cmd"
if [[ -n "$missing" ]]; then
  echo "missing required:$missing" >&2
  echo "run with --help" >&2
  exit 1
fi

GATEWAY_DIR="${GATEWAY_DIR/#\~/$HOME}"
CLEAN_VERIFY_DIR="${CLEAN_VERIFY_DIR/#\~/$HOME}"

[[ -d "$GATEWAY_DIR/.git" ]]      || { echo "gateway is not a git repo: $GATEWAY_DIR" >&2; exit 1; }
[[ -d "$CLEAN_VERIFY_DIR/.git" ]] || { echo "clean-verify is not a git repo: $CLEAN_VERIFY_DIR" >&2; exit 1; }

# ------------------------------ Banner -------------------------------
echo "━━ clean-verify-run ━━"
echo "  gateway:       $GATEWAY_DIR"
echo "  clean-verify:  $CLEAN_VERIFY_DIR"
echo "  push-branch:   $PUSH_BRANCH"
echo "  build-cmd:     $BUILD_CMD"
[[ $NO_CLEAN -eq 1 ]] && echo "  (--no-clean · skipping git clean -fdx — NOT a reproducibility-safe run)"
[[ $DRY_RUN -eq 1 ]] && echo "  (--dry-run · no actual work)"
echo ""

# ------------------------------ Confirm -----------------------------
if [[ $YES -eq 0 && $DRY_RUN -eq 0 ]]; then
  echo "This will:" >&2
  echo "  (1) fetch + reset --hard in $CLEAN_VERIFY_DIR to gateway's $PUSH_BRANCH" >&2
  [[ $NO_CLEAN -eq 0 ]] && echo "  (2) git clean -fdx in $CLEAN_VERIFY_DIR (DROPS build artefacts + untracked files)" >&2
  echo "  (3) run: $BUILD_CMD" >&2
  echo "  (4) on success · write verification stamp to $GATEWAY_DIR/.git/last-clean-verify" >&2
  echo "" >&2
  echo "Pass --yes to proceed, or Ctrl-C to abort." >&2
  exit 1
fi

run() {
  if [[ $DRY_RUN -eq 1 ]]; then
    printf '    %s\n' "$*"
  else
    eval "$@"
  fi
}

# ------------------------------ Step 1 · Sync from gateway ----------
echo "━━ Step 1/4 · Sync clean-verify from gateway ($PUSH_BRANCH)"
run "cd \"$CLEAN_VERIFY_DIR\" && git fetch origin \"$PUSH_BRANCH\"" || { echo "fetch failed" >&2; exit 2; }
run "cd \"$CLEAN_VERIFY_DIR\" && git reset --hard \"origin/$PUSH_BRANCH\"" || { echo "reset --hard failed" >&2; exit 2; }

# Capture the commit sha we're about to verify.
if [[ $DRY_RUN -eq 1 ]]; then
  verified_sha="DRYRUN0000000000000000000000000000000000"
else
  verified_sha="$(cd "$CLEAN_VERIFY_DIR" && git rev-parse HEAD)"
fi
echo "  verifying commit: $verified_sha"

# ------------------------------ Step 2 · git clean -fdx -------------
if [[ $NO_CLEAN -eq 0 ]]; then
  echo ""
  echo "━━ Step 2/4 · git clean -fdx (drop every untracked + ignored file)"
  run "cd \"$CLEAN_VERIFY_DIR\" && git clean -fdx" || { echo "git clean failed" >&2; exit 2; }
else
  echo ""
  echo "━━ Step 2/4 · git clean · SKIPPED (--no-clean)"
fi

# ------------------------------ Step 3 · Build ----------------------
echo ""
echo "━━ Step 3/4 · Build"
build_start="$(date +%s)"
build_ok=1
if [[ $DRY_RUN -eq 1 ]]; then
  printf '    (cd %s && %s)\n' "$CLEAN_VERIFY_DIR" "$BUILD_CMD"
else
  (cd "$CLEAN_VERIFY_DIR" && bash -c "$BUILD_CMD") || build_ok=0
fi
build_end="$(date +%s)"
build_dur=$((build_end - build_start))

if [[ $build_ok -eq 0 ]]; then
  echo ""
  echo "✗ BUILD FAILED after ${build_dur}s · verification stamp NOT written" >&2
  echo "  fix the build, re-run clean-verify-run.sh, then push." >&2
  exit 3
fi
echo "  build ok · ${build_dur}s"

# ------------------------------ Step 4 · Stamp -----------------------
echo ""
echo "━━ Step 4/4 · Write verification stamp"
stamp_path="$GATEWAY_DIR/.git/last-clean-verify"
cmd_hash="$(printf '%s' "$BUILD_CMD" | sha256sum | awk '{print $1}')"
stamp_line="$verified_sha $(date -u +%Y-%m-%dT%H:%M:%SZ) $cmd_hash"

if [[ $DRY_RUN -eq 1 ]]; then
  echo "    would write: $stamp_path"
  echo "    line: $stamp_line"
else
  if echo "$stamp_line" > "$stamp_path"; then
    echo "  wrote $stamp_path"
    echo "  line: $stamp_line"
  else
    echo "✗ failed to write $stamp_path" >&2
    exit 4
  fi
fi

echo ""
echo "✓ clean-verify PASS · gateway may now push commit $verified_sha"
echo "  (pre-push hook will compare against this stamp)"
exit 0
