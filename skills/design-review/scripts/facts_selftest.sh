#!/usr/bin/env bash
# facts_selftest.sh — drive the bilingual pairing rule with cases that are not
# in this repo.
#
# The rule was measured against 2,667 real pairs and reported three real
# defects with no false positives, which says it works on the corpus it was
# tuned on. That is the weaker half of the evidence. This file is the other
# half: the shapes it must NOT report, written out one at a time, so that
# widening the rule later fails here rather than in someone's next run.
#
# The case that matters most is the last block. A check that cannot be made to
# report is a check that has stopped meaning anything, and the way that happens
# is never a deleted line — it is a threshold quietly widened until nothing
# reaches it.

set -uo pipefail
PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
cd "$REPO"

pass=0; fail=0
t() { if [ "$1" = "$2" ]; then echo "  ok   $3"; pass=$((pass+1));
      else echo "  FAIL $3 (expected $2, got $1)"; fail=$((fail+1)); fi; }

# say <en-html> <zh-html>  →  "yes" when the rule reports the pair
say() {
  node --input-type=module -e '
    const { pairMismatch } = await import("./skills/design-review/scripts/facts.mjs");
    console.log(pairMismatch(process.argv[1], process.argv[2]) ? "yes" : "no");
  ' "$1" "$2" 2>/dev/null
}

echo "it reports a pair whose halves disagree"
t "$(say '23 skills. One pattern.' '22 个 skill,同一套结构。')" yes \
  "the shape this check was written for"
t "$(say '59 / 59 canonical pages' '58 / 58 张 canonical')" yes \
  "two numbers, both wrong on one side"
t "$(say 'Ships <strong>6 canonical screens</strong>' '随附 <strong>5 个范本屏</strong>')" yes \
  "a number inside a nested tag is still read"

echo "it stays quiet where the halves only look different"
# English spells numbers out where Chinese uses a digit. This is 44 of the 50
# raw differences in this repo — by far the most common shape, and none of them
# is a disagreement about anything.
t "$(say '4 Gates' '四道检查')" no "digit on one side, character on the other"
t "$(say 'Four scripts, four jobs.' '4 个脚本各管一段。')" no "the reverse of that"
t "$(say '1 · Norm source' '一 · 规范源头')" no "a section number written both ways"
t "$(say 'nine design voices' '9 种声音')" no "a spelled-out count against a digit"
t "$(say 'Step &#9315; is the gate' '第 ④ 步是关卡')" no \
  "a circled numeral entity is not the number 9315"
t "$(say 'the 9px floor, font-size 10' 'SVG 写了 10,渲染成 9px')" no \
  "the same numbers in the order each language wants them"

echo "it stays out of long prose"
LONG_EN="51 checks, 94 bugs, 59/59 canonical, 4 critics, 23 skills, 7 harness"
LONG_ZH="51 项,94 条,59/59 canonical,4 位,23 个,8 个 harness"
t "$(say "$LONG_EN" "$LONG_ZH")" no \
  "more than $(node -e 'import("./skills/design-review/scripts/facts.mjs").then(m=>console.log(m.PAIR_MAX_NUMBERS))') numbers a side is narrative, not a claim"
t "$(say '23 skills' '22 个 skill,其中 9 个画页面')" no \
  "one side naming more things than the other proves nothing"

echo "pairing itself"
# primer's SVG labels put Chinese first. Scanning once for each order lets one
# label's English pair with the NEXT label's Chinese, and every pair built that
# way looks exactly like a real disagreement.
ZHFIRST='<text class="lang-zh">全部 23 本手册</text><text class="lang-en">all 23 handbooks</text><text class="lang-zh">这 9 本教画页面</text><text class="lang-en">these 9 draw pages</text>'
n="$(node --input-type=module -e '
  const { langPairs, pairMismatch } = await import("./skills/design-review/scripts/facts.mjs");
  console.log(langPairs(process.argv[1]).filter((p) => pairMismatch(p.en, p.zh)).length);
' "$ZHFIRST" 2>/dev/null)"
t "$n" "0" "Chinese-first markup pairs with its own English, not the next label's"
n2="$(node --input-type=module -e '
  const { langPairs } = await import("./skills/design-review/scripts/facts.mjs");
  console.log(langPairs(process.argv[1]).length);
' "$ZHFIRST" 2>/dev/null)"
t "$n2" "2" "and it finds both pairs rather than collapsing them"

SPLIT='<p><span class="lang-en">23 skills</span></p><p><span class="lang-zh">9 个设计</span></p>'
n3="$(node --input-type=module -e '
  const { langPairs } = await import("./skills/design-review/scripts/facts.mjs");
  console.log(langPairs(process.argv[1]).length);
' "$SPLIT" 2>/dev/null)"
t "$n3" "0" "two claims in separate blocks are not one claim in two languages"

echo "end to end · a broken page fails the run, and the run says where"
BEFORE_RC=0; bash "$REPO/bin/design-review" --facts >/dev/null 2>&1 || BEFORE_RC=$?
t "$BEFORE_RC" "0" "the repo is clean before we break it"

VICTIM="docs/HARNESS-ROADMAP.html"
cp "$VICTIM" "$VICTIM.selftest-bak"
restore() { [ -f "$VICTIM.selftest-bak" ] && mv "$VICTIM.selftest-bak" "$VICTIM"; }
trap restore EXIT
# The count on that page moves every time a canonical is added (59 → 67 on
# 2026-09-15), and this test used to name the number: it then failed from that
# day on, with the assertion below, and nobody ran it. Find the claim by its
# shape, and make the Chinese half one less than whatever it currently says.
STALE="$(python3 - "$VICTIM" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p, encoding='utf-8').read()
m = re.search(r'<span class="lang-zh">(\d+) / \1 张 canonical', s)
assert m, 'the fixture this test edits is gone — update the test, not the check'
n = int(m.group(1)) - 1
open(p, 'w', encoding='utf-8').write(s[:m.start()] + f'<span class="lang-zh">{n} / {n} 张 canonical' + s[m.end():])
print(n)
PY
)"
out="$(bash "$REPO/bin/design-review" --facts 2>&1)"; rc=$?
t "$rc" "1" "one half left stale fails the run"
case "$out" in *"bilingual halves disagree"*) t y y "it is reported as its own kind, not as a stale count";;
                                          *) t n y "it is reported as its own kind, not as a stale count";; esac
case "$out" in *"$VICTIM"*) t y y "the report names the file";; *) t n y "the report names the file";; esac
case "$out" in *"$STALE,$STALE"*) t y y "and prints both halves so the reader can tell which is wrong";;
                       *) t n y "and prints both halves so the reader can tell which is wrong";; esac
restore; trap - EXIT

AFTER_RC=0; bash "$REPO/bin/design-review" --facts >/dev/null 2>&1 || AFTER_RC=$?
t "$AFTER_RC" "0" "and the repo is clean again afterwards"

echo ""
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
