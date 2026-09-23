#!/usr/bin/env bash
# visual_selftest.sh — visual-audit 2026-09-23 加的三样东西，每样两个方向都测：
#   --lang        切到中文再审；切不过去必须停下（exit 4），不能审完另一种语言报「干净」
#   语言泄漏       lang-both-showing / lang-leak 四种判法，各配一个该报的页和一个不该报的页
#   窄屏扫描      narrow-overflow-x：390/600/768/900 任一宽度撑宽都要报、报出是谁撑的；
#                 放进横向滚动容器就不报；只在 768 撑宽的页（390 和 1024 都放得下）也要报
#
# 为什么两个方向都要：只测「坏的报了」，检查可以靠「什么都报」通过；只测「好的没报」，
# 检查可以靠「什么都不报」通过。这个仓记过的教训里，后一种更常见（触发不了的检查是死代码）。

set -uo pipefail
PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${PATH:-}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../../.." && pwd)"
VA="${VA_UNDER_TEST:-$HERE/visual-audit.mjs}"   # 反向验证时指向一份故意改坏的拷贝
cd "$REPO"

pass=0; fail=0
t() { if [ "$1" = "$2" ]; then echo "  ok   $3"; pass=$((pass+1));
      else echo "  FAIL $3 (expected $2, got $1)"; fail=$((fail+1)); fi; }
has() { if grep -qF -- "$2" <<<"$1"; then echo yes; else echo no; fi; }

command -v node >/dev/null 2>&1 || { echo "node is required"; exit 2; }
node -e "import('playwright')" >/dev/null 2>&1 || { echo "SKIP: playwright not installed"; exit 0; }

D="$REPO/.scratch/va-selftest"
R=".scratch/va-selftest"
trap 'rm -rf "$D"' EXIT
mkdir -p "$D"
export VISUAL_AUDIT_PORT=8971

