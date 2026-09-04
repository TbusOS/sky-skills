#!/usr/bin/env bash
# interaction_selftest.sh — break the interaction gate on purpose, seven ways.
#
# A gate reporting OK proves nothing until it has been seen to fail on each
# thing it claims to catch, and to stay quiet on the thing it must not flag.
# Every fixture here is a single defect with nothing else wrong, so a failure
# names its own cause.

set -uo pipefail
# A locked PATH that cannot find node is not a safety measure, it is a broken
# script. Homebrew lives at /opt/homebrew on Apple Silicon and /usr/local on
# Intel; both are listed, and the caller's PATH is appended so a node installed
# by nvm or asdf still resolves.
PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"
GATE="skills/design-review/scripts/interaction-audit.mjs"
FIX="skills/design-review/scripts/fixtures"
cd "$REPO"

# macOS ships no `timeout`; coreutils installs it as `gtimeout` and only if you
# asked for it. Locking PATH and then calling a command that is not on it fails
# with 127, which every assertion below would have read as "the gate exited
# wrong" rather than "the harness is broken".
if command -v timeout >/dev/null 2>&1; then TO=(timeout 200)
elif command -v gtimeout >/dev/null 2>&1; then TO=(gtimeout 200)
else TO=(); fi

pass=0; fail=0
run() { "${TO[@]}" node "$GATE" "$FIX/$1" 2>&1; }

expect() {          # expect <fixture> <exit-under-strict> <substring> <what>
  local fx="$1" want_rc="$2" needle="$3" what="$4"
  local out rc
  out="$(run "$fx")"
  "${TO[@]}" node "$GATE" --strict "$FIX/$fx" >/dev/null 2>&1; rc=$?
  local ok=1
  case "$out" in
    *"interaction-audit:"*) ;;
    *) echo "  FAIL $what — the gate did not run (output: ${out:-<empty>})"; fail=$((fail+1)); return;;
  esac
  [ "$rc" = "$want_rc" ] || { ok=0; echo "  FAIL $what — exit $rc under --strict, expected $want_rc"; }
  case "$out" in *"$needle"*) ;; *) ok=0; echo "  FAIL $what — output does not contain: $needle";; esac
  if [ "$ok" = 1 ]; then echo "  ok   $what"; pass=$((pass+1)); else fail=$((fail+1)); fi
}

refute() {          # refute <fixture> <substring> <what>
  local fx="$1" needle="$2" what="$3"
  local out; out="$(run "$fx")"
  # An empty or crashed run contains no needle either, so it would sail through
  # a bare "does not contain" test. Require the gate's own header first.
  case "$out" in
    *"interaction-audit:"*) ;;
    *) echo "  FAIL $what — the gate did not run (output: ${out:-<empty>})"; fail=$((fail+1)); return;;
  esac
  case "$out" in
    *"$needle"*) echo "  FAIL $what — output wrongly contains: $needle"; fail=$((fail+1));;
    *) echo "  ok   $what"; pass=$((pass+1));;
  esac
}

echo "errors (must exit 1 under --strict)"
expect bad-interaction-throws.html 1 \
  "uncaught: Cannot read properties of null" \
  "a click that throws is reported and names the exception"
expect bad-interaction-contrast-after-click.html 1 \
  "introduced color-contrast" \
  "contrast that only exists after the accordion opens is caught"
expect bad-interaction-stale-inert.html 1 \
  "declared inert-by-design" \
  "an inert-by-design declaration that is no longer true is caught"

echo "warnings (reported, but not blocking)"
expect bad-interaction-dead-control.html 0 \
  "changed nothing measurable" \
  "a control wired to nothing is reported"
expect bad-interaction-broken-anchor.html 0 \
  "links to #pricing-table, which is not an id or name" \
  "a broken in-page anchor is reported and names the fragment"
expect bad-interaction-overlap-after-click.html 0 \
  "revealed content that overlaps" \
  "content revealed by a click that lands on other content is reported"

echo "quiet where it must be quiet"
refute good-interaction-active-control.html \
  "changed nothing measurable" \
  "an already-active control is not called dead"
refute good-interaction-active-control.html \
  "[error]" \
  "the good fixture raises no error"
refute bad-interaction-contrast-after-click.html \
  "changed nothing measurable" \
  "a control that did change is not also called dead"

echo "the hidden-content trap (known-bugs 1.40)"
# A closed <details> keeps a real box with visibility:visible, so a geometry
# check written by hand counts the hidden answer as painted text. This asserts
# the gate does not inherit that bug: the fixture has exactly one accordion and
# no overlap until it is opened.
out="$(run bad-interaction-contrast-after-click.html)"
case "$out" in
  *"interaction-audit:"*) ;;
  *) echo "  FAIL the gate did not run"; fail=$((fail+1)); out="";;
esac
case "$out" in
  *"revealed content that overlaps"*)
    echo "  FAIL closed accordion content is being counted as visible"; fail=$((fail+1));;
  *) echo "  ok   closed accordion content is not counted as visible"; pass=$((pass+1));;
esac

echo ""
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
