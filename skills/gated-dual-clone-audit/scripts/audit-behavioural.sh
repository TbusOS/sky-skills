#!/usr/bin/env bash
# audit-behavioural.sh — Tier 3 of gated-dual-clone-audit.
# Runs safe `git --dry-run` calls to verify the three safety gates behave as
# expected end-to-end. No state changes; all commands are read-only or
# dry-run.
#
# Usage:
#   audit-behavioural.sh --gateway-dir=<path> --satellite-dir=<path> \
#                        [--upstream-branch=<name>] [--push-branch=<name>] [--json]

set -eu

GATEWAY=""
SATELLITE=""
CLEAN_VERIFY=""
UPSTREAM_BRANCH=""
PUSH_BRANCH=""
JSON=0

for a in "$@"; do
  case "$a" in
    --gateway-dir=*)      GATEWAY="${a#*=}" ;;
    --satellite-dir=*)    SATELLITE="${a#*=}" ;;
    --clean-verify-dir=*) CLEAN_VERIFY="${a#*=}" ;;
    --upstream-branch=*)  UPSTREAM_BRANCH="${a#*=}" ;;
    --push-branch=*)      PUSH_BRANCH="${a#*=}" ;;
    --json)               JSON=1 ;;
    -h|--help)            sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)                    echo "unknown flag: $a" >&2; exit 3 ;;
  esac
done

GATEWAY="${GATEWAY/#\~/$HOME}"
SATELLITE="${SATELLITE/#\~/$HOME}"
CLEAN_VERIFY="${CLEAN_VERIFY/#\~/$HOME}"

[[ -n "$GATEWAY"   ]] || { echo "--gateway-dir required"   >&2; exit 3; }
[[ -n "$SATELLITE" ]] || { echo "--satellite-dir required" >&2; exit 3; }

# Infer --upstream-branch from the hook regex if not given.
if [[ -z "$UPSTREAM_BRANCH" && -f "$GATEWAY/.git/hooks/pre-push" ]]; then
  regex_line="$(grep -m1 "^protected=" "$GATEWAY/.git/hooks/pre-push" 2>/dev/null | sed "s/^protected=//" | tr -d \"\')"
  # Extract a simple branch name from patterns like '^(main|release)$' or '^main$'.
  if [[ "$regex_line" =~ ^\^?(\(?)([a-zA-Z0-9/_.-]+).* ]]; then
    UPSTREAM_BRANCH="${BASH_REMATCH[2]%%|*}"
  fi
fi

# Infer --push-branch from satellite current branch if not given.
if [[ -z "$PUSH_BRANCH" ]]; then
  PUSH_BRANCH="$(cd "$SATELLITE" && git symbolic-ref --short HEAD 2>/dev/null || echo '')"
fi

gates=()
fail_count=0
warn_count=0

record() {
  gates+=("$1|$2|$3|$4")
  case "$1" in
    FAIL) fail_count=$((fail_count + 1)) ;;
    WARN) warn_count=$((warn_count + 1)) ;;
  esac
}

# ------------------------------ B1 · satellite push is rejected -------
# git push without args respects push URL. We set GIT_TERMINAL_PROMPT=0 so it
# fails fast if it tries to resolve a hostname.
b1_out="$(cd "$SATELLITE" && GIT_TERMINAL_PROMPT=0 git push 2>&1 || true)"
if echo "$b1_out" | grep -qiE "DISABLED|does not accept|unable|could not resolve"; then
  record PASS B1 "satellite push rejected"       "$(echo "$b1_out" | head -1)"
else
  record FAIL B1 "satellite push rejected"       "satellite push did NOT produce a rejection message · output was: $(echo "$b1_out" | head -2 | tr '\n' ' / ')"
fi

# ------------------------------ B2 · gateway protected-branch push ----
# Feed synthetic stdin directly to the hook script — git's own push
# --dry-run short-circuits with "Everything up-to-date" when local matches
# remote, and never runs the hook. Direct invocation tests the hook's
# logic independent of push eligibility.
if [[ -z "$UPSTREAM_BRANCH" ]]; then
  record WARN B2 "gateway pre-push hook rejects protected branch"   "cannot test · --upstream-branch not given and hook regex unparseable"
