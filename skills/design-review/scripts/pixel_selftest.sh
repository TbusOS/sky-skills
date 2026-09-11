#!/usr/bin/env bash
# pixel_selftest.sh — this gate has one output, a percentage, and until
# 2026-09-11 that percentage answered two different questions without saying
# which. Seven committed baselines reported a regression; the pages had not
# changed; the machine had moved from Chromium 147 to 148. An afternoon went
# into establishing that, because the number looked like an answer.
#
# So the cases here are mostly about telling the two apart. The one that
# matters most is the last block: a real change, in an unchanged environment,
# must still come out as REGRESSION. Machinery added to suppress noise is one
# careless condition away from suppressing the signal too, and that failure is
# silent — the gate goes green and stays green.

set -uo pipefail
PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
PG="$HERE/pixel-gate.mjs"
cd "$REPO"

pass=0; fail=0
t() { if [ "$1" = "$2" ]; then echo "  ok   $3"; pass=$((pass+1));
      else echo "  FAIL $3 (expected $2, got $1)"; fail=$((fail+1)); fi; }
has() { case "$1" in *"$2"*) t y y "$3";; *) t n y "$3";; esac; }
hasnt() { case "$1" in *"$2"*) t n y "$3";; *) t y y "$3";; esac; }

command -v node >/dev/null 2>&1 || { echo "node is required"; exit 2; }
node -e "import('playwright')" >/dev/null 2>&1 || { echo "SKIP: playwright not installed"; exit 0; }

# Never the committed baselines directory. A test that writes there is one
# crash away from overwriting a real baseline with a fixture.
D="$REPO/.scratch/pixel-selftest"
trap 'rm -rf "$D"' EXIT
mkdir -p "$D/bl" "$D/site"

cat > "$D/site/page.html" <<'EOF'
<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>pixel fixture</title>
<style>
  body { margin: 0; font: 16px/1.5 Arial, sans-serif; background: #ffffff; color: #222222; }
  .band { padding: 40px; }
  .swatch { width: 400px; height: 200px; background: #4477cc; }
</style></head>
<body><div class="band"><h1>Fixture</h1><p>A block of colour and some text.</p>
<div class="swatch"></div></div></body></html>
EOF

REL=".scratch/pixel-selftest/site/page.html"
run() { node "$PG" --baseline-dir="$D/bl" --out="$D" "$@" 2>&1; }

echo "recording keeps the environment with the image"
out="$(run --baseline "$REL")"; rc=$?
t "$rc" "0" "recording succeeds"
# find, not a glob: the baseline key is built from the page's repo-relative
# path, the fixture lives under .scratch/, and so every file here starts with a
# dot — which *.png does not match. The first version of this test looked in an
# empty set and reported the recording as missing.
png="$(find "$D/bl" -name '*.png' | head -1)"
json="$(find "$D/bl" -name '*.json' | head -1)"
t "$([ -s "$png" ] && echo yes || echo no)" "yes" "the image is written"
t "$([ -s "$json" ] && echo yes || echo no)" "yes" "and a sidecar beside it"
# The build it names must be the build that actually ran, or the field is
# decoration — it would match itself forever and never catch a bump.
live="$(node -e "const{chromium}=require('playwright');(async()=>{const b=await chromium.launch();console.log(b.version());await b.close();})()" 2>/dev/null)"
has "$(cat "$json")" "$live" "the sidecar names the Chromium that actually rendered it"
has "$(cat "$json")" '"viewport"' "and the viewport"
has "$(cat "$json")" '"fonts"' "and the fonts that loaded"

echo "same environment, same page"
out="$(run "$REL")"; rc=$?
t "$rc" "0" "passes"
has "$out" "OK" "and says OK"
hasnt "$out" "ENVIRONMENT CHANGED" "without mentioning the environment"

echo "a baseline from somewhere else is not a regression"
python3 - "$json" <<'PY'
import json, sys
p = sys.argv[1]
d = json.load(open(p))
d['chromium'] = '1.2.3.4'           # a build that never existed
json.dump(d, open(p, 'w'), indent=2)
PY
out="$(run "$REL")"; rc=$?
t "$rc" "3" "exits 3, which is not the regression code"
has "$out" "ENVIRONMENT CHANGED" "and says the environment moved"
has "$out" "chromium: baseline 1.2.3.4" "and names the field that moved"
hasnt "$out" "REGRESSION" "and never calls it a regression"
has "$out" "not as a verdict" "and marks the percentage as context only"

echo "a baseline that does not say where it came from"
mv "$json" "$json.hidden"
out="$(run "$REL")"; rc=$?
t "$rc" "3" "exits 3 as well — the comparison has no standing"
has "$out" "PREDATES ENVIRONMENT RECORDING" "and says why"
hasnt "$out" "REGRESSION" "and does not call that a regression either"
mv "$json.hidden" "$json"

echo "★ a real change still fails, in an unchanged environment"
# Restore the honest sidecar first, so the only thing that differs is the page.
run --baseline "$REL" >/dev/null 2>&1
python3 - "$D/site/page.html" <<'PY'
import sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
old, new = 'background: #4477cc', 'background: #cc7744'
assert old in s, 'the fixture changed; update the test, not the gate'
open(p, 'w', encoding='utf-8').write(s.replace(old, new, 1))
PY
out="$(run "$REL")"; rc=$?
t "$rc" "1" "exits 1 — the suppression machinery did not swallow it"
has "$out" "REGRESSION" "and says REGRESSION"
hasnt "$out" "ENVIRONMENT CHANGED" "and does not blame the environment"
has "$out" "diff →" "and writes a diff image to look at"

echo ""
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
