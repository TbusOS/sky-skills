#!/usr/bin/env bash
# install-hooks.sh — write a pre-push hook on the gateway repo that:
#   (1) rejects pushes to protected branches
#   (2) optionally refuses to push any commit that hasn't been OK'd by
#       clean-verify-run.sh (3-clone topology · reproducibility gate)
#
# The hook is a client-side advisory layer — see SKILL.md "Safety model"
# on why server-side protection is still needed.
#
# Usage:
#   install-hooks.sh --repo=<gateway-dir> [--protect=<regex>] \
#                    [--enforce-clean-verify] [--dry-run]
#
# --protect default: '^(main|master)$'
# --enforce-clean-verify: add a second gate that reads
#     .git/last-clean-verify and rejects pushes whose HEAD sha doesn't
#     match the stamped commit. Can be bypassed per-push with
#     `git push --push-option=allow-unverified` (for paper-cut scenarios
#     where clean-verify is known to have passed but the stamp is stale).

set -eu

REPO=""
PROTECT='^(main|master)$'
DRY_RUN=0
ENFORCE_CLEAN_VERIFY=0

for a in "$@"; do
  case "$a" in
    --repo=*)               REPO="${a#*=}" ;;
    --protect=*)            PROTECT="${a#*=}" ;;
    --enforce-clean-verify) ENFORCE_CLEAN_VERIFY=1 ;;
    --dry-run)              DRY_RUN=1 ;;
    -h|--help)              sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)                      echo "unknown flag: $a" >&2; exit 1 ;;
  esac
done

REPO="${REPO/#\~/$HOME}"

[[ -n "$REPO" ]] || { echo "--repo=<path> required" >&2; exit 1; }
[[ -d "$REPO/.git" ]] || { echo "$REPO is not a git repo (.git missing)" >&2; exit 1; }

HOOK_PATH="$REPO/.git/hooks/pre-push"

# Hook body. The regex + enforcement flag are substituted in at install
# time so the hook file is self-contained — no external dependencies, no
# env vars read at push time.
HOOK_BODY="$(cat <<'EOF'
#!/usr/bin/env bash
# pre-push hook · installed by sky-skills/gated-dual-clone/install-hooks.sh
# Gate 1 · rejects pushes to any branch matching the protected regex.
# Gate 2 · (optional) rejects any commit that hasn't been OK'd by
#          clean-verify-run.sh (stamp file .git/last-clean-verify must
#          match the commit being pushed).
#
# CAVEAT: client-side hooks are advisory. --no-verify bypasses them.
# Real protection = server-side protected-branch rules (GitLab / GitHub / Gerrit).

set -e
protected='__PROTECT__'
enforce_cv='__ENFORCE_CV__'
git_dir="$(git rev-parse --git-dir 2>/dev/null || echo '.git')"

while read -r local_ref local_sha remote_ref remote_sha; do
  branch="${remote_ref#refs/heads/}"

  # Gate 1 · protected-branch push
  if [[ "$branch" =~ $protected ]]; then
    echo "=========================================" >&2
    echo "REJECTED: push to protected branch '$branch'" >&2
    echo "  Use MR/PR flow instead — push to your" >&2
    echo "  personal branch and raise a merge request." >&2
    echo "  Hook: $git_dir/hooks/pre-push (installed by" >&2
    echo "  sky-skills/gated-dual-clone)" >&2
    echo "=========================================" >&2
    exit 1
  fi

  # Gate 2 · clean-verify reproducibility stamp
  if [[ "$enforce_cv" == "1" && "$local_sha" != "0000000000000000000000000000000000000000" ]]; then
    # Allow per-push bypass via `git push --push-option=allow-unverified`.
    # GIT_PUSH_OPTION_COUNT / GIT_PUSH_OPTION_0 ... are set by git when
    # -o / --push-option is used.
    bypass=0
    count="${GIT_PUSH_OPTION_COUNT:-0}"
    for i in $(seq 0 $((count - 1))); do
      var="GIT_PUSH_OPTION_$i"
      val="${!var:-}"
      [[ "$val" == "allow-unverified" ]] && bypass=1
    done

    if [[ $bypass -eq 1 ]]; then
      echo "  [warn] clean-verify gate bypassed via --push-option=allow-unverified" >&2
      continue
    fi

    stamp="$git_dir/last-clean-verify"
    if [[ ! -r "$stamp" ]]; then
      echo "=========================================" >&2
      echo "REJECTED: clean-verify gate active but no stamp file at" >&2
      echo "  $stamp" >&2
      echo "Run clean-verify-run.sh first, or push with" >&2
      echo "  git push --push-option=allow-unverified" >&2
      echo "=========================================" >&2
      exit 1
    fi
    stamped_sha="$(awk '{print $1}' "$stamp")"
    if [[ "$stamped_sha" != "$local_sha" ]]; then
      echo "=========================================" >&2
      echo "REJECTED: clean-verify stamp doesn't match commit to push." >&2
      echo "  stamped : $stamped_sha" >&2
      echo "  pushing : $local_sha" >&2
      echo "" >&2
      echo "Re-run clean-verify-run.sh against the current HEAD," >&2
      echo "or push with --push-option=allow-unverified (emergency only)." >&2
      echo "=========================================" >&2
      exit 1
    fi
    echo "  [ok] clean-verify stamp matches · $stamped_sha" >&2
  fi
done
exit 0
EOF
)"

# Substitute the regex + enforcement flag into the hook body.
HOOK_BODY="${HOOK_BODY//__PROTECT__/$PROTECT}"
HOOK_BODY="${HOOK_BODY//__ENFORCE_CV__/$ENFORCE_CLEAN_VERIFY}"

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

cv_note=""
[[ $ENFORCE_CLEAN_VERIFY -eq 1 ]] && cv_note=" · clean-verify gate: ON"
echo "installed: $HOOK_PATH  (protect regex: $PROTECT$cv_note)"
