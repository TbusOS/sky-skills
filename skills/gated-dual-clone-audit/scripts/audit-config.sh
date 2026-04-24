#!/usr/bin/env bash
# audit-config.sh — Tier 2 of gated-dual-clone-audit.
# Inspects git config on gateway + satellite. Assumes Tier 1 passed (both
# are valid git repos).
#
# Usage:
#   audit-config.sh --gateway-dir=<path> --satellite-dir=<path> \
#                   [--push-branch=<name>] [--json]

set -eu

GATEWAY=""
SATELLITE=""
CLEAN_VERIFY=""
PUSH_BRANCH=""
JSON=0

for a in "$@"; do
  case "$a" in
    --gateway-dir=*)      GATEWAY="${a#*=}" ;;
    --satellite-dir=*)    SATELLITE="${a#*=}" ;;
    --clean-verify-dir=*) CLEAN_VERIFY="${a#*=}" ;;
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

# Helper · read a git config value from a repo, empty if missing.
gconfig() {
  local repo="$1" key="$2"
  (cd "$repo" && git config --local --get "$key" 2>/dev/null) || echo ""
}

# ------------------------------ C1 · satellite origin -----------------
sat_origin="$(gconfig "$SATELLITE" remote.origin.url)"
if [[ -z "$sat_origin" ]]; then
  record FAIL C1 "satellite origin URL set"    "remote.origin.url is empty"
