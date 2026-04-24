#!/usr/bin/env bash
# audit-structural.sh — Tier 1 of gated-dual-clone-audit.
# Filesystem-level checks: both dirs exist, are git repos, hook is installed,
# .git/objects are hardlinked between gateway and satellite.
#
# Usage:
#   audit-structural.sh --gateway-dir=<path> --satellite-dir=<path> [--json]
#
# Output: human-readable by default · --json emits structured verdict.
# Exit code: 0 all pass · 1 at least one warn · 2 at least one fail · 3 bad CLI

set -eu

GATEWAY=""
SATELLITE=""
CLEAN_VERIFY=""
JSON=0

for a in "$@"; do
  case "$a" in
    --gateway-dir=*)      GATEWAY="${a#*=}" ;;
    --satellite-dir=*)    SATELLITE="${a#*=}" ;;
    --clean-verify-dir=*) CLEAN_VERIFY="${a#*=}" ;;
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

# Accumulator arrays. Each check appends "status|id|name|details" to gates.
gates=()
fail_count=0
warn_count=0

record() {
  local status="$1" id="$2" name="$3" details="$4"
  gates+=("$status|$id|$name|$details")
  case "$status" in
    FAIL) fail_count=$((fail_count + 1)) ;;
    WARN) warn_count=$((warn_count + 1)) ;;
  esac
}

# ------------------------------ S1–S4 · exist + is-git-repo -----------
if [[ -d "$GATEWAY" ]]; then
  record PASS S1 "gateway exists"              "$GATEWAY"
else
  record FAIL S1 "gateway exists"              "missing: $GATEWAY"
fi

if [[ -d "$GATEWAY/.git" ]] && (cd "$GATEWAY" && git rev-parse --git-dir >/dev/null 2>&1); then
  record PASS S2 "gateway is a git repo"       "$GATEWAY/.git"
else
  record FAIL S2 "gateway is a git repo"       "no valid .git at $GATEWAY"
fi

if [[ -d "$SATELLITE" ]]; then
  record PASS S3 "satellite exists"            "$SATELLITE"
else
  record FAIL S3 "satellite exists"            "missing: $SATELLITE"
fi

if [[ -d "$SATELLITE/.git" ]] && (cd "$SATELLITE" && git rev-parse --git-dir >/dev/null 2>&1); then
  record PASS S4 "satellite is a git repo"     "$SATELLITE/.git"
else
  record FAIL S4 "satellite is a git repo"     "no valid .git at $SATELLITE"
fi

# If the fundamentals are broken, don't bother with the rest.
if [[ $fail_count -gt 0 ]]; then
  : # fall through to output
fi

# ------------------------------ S5–S7 · pre-push hook -----------------
HOOK_PATH="$GATEWAY/.git/hooks/pre-push"

if [[ -f "$HOOK_PATH" ]]; then
  record PASS S5 "pre-push hook present"       "$HOOK_PATH"
  if [[ -x "$HOOK_PATH" ]]; then
    record PASS S6 "pre-push hook executable"  "chmod +x"
  else
    record FAIL S6 "pre-push hook executable"  "hook file is not executable — run: chmod +x $HOOK_PATH"
  fi
  # Content check: the hook body should have a 'protected=' line AND match
  # something like refs/heads. Rough heuristic — Tier 3 is the real test.
  if grep -q "protected=" "$HOOK_PATH" && grep -q "refs/heads" "$HOOK_PATH"; then
    regex_line="$(grep -m1 "^protected=" "$HOOK_PATH" | sed "s/^protected=//" | tr -d \"\')"
    record PASS S7 "pre-push hook has a protect regex"  "protected=$regex_line"
  else
    record WARN S7 "pre-push hook has a protect regex"  "hook body doesn't look like the gated-dual-clone template — Tier 3 will verify behaviourally"
  fi
else
  record FAIL S5 "pre-push hook present"       "$HOOK_PATH missing · re-run gated-dual-clone/scripts/install-hooks.sh --repo=<gateway> --protect=<regex>"
  record FAIL S6 "pre-push hook executable"    "(cannot check · hook file missing)"
  record FAIL S7 "pre-push hook has a protect regex" "(cannot check · hook file missing)"
fi