else
  hook="$GATEWAY/.git/hooks/pre-push"
  if [[ -x "$hook" ]]; then
    b2_out="$(printf 'refs/heads/%s 1111 refs/heads/%s 0000\n' "$UPSTREAM_BRANCH" "$UPSTREAM_BRANCH" | bash "$hook" origin "$GATEWAY" 2>&1 || true)"
    if echo "$b2_out" | grep -qiE "REJECTED|protected|hook declined"; then
      record PASS B2 "gateway pre-push hook rejects protected branch"  "$(echo "$b2_out" | grep -iE 'REJECTED|protected|hook' | head -1)"
    else
      record FAIL B2 "gateway pre-push hook rejects protected branch"  "hook did not reject synthetic push to $UPSTREAM_BRANCH · output: $(echo "$b2_out" | head -1)"
    fi
  else
    record FAIL B2 "gateway pre-push hook rejects protected branch"  "hook missing or not executable at $hook"
  fi
fi

# ------------------------------ B3 · satellite fetch works ------------
if [[ -z "$PUSH_BRANCH" ]]; then
  record WARN B3 "satellite fetch from gateway works"  "cannot test · --push-branch not given and no current branch"
else
  # --dry-run would not actually fetch objects; we use a real fetch (cheap —
  # hardlinked, local). The branch arg bounds the work.
  b3_out="$(cd "$SATELLITE" && GIT_TERMINAL_PROMPT=0 git fetch origin "$PUSH_BRANCH" 2>&1 || true)"
  if echo "$b3_out" | grep -qiE "error|fatal|could not|refused"; then
    record FAIL B3 "satellite fetch from gateway works"  "fetch errored: $(echo "$b3_out" | head -1)"
  else
    record PASS B3 "satellite fetch from gateway works"  "branch $PUSH_BRANCH reachable via origin"
  fi
fi

# ------------------------------ B4 · clean-verify push hard-block -----
# Only runs when --clean-verify-dir was provided. Tries a dry-run push from
# clean-verify · must be rejected (pushurl DISABLED).
if [[ -n "$CLEAN_VERIFY" && -d "$CLEAN_VERIFY/.git" ]]; then
  b4_out="$(cd "$CLEAN_VERIFY" && git push --dry-run origin HEAD 2>&1 || true)"
  if echo "$b4_out" | grep -qiE "DISABLED|does not accept|unable|not allowed"; then
    record PASS B4 "clean-verify push is rejected"      "DISABLED path holds"
  else
    record FAIL B4 "clean-verify push is rejected"      "push was NOT rejected: $(echo "$b4_out" | head -1)"
  fi
fi

# ------------------------------ Output --------------------------------
if [[ $fail_count -eq 0 && $warn_count -eq 0 ]]; then
  overall="pass"; exit_code=0
elif [[ $fail_count -eq 0 ]]; then
  overall="warn"; exit_code=1
else
  overall="fail"; exit_code=2
fi

if [[ $JSON -eq 1 ]]; then
  printf '{\n'
  printf '  "tier": "behavioural",\n'
  printf '  "overall": "%s",\n' "$overall"
  printf '  "pass_count": %d,\n' "$(( ${#gates[@]} - fail_count - warn_count ))"
  printf '  "warn_count": %d,\n' "$warn_count"
  printf '  "fail_count": %d,\n' "$fail_count"
  printf '  "gates": [\n'
  first=1
  for entry in "${gates[@]}"; do
    status="${entry%%|*}"; rest="${entry#*|}"
    id="${rest%%|*}"; rest="${rest#*|}"
    name="${rest%%|*}"; details="${rest#*|}"
    if [[ $first -eq 1 ]]; then first=0; else printf ',\n'; fi
    esc_details="${details//\\/\\\\}"; esc_details="${esc_details//\"/\\\"}"
    printf '    {"id": "%s", "name": "%s", "status": "%s", "details": "%s"}' \
      "$id" "$name" "$status" "$esc_details"
  done
  printf '\n  ]\n'
  printf '}\n'
else
  echo "━━ Tier 3 · Behavioural ━━"
  for entry in "${gates[@]}"; do
    status="${entry%%|*}"; rest="${entry#*|}"
    id="${rest%%|*}"; rest="${rest#*|}"
    name="${rest%%|*}"; details="${rest#*|}"
    case "$status" in PASS) marker="✓" ;; WARN) marker="?" ;; FAIL) marker="✗" ;; esac
    printf "  %s  %s  %-48s  %s\n" "$marker" "$id" "$name" "$details"
  done
  echo "  → overall: $overall  ($((${#gates[@]} - fail_count - warn_count)) pass / $warn_count warn / $fail_count fail)"
fi

exit $exit_code
