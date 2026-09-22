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

# ─────────────────────────────────────────────────────────────────────
# --lang: the zh half of every page here had no baseline at all, because the
# default locale is en-US. Two things must hold for that to be fixable safely:
# the key must only GAIN a segment (so the seven committed baselines keep
# working), and a switch that did not take must refuse to record (so a capture
# of the wrong language never becomes the reference).

cat > "$D/site/bi.html" <<'EOF'
<!doctype html><html lang="en" data-lang="en"><head><meta charset="utf-8"><title>bi</title>
<style>html[data-lang="en"] .lang-zh{display:none}
html[data-lang="zh"] .lang-en{display:none}
body{margin:0;font:16px/1.5 Arial,sans-serif;padding:40px}</style></head><body>
<h1><span class="lang-en">English heading</span><span class="lang-zh">中文标题</span></h1>
<p><span class="lang-en">A paragraph in one language.</span><span class="lang-zh">一段只有一种语言的话。</span></p>
</body></html>
EOF
# Same markup minus the rule that hides the other side: the page then shows
# both languages at once. Asking only "is the side I wanted visible" passes it.
sed '/data-lang="zh"\] \.lang-en/d' "$D/site/bi.html" > "$D/site/bi-broken.html"
BI=".scratch/pixel-selftest/site/bi.html"
BI_BAD=".scratch/pixel-selftest/site/bi-broken.html"

echo "--lang only ever adds a key segment"
run --baseline "$BI" >/dev/null
run --baseline --lang=zh "$BI" >/dev/null
# find, not a glob — same reason as the note above: these keys start with a dot.
en_png="$(find "$D/bl" -name '*site__bi--as-authored.png' | wc -l)"
zh_png="$(find "$D/bl" -name '*site__bi--as-authored--zh.png' | wc -l)"
t "$en_png" "1" "the no-lang baseline keeps its old two-part name"
t "$zh_png" "1" "and the zh one lands beside it rather than over it"

echo "a zh capture is a different image from the en one"
# If the flag silently did nothing these two would be byte-identical, and every
# zh baseline in the repo would be a copy of the English page.
a="$(find "$D/bl" -name '*site__bi--as-authored.png' | head -1)"
b="$(find "$D/bl" -name '*site__bi--as-authored--zh.png' | head -1)"
t "$(cmp -s "$a" "$b" && echo same || echo different)" "different" \
  "the two baselines differ, so the switch really happened"

echo "★ a switch that did not take refuses to record"
out="$(run --baseline --lang=zh "$BI_BAD")"; rc=$?
t "$rc" "4" "exits 4 — not 0, and not the regression code either"
has "$out" "DID NOT TAKE" "and says the flag did not take"
has "$out" "both languages are showing" "and names the half-broken case"
t "$(find "$D/bl" -name '*bi-broken*' | wc -l)" "0" "and wrote no baseline for it"

echo ""
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