# ------------------------------ S8 · hardlink spot-check --------------
# Pick a loose object in gateway's .git/objects and compare inode with its
# counterpart in satellite. If objects are packed, skip with a WARN (packed
# objects may or may not share, and we don't want false positives).
shopt -s nullglob
loose_sample=""
for d in "$GATEWAY/.git/objects"/[0-9a-f][0-9a-f]; do
  for f in "$d"/*; do
    loose_sample="$f"
    break 2
  done
done
shopt -u nullglob

if [[ -n "$loose_sample" ]]; then
  rel="${loose_sample#$GATEWAY/.git/objects/}"
  sat_counterpart="$SATELLITE/.git/objects/$rel"
  if [[ -f "$sat_counterpart" ]]; then
    gw_inode="$(stat -c '%i' "$loose_sample")"
    sat_inode="$(stat -c '%i' "$sat_counterpart")"
    if [[ "$gw_inode" == "$sat_inode" ]]; then
      record PASS S8 ".git/objects hardlinked"   "sample $rel · inode $gw_inode"
    else
      record WARN S8 ".git/objects hardlinked"   "sample $rel · gateway inode $gw_inode ≠ satellite inode $sat_inode · disk usage 2× (hardlink lost, maybe cross-filesystem)"
    fi
  else
    record WARN S8 ".git/objects hardlinked"   "sample $rel missing in satellite — satellite may need a fetch"
  fi
else
  record WARN S8 ".git/objects hardlinked"   "no loose objects to spot-check (fully packed · skipping · this is fine for mature repos)"
fi

# ------------------------------ S9–S11 · clean-verify (optional) ------
# Only runs when --clean-verify-dir was provided (3-clone topology).
if [[ -n "$CLEAN_VERIFY" ]]; then
  if [[ -d "$CLEAN_VERIFY" ]]; then
    record PASS S9 "clean-verify exists"            "$CLEAN_VERIFY"
  else
    record FAIL S9 "clean-verify exists"            "missing: $CLEAN_VERIFY"
  fi

  if [[ -d "$CLEAN_VERIFY/.git" ]] && (cd "$CLEAN_VERIFY" && git rev-parse --git-dir >/dev/null 2>&1); then
    record PASS S10 "clean-verify is a git repo"    "$CLEAN_VERIFY/.git"
  else
    record FAIL S10 "clean-verify is a git repo"    "no valid .git at $CLEAN_VERIFY"
  fi

  # S11 · last-clean-verify stamp presence on gateway.
  # Stamp is WARN-only on audit (user may not have run clean-verify yet for
  # the current HEAD). The pre-push hook is the one that enforces match.
  stamp="$GATEWAY/.git/last-clean-verify"
  if [[ -r "$stamp" ]]; then
    stamp_sha="$(awk '{print $1}' "$stamp" 2>/dev/null || echo '')"
    if [[ -n "$stamp_sha" ]]; then
      record PASS S11 "clean-verify stamp on gateway" "$stamp · sha=${stamp_sha:0:12}"
    else
      record WARN S11 "clean-verify stamp on gateway" "$stamp present but malformed"
    fi
  else
    record WARN S11 "clean-verify stamp on gateway" "no stamp at $stamp · run clean-verify-run.sh before next push"
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
  # Minimal JSON emitter (portable, no jq).
  printf '{\n'
  printf '  "tier": "structural",\n'
  printf '  "overall": "%s",\n' "$overall"
  printf '  "pass_count": %d,\n' "$(( ${#gates[@]} - fail_count - warn_count ))"
  printf '  "warn_count": %d,\n' "$warn_count"
  printf '  "fail_count": %d,\n' "$fail_count"
  printf '  "gates": [\n'
  first=1
  for entry in "${gates[@]}"; do
    status="${entry%%|*}"
    rest="${entry#*|}"
    id="${rest%%|*}"; rest="${rest#*|}"
    name="${rest%%|*}"; details="${rest#*|}"
    if [[ $first -eq 1 ]]; then first=0; else printf ',\n'; fi
    # Escape double-quotes and backslashes in details for JSON.
    esc_details="${details//\\/\\\\}"; esc_details="${esc_details//\"/\\\"}"
    printf '    {"id": "%s", "name": "%s", "status": "%s", "details": "%s"}' \
      "$id" "$name" "$status" "$esc_details"
  done
  printf '\n  ]\n'
  printf '}\n'
else
  # Human-readable table.
  echo "━━ Tier 1 · Structural ━━"
  for entry in "${gates[@]}"; do
    status="${entry%%|*}"
    rest="${entry#*|}"
    id="${rest%%|*}"; rest="${rest#*|}"
    name="${rest%%|*}"; details="${rest#*|}"
    case "$status" in
      PASS) marker="✓" ;;
      WARN) marker="?" ;;
      FAIL) marker="✗" ;;
    esac
    printf "  %s  %s  %-40s  %s\n" "$marker" "$id" "$name" "$details"
  done
  echo "  → overall: $overall  ($((${#gates[@]} - fail_count - warn_count)) pass / $warn_count warn / $fail_count fail)"
fi

exit $exit_code
