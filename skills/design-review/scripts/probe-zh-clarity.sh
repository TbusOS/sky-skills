#!/usr/bin/env bash
# 探针:故意把页面改坏,确认 cjk-numeric-entity 和 undefined-jargon 两道检查真的会响。
# 一道触发不了的检查是死代码 —— 装了跟没装一样,还让人以为有防护。
# 用法:probe-zh-clarity.sh <一个已经通过检查的中文 HTML>
set -u
SRC="${1:-}"
[ -f "$SRC" ] || { echo "用法: $0 <一个能通过检查的中文 HTML>"; exit 2; }
V="$(dirname "$0")/verify.py"
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0
chk() { # chk <说明> <期望:hit|clean> <文件>
  out=$(python3 "$V" "$3" 2>&1)
  if [ "$2" = hit ]; then
    if echo "$out" | grep -q "$4"; then echo "  ok   $1 -> 报了"; pass=$((pass+1))
    else echo "  FAIL $1 -> 应该报却没报"; echo "$out" | sed 's/^/       /'; fail=$((fail+1)); fi
  else
    if echo "$out" | grep -q "$4"; then echo "  FAIL $1 -> 不该报却报了"; fail=$((fail+1))
    else echo "  ok   $1 -> 没报"; pass=$((pass+1)); fi
  fi
}

echo "探针 · 中文表达清晰度两道检查   基准页: $SRC"

# ── 基准:原样应当两道都不报
cp "$SRC" "$T/base.html"
chk "基准页 · 数字实体检查"  clean "$T/base.html" "numeric HTML entities"
chk "基准页 · 术语定义检查"  clean "$T/base.html" "no definition anywhere"

# ── 注入 1:把「帧」写成手算的数字实体(而且算错,变成「帖」)
#    这正是 2026-09-01 真实踩到的那个坑
python3 - "$T/base.html" "$T/entity.html" <<'PY'
import sys
s = open(sys.argv[1], encoding="utf-8").read()
s = s.replace("一帧", "&#24086;", 3) if "一帧" in s else s.replace("</body>",
    '<p><span class="lang-zh">&#19968;&#24086;&#26159; 9.89 MiB</span></p></body>')
open(sys.argv[2], "w", encoding="utf-8").write(s)
PY
chk "注入手写 CJK 实体"      hit   "$T/entity.html" "numeric HTML entities"

# ── 注入 2:整页用术语但一个都不解释(删掉术语表结构 + 所有定义句式)
python3 - "$T/base.html" "$T/nodef.html" <<'PY'
import re, sys
s = open(sys.argv[1], encoding="utf-8").read()
s = re.sub(r'class="([^"]*)(term|glossary|def)([^"]*)"', r'class="\1x\3"', s)
s = re.sub(r'<dt\b', '<span', s)
# 把定义句式拆掉,让「用了词但没定义」成立
for w in ("是", "指", "就是", "即", "意思是", "叫做", "叫"):
    s = s.replace(f"缓冲{w}", "缓冲、").replace(f"输出{w}", "输出、")
s = re.sub(r'(帧缓冲|前缓冲|后缓冲|扫描输出|行缓冲|主设备|页表|翻页|撕裂|欠载)(.{0,40}?)(是|指|就是|即|意思是|叫做|叫)',
           r'\1\2、', s)
open(sys.argv[2], "w", encoding="utf-8").write(s)
PY
chk "注入术语全不定义"        hit   "$T/nodef.html" "no definition anywhere"

# ── 注入 3:把双语页压成**单语页**(拆掉 lang-zh span、删掉 lang-en),再去掉定义。
#    2026-09-01 发现的漏洞:检查只扫 lang-zh span,纯中文页待检文本恒为空,
#    整道闸空转 —— 一批纯中文报告 err=0 warn=0 全绿,而正文里 5 个术语没定义。
#    这条用例就是那个漏洞的回归测试:修好之前它必然 FAIL。
python3 - "$T/nodef.html" "$T/mono.html" <<'PY2'
import re, sys
s = open(sys.argv[1], encoding="utf-8").read()
s = re.sub(r'<span class=["\']lang-en["\']\s*>.*?</span>', '', s, flags=re.S)
s = re.sub(r'<span class=["\']lang-zh["\']\s*>(.*?)</span>', r'\1', s, flags=re.S)
open(sys.argv[2], "w", encoding="utf-8").write(s)
PY2
echo "  (单语页 lang-zh span 残留: $(grep -o 'lang-zh' "$T/mono.html" | wc -l | tr -d ' '))"
chk "单语页术语全不定义"      hit   "$T/mono.html" "no definition anywhere"

echo "探针结果: $pass 通过, $fail 失败"
[ "$fail" -eq 0 ]
