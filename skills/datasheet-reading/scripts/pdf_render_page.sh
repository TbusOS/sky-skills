#!/usr/bin/env bash
# pdf_render_page.sh — 把 PDF 指定页渲染成 PNG,供视觉阅读。
#
# 用于原理图这类必须看走线/NC 标记的场合:文本层只有孤立字符串,
# 判不出谁连谁,也判不出某个位号贴不贴。
#
# 用法:
#   pdf_render_page.sh <file.pdf> <页码> [dpi] [输出目录]
#   pdf_render_page.sh --self-test
# 默认 dpi=200。图形密集的原理图用 300-400。
set -euo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export PYTHONNOUSERSITE=1

if [ "${1:-}" = "--self-test" ]; then
    fail=0
    for t in pdftoppm pdfinfo; do
        if command -v $t >/dev/null 2>&1; then echo "  ok   有 $t"; else echo "  FAIL 缺 $t (装 poppler-utils)"; fail=1; fi
    done
    # 参数校验分支必须挡住空参
    if "$0" >/dev/null 2>&1; then echo "  FAIL 无参数时未报错"; fail=1; else echo "  ok   无参数时报错退出"; fi
    if "$0" /nonexistent.pdf 1 >/dev/null 2>&1; then echo "  FAIL 文件不存在时未报错"; fail=1; else echo "  ok   文件不存在时报错退出"; fi
    [ $fail -eq 0 ] && echo "PASS" || echo "FAIL"
    exit $fail
fi

PDF="${1:?用法: $0 <file.pdf> <页码> [dpi] [输出目录]}"
PAGE="${2:?缺页码}"
DPI="${3:-200}"
OUT="${4:-$(mktemp -d)}"

[ -f "$PDF" ] || { echo "[X] 文件不存在: $PDF" >&2; exit 2; }
mkdir -p "$OUT"

total=$(pdfinfo "$PDF" 2>/dev/null | awk '/^Pages:/{print $2}')
if [ -n "$total" ] && [ "$PAGE" -gt "$total" ] 2>/dev/null; then
    echo "[X] 页码 $PAGE 超出范围(共 $total 页)" >&2; exit 2
fi

base="$OUT/p${PAGE}"
pdftoppm -r "$DPI" -f "$PAGE" -l "$PAGE" -png "$PDF" "$base"
f=$(ls "${base}"*.png 2>/dev/null | head -1)
[ -n "$f" ] || { echo "[X] 渲染失败" >&2; exit 2; }

echo "$f"
echo "-- 用 Read 工具打开上面这个 PNG 查看。看不清就提高 dpi 重渲,或裁剪放大:" >&2
echo "   python3 -c \"from PIL import Image; Image.open('$f').crop((x0,y0,x1,y1)).resize((w*4,h*4), Image.LANCZOS).save('$OUT/crop.png')\"" >&2