else
  # Accept: file://<gateway-path>, or an absolute local path that equals gateway.
  # Resolve symlinks for comparison.
  gw_real="$(cd "$GATEWAY" 2>/dev/null && pwd -P)" || gw_real="$GATEWAY"
  sat_target=""
  case "$sat_origin" in
    file://*)  sat_target="${sat_origin#file://}" ;;
    /*)        sat_target="$sat_origin" ;;
    *)         sat_target="$sat_origin" ;;
  esac
  sat_target_real="$(cd "$sat_target" 2>/dev/null && pwd -P)" || sat_target_real="$sat_target"
  # Allow a trailing '/.git' — that's how `git clone <path>` records it.
  sat_target_real="${sat_target_real%/.git}"
  if [[ "$sat_target_real" == "$gw_real" ]]; then
    record PASS C1 "satellite origin URL points at gateway"  "$sat_origin"
  else
    record FAIL C1 "satellite origin URL points at gateway"  "origin=$sat_origin · expected $gw_real (resolved: $sat_target_real)"
  fi
fi

# ------------------------------ C2 · satellite push URL disabled ------
sat_pushurl="$(gconfig "$SATELLITE" remote.origin.pushurl)"
if [[ "$sat_pushurl" == "DISABLED" ]]; then
  record PASS C2 "satellite push URL = DISABLED"    "exact match"
elif [[ -z "$sat_pushurl" ]]; then
  record FAIL C2 "satellite push URL = DISABLED"    "pushurl is unset — satellite may accidentally push to gateway"
else
  record FAIL C2 "satellite push URL = DISABLED"    "pushurl = '$sat_pushurl' (should be 'DISABLED')"
fi

# ------------------------------ C3 · gateway origin URL ---------------
gw_origin="$(gconfig "$GATEWAY" remote.origin.url)"
if [[ -n "$gw_origin" ]]; then
  record PASS C3 "gateway origin URL set"      "$gw_origin"
else
  record FAIL C3 "gateway origin URL set"      "remote.origin.url is empty — gateway has no upstream"
fi

# ------------------------------ C4–C7 · identities --------------------
for side in gateway satellite; do
  repo_var="${side^^}"
  dir="${!repo_var}"
  email="$(gconfig "$dir" user.email)"
  name="$(gconfig "$dir" user.name)"
  if [[ "$side" == "gateway" ]]; then c_email="C4"; c_name="C5"; else c_email="C6"; c_name="C7"; fi
  if [[ -n "$email" ]]; then
    record PASS "$c_email" "$side user.email set locally"   "$email"
  else
    record WARN "$c_email" "$side user.email set locally"   "unset — falling back to global git config (may not match project rules)"
  fi
  if [[ -n "$name" ]]; then
    record PASS "$c_name" "$side user.name set locally"     "$name"
  else
    record WARN "$c_name" "$side user.name set locally"     "unset — falling back to global git config"
  fi
done

# ------------------------------ C8 · satellite current branch ---------
sat_head="$(cd "$SATELLITE" && git symbolic-ref --short HEAD 2>/dev/null || echo "")"
if [[ -z "$sat_head" ]]; then
  record WARN C8 "satellite on a named branch"          "HEAD is detached — not inherently wrong but unusual for a build tree"
elif [[ -n "$PUSH_BRANCH" ]]; then
  if [[ "$sat_head" == "$PUSH_BRANCH" ]]; then
    record PASS C8 "satellite on expected push-branch"    "$sat_head"
  else
    record WARN C8 "satellite on expected push-branch"    "current=$sat_head · expected=$PUSH_BRANCH"
  fi
else
  record PASS C8 "satellite on a named branch"            "$sat_head (no --push-branch given to check against)"
fi

# ------------------------------ C9 · clean-verify config (optional) --
# Runs only when --clean-verify-dir was provided.
if [[ -n "$CLEAN_VERIFY" && -d "$CLEAN_VERIFY/.git" ]]; then
  cv_origin="$(gconfig "$CLEAN_VERIFY" remote.origin.url)"
  cv_origin_push="$(cd "$CLEAN_VERIFY" && git remote get-url --push origin 2>/dev/null || echo '')"

  # C9a · origin points at gateway (local path, not the real remote)
  if [[ -z "$cv_origin" ]]; then
    record FAIL C9a "clean-verify origin URL set"      "remote.origin.url is empty"
  else
    gw_real="$(cd "$GATEWAY" 2>/dev/null && pwd -P)" || gw_real="$GATEWAY"
    cv_target=""
    case "$cv_origin" in
      file://*)  cv_target="${cv_origin#file://}" ;;
      /*)        cv_target="$cv_origin" ;;
      *)         cv_target="$cv_origin" ;;
    esac
    cv_target_real="$(cd "$cv_target" 2>/dev/null && pwd -P)" || cv_target_real="$cv_target"
    cv_target_real="${cv_target_real%/.git}"
    if [[ "$cv_target_real" == "$gw_real" ]]; then
      record PASS C9a "clean-verify origin at gateway"  "$cv_origin"
    else
      record FAIL C9a "clean-verify origin at gateway"  "expected gateway path ($gw_real), got $cv_origin — reproducibility gate only makes sense if clean-verify fetches from gateway, not upstream"
    fi
  fi

  # C9b · origin pushurl DISABLED
  if echo "$cv_origin_push" | grep -qi "DISABLED"; then
    record PASS C9b "clean-verify origin push = DISABLED" "$cv_origin_push"
  else
    record FAIL C9b "clean-verify origin push = DISABLED" "pushurl is '$cv_origin_push' — set-url --push DISABLED to make unreachable"
  fi

  # C9c · upstream remote (if present) pushurl DISABLED too
  if (cd "$CLEAN_VERIFY" && git remote | grep -qx upstream); then
    cv_up_push="$(cd "$CLEAN_VERIFY" && git remote get-url --push upstream 2>/dev/null || echo '')"
    if echo "$cv_up_push" | grep -qi "DISABLED"; then
      record PASS C9c "clean-verify upstream push = DISABLED" "$cv_up_push"
    else
      record FAIL C9c "clean-verify upstream push = DISABLED" "upstream pushurl is '$cv_up_push' — clean-verify must never push"
    fi
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
  printf '  "tier": "config",\n'
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
  echo "━━ Tier 2 · Configuration ━━"
  for entry in "${gates[@]}"; do
    status="${entry%%|*}"; rest="${entry#*|}"
    id="${rest%%|*}"; rest="${rest#*|}"
    name="${rest%%|*}"; details="${rest#*|}"
    case "$status" in PASS) marker="✓" ;; WARN) marker="?" ;; FAIL) marker="✗" ;; esac
    printf "  %s  %s  %-42s  %s\n" "$marker" "$id" "$name" "$details"
  done
  echo "  → overall: $overall  ($((${#gates[@]} - fail_count - warn_count)) pass / $warn_count warn / $fail_count fail)"
fi

exit $exit_code
