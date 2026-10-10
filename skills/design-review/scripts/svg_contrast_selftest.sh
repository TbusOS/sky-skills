#!/usr/bin/env bash
# svg_contrast_selftest.sh — drive the SVG text contrast rule (axe-audit's
# svg-text-contrast, check_objective's O6) with one defect per fixture.
#
# axe never measures SVG <text>, so before 2026-10-10 a diagram label could be
# any colour at all and every gate said clean. The rule that replaced that
# silence reads the background from rendered pixels and only under the glyph
# strokes; each fixture below exists because one simpler way of doing that gave
# a wrong answer on a real page in this repo.
#
# Every case asserts how many labels were MEASURED as well as how many were
# reported: "0 reported" is also what a run that measured nothing prints.

set -uo pipefail
PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"
GATE="skills/design-review/scripts/axe-audit.mjs"
FIX="skills/design-review/scripts/fixtures"
cd "$REPO"

pass=0; fail=0
t() { if [ "$1" = "$2" ]; then echo "  ok   $3"; pass=$((pass+1));
      else echo "  FAIL $3 (expected $2, got $1)"; fail=$((fail+1)); fi; }

# probe <fixture>  →  "<reported> <measured> <skipped-json>" from the gate's JSON
probe() {
  node "$GATE" --json "$FIX/$1" 2>/dev/null | node -e '
    let s = ""; process.stdin.on("data", (d) => s += d).on("end", () => {
      try {
        const r = JSON.parse(s).report[0];
        if (r.error) { console.log("error"); return; }
        const v = r.violations.find((x) => x.rule === "svg-text-contrast");
        console.log(`${v ? v.count : 0} ${r.svgText.measured} ${JSON.stringify(r.svgText.skipped)}`);
      } catch { console.log("no-output"); }
    });'
}
field() { echo "$1" | cut -d" " -f"$2"; }

echo "it reports the labels a reader cannot make out"
o="$(probe svgc-gray-label.html)"
t "$(field "$o" 1)/$(field "$o" 2)" "1/1" "a pale grey label on white"
o="$(probe svgc-faded.html)"
t "$(field "$o" 1)/$(field "$o" 2)" "1/1" "dark text faded by opacity: the fill alone reads 11:1"
o="$(probe svgc-gradient-under.html)"
t "$(field "$o" 1)/$(field "$o" 2)" "1/1" "a label crossing a gradient into its own colour (no fill colour to read)"

echo "and leaves alone the ones that are fine"
o="$(probe svgc-tight-pill.html)"
t "$(field "$o" 1)/$(field "$o" 2)" "0/1" "white text in a pill that just fits it: only pixels under the strokes count"
o="$(probe svgc-large-text.html)"
t "$(field "$o" 1)/$(field "$o" 2)" "0/1" "3.3:1 is enough at 28px"
o="$(probe svgc-fixed-header.html)"
t "$(field "$o" 1)/$(field "$o" 2)" "0/1" "a fixed dark header is moved out of the way, not read as the background"
# The colours this rule swaps in must land before the screenshot. On real pages
# the trap is `* { transition-duration: 0.01ms !important }` for reduced motion:
# no transition-property, so "all", so every swap becomes a 0.01ms transition
# that a screenshot catches before it starts — some runs, not others (anthropic
# faq: 17 labels set aside in one run, all measured in the next). A race does not
# make a test, so the fixture uses a 1s fill transition to lose it every time.
o="$(probe svgc-fill-transition.html)"
t "$(field "$o" 1)/$(field "$o" 2)" "0/1" "a transition on the label colour does not leave a shot showing the old colour"
case "$(field "$o" 3)" in *'"unpainted":0'*) t y y "  … and is not set aside as unpainted";;
                       *) t n y "  … and is not set aside as unpainted";; esac
o="$(probe svgc-hidden-lang.html)"
t "$(field "$o" 1)/$(field "$o" 2)" "0/1" "the hidden language half is not measured"
case "$(field "$o" 3)" in *'"hidden":1'*) t y y "  … and is counted as hidden, so the skip is visible";;
                       *) t n y "  … and is counted as hidden, so the skip is visible";; esac

echo "the gate prints how much it measured"
out="$(node "$GATE" "$FIX/svgc-gray-label.html" 2>&1)"
case "$out" in *"svg text: 1 measured"*) t y y "a line saying how many labels were measured";;
               *) t n y "a line saying how many labels were measured";; esac
case "$out" in *"svg-text-contrast"*"#b0aea5 on #ffffff"*) t y y "and each finding names both colours";;
               *) t n y "and each finding names both colours";; esac

echo ""
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
