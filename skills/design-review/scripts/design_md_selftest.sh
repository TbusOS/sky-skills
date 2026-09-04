#!/usr/bin/env bash
# design_md_selftest.sh — a DESIGN.md decides what the checks do, so a mistake
# in it is a mistake in every run that follows. Both directions are tested: that
# a bad file is rejected with the reason, and that a good one changes exactly
# what it says it changes and nothing else.
#
# The assertion that matters most is the last block. A waiver must DOWNGRADE a
# finding, never hide it — the moment it can hide one, DESIGN.md becomes a mute
# button and every check in this repo is worth less.

set -uo pipefail
PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
DM="node $HERE/design-md.mjs"
VA="node $HERE/visual-audit.mjs"
FIX="skills/design-review/scripts/fixtures"
LAP="$FIX/bad-anthropic-severe-overlap.html"
cd "$REPO"

pass=0; fail=0
t() { if [ "$1" = "$2" ]; then echo "  ok   $3"; pass=$((pass+1));
      else echo "  FAIL $3 (expected $2, got $1)"; fail=$((fail+1)); fi; }
has() { case "$1" in *"$2"*) t y y "$3";; *) t n y "$3";; esac; }
hasnt() { case "$1" in *"$2"*) t n y "$3";; *) t y y "$3";; esac; }

T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT

good() { cat > "$1" <<'EOF'
---
skill: anthropic
waivers:
  - check: visual-audit:text-overlap
    reason: this fixture exists to prove a waiver downgrades a finding rather than hiding it
---

# Design decisions

Prose the critics read.
EOF
}

echo "a well-formed file"
good "$T/DESIGN.md"
out="$($DM --check "$T/DESIGN.md" 2>&1)"; rc=$?
t "$rc" "0" "validates"
has "$out" "skill    anthropic" "reports the skill"
has "$out" "waivers  1" "reports the waiver count"
has "$out" "passed to the taste critics" "says the prose goes to the critics"
out="$($DM --flags "$T/DESIGN.md" 2>&1)"
has "$out" "skill	anthropic" "--flags emits the skill"
has "$out" "waive	visual-audit:text-overlap|" "--flags emits the waiver with its reason"

echo "a file with no front matter at all"
mkdir -p "$T/plain"
printf '# just prose\n' > "$T/plain/DESIGN.md"
t "$([ -s "$T/plain/DESIGN.md" ] && echo yes || echo no)" "yes" "the fixture was actually written"
out="$($DM --check "$T/plain/DESIGN.md" 2>&1)"; rc=$?
t "$rc" "0" "prose without front matter is legal — nothing is being claimed"
has "$out" "not set" "and the skill falls back to auto-detection"

echo "every way it can be wrong"
mk() { mkdir -p "$T/bad"; printf '%s\n' "$1" > "$T/bad/DESIGN.md"; $DM --check "$T/bad/DESIGN.md" 2>&1; }
out="$(mk '---
theme: dark
---')"
has "$out" 'unknown key "theme"' "an unknown key is named"
out="$(mk '---
skill: anthropicc
---')"
has "$out" "is not one of" "a misspelled skill is caught"
out="$(mk '---
waivers:
  - check: visual-audit:text-overlap
    reason: nope
---')"
has "$out" "needs a reason" "a reason too short to be one is rejected"
out="$(mk '---
waivers:
  - check: visual-audit:text-overlapp
    reason: a reason long enough to pass the length test
---')"
has "$out" "is not a check this repo has" "a check id that does not exist is caught"
out="$(mk '---
waivers:
  - check: visual-audit:text-overlap
    reason: a reason long enough to pass the length test
    until: 2020-01-01
---')"
has "$out" "expired on 2020-01-01" "an expired waiver is caught"
out="$(mk '---
waivers:
  - check: visual-audit:text-overlap
    reason: a reason long enough to pass the length test
    until: last tuesday
---')"
has "$out" "until must be YYYY-MM-DD" "a date that is not a date is caught"
out="$(mk '---
waivers:
  - reason: a waiver that names no check at all, which cannot mean anything
---')"
has "$out" "no check named" "a waiver with no check is caught"
out="$(mk '---
waivers:
  - check: axe:color-contrast
    reason: an axe rule id is accepted because those ids are axe-cores, not ours
---')"
hasnt "$out" "is not a check" "an axe rule id is accepted"

echo "a waiver downgrades, and does not hide"
bare="$($VA --skill=anthropic "$LAP" 2>&1)"
has "$bare" "1 error" "the fixture errors without a waiver"
waived="$($VA --skill=anthropic '--waive=visual-audit:text-overlap|a reason long enough to be one' "$LAP" 2>&1)"
has "$waived" "0 error" "the waiver clears the error"
has "$waived" "[waived] visual-audit:text-overlap" "the waiver is announced with its reason"
has "$waived" "[warn] text-overlap" "the finding is STILL PRINTED, as a warning"
rc=0; $VA --skill=anthropic '--waive=visual-audit:text-overlap|a reason long enough to be one' "$LAP" >/dev/null 2>&1 || rc=$?
t "$rc" "0" "the run passes once the finding is waived"

echo "a waiver that belongs to another gate"
out="$($VA --skill=anthropic '--waive=interaction:dead-control|belongs to the interaction gate' "$LAP" 2>&1)"
hasnt "$out" "stale waiver" "visual-audit does not call another gate's waiver stale"
out="$($VA --skill=anthropic '--waive=visual-audit:figure-no-caption|a reason long enough to be one' "$LAP" 2>&1)"
has "$out" "stale waiver" "a waiver of its own that did not fire IS reported"
out="$($VA --skill=anthropic --waive-quiet '--waive=visual-audit:figure-no-caption|a reason long enough to be one' "$LAP" 2>&1)"
hasnt "$out" "stale waiver" "--waive-quiet silences that, for multi-page runs"

echo "the run refuses to start on a malformed file"
# A page that passes on its own, so an exit of 1 can only have come from the
# DESIGN.md. Using the overlap fixture here would have proved nothing: it exits
# 1 by itself.
# The DESIGN.md check runs before any gate, so the control is not "a page that
# passes" — it is the same page, same flags, with and without the file. That
# isolates the cause without needing a page that clears every check.
rm -f "$FIX/DESIGN.md"
before="$( (cd "$REPO" && bin/design-review --no-interact "$LAP" 2>&1) || true )"
hasnt "$before" "DESIGN.md is malformed" "without the file, nothing complains about DESIGN.md"
has "$before" "verify.py" "and the run does reach the gates"
printf -- '---\nskill: nonsense\n---\n' > "$FIX/DESIGN.md"
after_rc=0; (cd "$REPO" && bin/design-review --no-interact "$LAP" >/dev/null 2>&1) || after_rc=$?
after="$( (cd "$REPO" && bin/design-review --no-interact "$LAP" 2>&1) || true )"
rm -f "$FIX/DESIGN.md"
t "$after_rc" "1" "adding a malformed DESIGN.md fails the run"
has "$after" "DESIGN.md is malformed" "and says why"
hasnt "$after" "verify.py" "and stops before any gate runs — nothing is half-checked"

echo ""
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