DEFAULT_HIDE='html[data-lang="en"] .lang-zh{display:none!important} html[data-lang="zh"] .lang-en{display:none!important}'
# 最小的页面骨架：不挂任何 skill 的 CSS，免得别的检查（品牌色、字体）来搅局。
# 默认带好双语隐藏规则；$1 = 额外的 <style>，$2 = body。
page() {
  cat <<EOF
<!doctype html><html lang="en" data-lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>t</title>
<style>
body{font:16px/1.5 sans-serif;color:#111;background:#fff;margin:24px}
${HIDE-$DEFAULT_HIDE}
$1
</style></head><body><main>
<h2><span class="lang-en">Overview</span><span class="lang-zh">概览</span></h2>
$2
</main></body></html>
EOF
}
run() { node "$VA" --no-second-viewport "$@" 2>&1; }

# ────────────────────────────── --lang ──────────────────────────────
echo "--lang"
page "" "<p><span class=\"lang-en\">Hello there.</span><span class=\"lang-zh\">你好。</span></p>" > "$D/ok.html"
out="$(run --lang=de "$R/ok.html")"; rc=$?
t "$rc" "2" "--lang=de is refused"
out="$(run --lang=zh "$R/ok.html")"; rc=$?
t "$rc" "0" "a clean bilingual page passes in zh"
t "$(has "$out" "[lang=zh]")" "yes" "and the result line says which language it audited"

HIDE='html[data-lang="en"] .lang-zh{display:none!important}' page "" \
  "<p><span class=\"lang-en\">Hello there.</span><span class=\"lang-zh\">你好。</span></p>" > "$D/half.html"
out="$(run --lang=zh "$R/half.html")"; rc=$?
t "$rc" "4" "zh hide rule missing: --lang=zh stops with exit 4"
t "$(has "$out" "DID NOT TAKE")" "yes" "and says the switch did not take"
t "$(has "$out" "error(s)")" "no" "and prints no audit result at all"

HIDE='.lang-zh{display:none!important}' page "" \
  "<p><span class=\"lang-en\">Hello there.</span><span class=\"lang-zh\">你好。</span></p>" > "$D/never.html"
out="$(run --lang=zh "$R/never.html")"; rc=$?
t "$rc" "4" "zh side can never show: exit 4"

cat > "$D/mono.html" <<'EOF'
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>m</title>
<style>body{font:16px sans-serif;color:#111;background:#fff}</style></head>
<body><main><p>Only English here.</p></main></body></html>
EOF
out="$(run --lang=zh "$R/mono.html")"; rc=$?
t "$rc" "0" "monolingual page with --lang=zh: audited as authored, not a failure"
t "$(has "$out" "no .lang-en/.lang-zh markup")" "yes" "and says there was nothing to switch"

# ─────────────────────────── language leaks ───────────────────────────
echo "language leaks"
HIDE=' ' page "" "<p><span class=\"lang-en\">Hello there.</span><span class=\"lang-zh\">你好。</span></p>" > "$D/both.html"
out="$(run "$R/both.html")"; rc=$?
t "$(has "$out" "lang-both-showing")" "yes" "no hide rules at all: lang-both-showing in the default run"
t "$rc" "1" "and it is an error"

page "" "<p>设备树 · device tree</p>" > "$D/cjk.html"
out="$(run "$R/cjk.html")"
t "$(has "$out" "lang-leak (cjk-in-english-view)")" "yes" "Chinese outside .lang-zh in the English view"
page "" "<p><span lang=\"zh-CN\">设备树</span> · device tree</p>" > "$D/cjk-declared.html"
out="$(run "$R/cjk-declared.html")"; rc=$?
t "$(has "$out" "lang-leak")" "no" "same text declared lang=\"zh-CN\": not a leak"
t "$rc" "0" "and the page is clean"
page "" "<div class=\"lang-toggle\"><button>EN</button><button>中文</button></div>" > "$D/toggle.html"
out="$(run "$R/toggle.html")"
t "$(has "$out" "lang-leak")" "no" "the language toggle's own 中文 label is not a leak"

page "" "<div class=\"bars\"><span>Feb</span><span>Mar</span></div>" > "$D/month.html"
out="$(run --lang=zh "$R/month.html")"
t "$(has "$out" "lang-leak (month-or-weekday)")" "yes" "month names in the Chinese view"
page "" "<p>2026-02 · v2.1 · 44%</p>" > "$D/month-no.html"
out="$(run --lang=zh "$R/month-no.html")"
t "$(has "$out" "lang-leak")" "no" "dates and numbers are not"

page "" "<nav><span class=\"lang-en\">Dashboard</span><span class=\"lang-zh\">控制台</span></nav><h1>Dashboard</h1>" > "$D/elsewhere.html"
out="$(run --lang=zh "$R/elsewhere.html")"
t "$(has "$out" "lang-leak (translated-elsewhere)")" "yes" "a word the page translates elsewhere, left untranslated"
page "" "<p><span class=\"lang-en\">i2c_transfer()</span><span class=\"lang-zh\">i2c_transfer() 函数</span></p><b>i2c_transfer()</b><p><span class=\"lang-en\">Skypad</span><span class=\"lang-zh\">Skypad</span></p><a>Skypad</a>" > "$D/elsewhere-no.html"
out="$(run --lang=zh "$R/elsewhere-no.html")"
t "$(has "$out" "lang-leak")" "no" "identifiers, and names the zh side also keeps in English, are not"

page "" "<p>the engine raises an interrupt</p>" > "$D/sentence.html"
out="$(run --lang=zh "$R/sentence.html")"
t "$(has "$out" "lang-leak (english-sentence)")" "yes" "an English sentence in the Chinese view"
page "" "<p><code>the engine raises an interrupt</code></p><p lang=\"en\">Unable to handle kernel NULL pointer dereference at virtual address</p><p>Trail of Bits</p><svg width=\"300\" height=\"40\"><text x=\"4\" y=\"20\">the engine has not been told anything yet</text></svg>" > "$D/sentence-no.html"
out="$(run --lang=zh "$R/sentence-no.html")"
t "$(has "$out" "lang-leak")" "no" "inside <code>, declared lang=en, a two-word name, or SVG: not reported"
# 上面那一页的每个反例都得「本来会被报」才有意义：同一句话挪出 <code>/SVG 必须被报。
# 第一版的 SVG 反例只含一个虚词，本来就不会被判成句子 —— 把「不查 SVG」那行删掉，
# 自检照样全过。反向验证抓出来的。
page "" "<p>the engine has not been told anything yet</p>" > "$D/sentence-control.html"
out="$(run --lang=zh "$R/sentence-control.html")"
t "$(has "$out" "lang-leak (english-sentence)")" "yes" "(control) the SVG sentence, moved into a <p>, is reported"

# ─────────────────────────── sr-only text ───────────────────────────
# 读屏专用的文字（1×1px + overflow:hidden + clip）不画出来，但它的矩形按整段文字算。
# 双语图表名这么放之后，被重叠检查报成了和坐标轴 94% 重叠（atelier dashboard）。
echo "sr-only text"
SR=".sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}"
page "$SR .box{position:relative;height:40px}" "<div class=\"box\"><span class=\"sr\"><span>Average review score by month, seven values</span></span><span>100%</span></div>" > "$D/sr.html"
out="$(run "$R/sr.html")"
t "$(has "$out" "text-overlap")" "no" "a visually-hidden label is not an overlap"
page ".box{position:relative;height:40px} .abs{position:absolute;left:0;top:0;white-space:nowrap}" "<div class=\"box\"><span class=\"abs\"><span>Average review score by month, seven values</span></span><span>100%</span></div>" > "$D/sr-control.html"
out="$(run "$R/sr-control.html")"
t "$(has "$out" "text-overlap")" "yes" "(control) the same label drawn on top of it is"

# ─────────────────────────── narrow widths ───────────────────────────
echo "narrow widths"
page ".wide{width:900px;height:40px;background:#eee}" "<div class=\"row\"><div class=\"wide\">wide</div></div>" > "$D/wide.html"
out="$(node "$VA" "$R/wide.html" 2>&1)"; rc=$?
t "$(has "$out" "narrow-overflow-x")" "yes" "a 900px block overflows at 390"
t "$rc" "1" "and it is an error"
t "$(has "$out" "div.row > div.wide")" "yes" "and it names what pushed the page wide"
t "$(has "$out" "page-overflow-x:")" "no" "at 1440 the same page does not overflow (the check is width-specific)"
out="$(node "$VA" --no-narrow "$R/wide.html" 2>&1)"; rc=$?
t "$rc" "0" "--no-narrow skips it"
out="$(node "$VA" '--waive=visual-audit:narrow-overflow-x|desktop-only tool' "$R/wide.html" 2>&1)"; rc=$?
t "$rc" "0" "a DESIGN.md waiver demotes it"
t "$(has "$out" "[waived] visual-audit:narrow-overflow-x")" "yes" "and the waiver is printed, not hidden"
# 盒子没越界、里面的字越界了：清单要指到那个装字的元素，而不是无关的邻居。
# 第一版清单只看盒子边缘，在真实页面上（64px 的「237,950★」挤在半屏格子里）
# 指错了元素。minmax(0,1fr) 是还原那页的条件：格子不许被字撑开（普通 1fr 会被撑开，
# 页面根本不溢出，这个探针就打空了 —— 第一版就是这样；数字放第二列也是同一个原因：
# 放第一列时从左边排 290px 还没到屏幕边）。
page ".cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)} .num{display:block;font-size:64px;white-space:nowrap}" "<div class=\"cols\"><div>a</div><div><span class=\"num\">237,950★</span></div></div>" > "$D/spill.html"
out="$(node "$VA" --no-second-viewport "$R/spill.html" 2>&1)"
t "$(has "$out" "div > span.num")" "yes" "text spilling out of a box that fits: the list names the box holding it"
page ".wide{width:900px;height:40px;background:#eee} .pan{overflow-x:auto}" "<div class=\"pan\"><div class=\"wide\">wide</div></div>" > "$D/pan.html"
out="$(node "$VA" "$R/pan.html" 2>&1)"; rc=$?
t "$(has "$out" "narrow-overflow-x")" "no" "the same block inside a pan container does not"
# 390 放得下（≤600 一列、图缩到 300），1024 也放得下（两列各 488），只有 768/900 两列
# 放不下两张 450 的图（两列都要放图：只放一列时 1fr 会把空间让给它，探针打空）。只测 390 的第一版就放过了这种页 —— 全仓扫出来 11 页。
page ".two{display:grid;grid-template-columns:1fr 1fr;gap:0} .fig{width:450px;height:30px;background:#eee} @media (max-width:600px){.two{grid-template-columns:1fr} .fig{width:300px}}" "<div class=\"two\"><div class=\"fig\">f</div><div class=\"fig\">g</div></div>" > "$D/tablet.html"
out="$(node "$VA" "$R/tablet.html" 2>&1)"; rc=$?
t "$(has "$out" "in a 768px viewport")" "yes" "a page that only overflows between phone and desktop widths is reported at 768"
t "$(has "$out" "in a 390px viewport")" "no" "and not at 390, where it fits"
t "$rc" "1" "and it fails the page"

echo ""
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
