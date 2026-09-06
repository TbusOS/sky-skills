#!/bin/bash
# 单文件约束:页面里不许有外部引用(只放行 Google Fonts)
set -u
F="${1:?用法: check_selfcontained.sh <页面.html>}"
[ -f "$F" ] || { echo "找不到文件: $F"; exit 2; }
# 白名单说明:
#   fonts.googleapis / gstatic —— 字体,项目约定允许
#   w3.org                     —— SVG 命名空间,不产生网络请求
#   ALLOW_HOSTS 环境变量       —— 逗号分隔,追加放行(如站点统计 goatcounter)
EXTRA="${ALLOW_HOSTS:-}"
BAD=$(grep -oE 'https?://[^"'"'"' )]+' "$F" \
      | grep -vE '^https://fonts\.(googleapis|gstatic)\.com' \
      | grep -vE '^https?://(www\.)?w3\.org' \
      | { if [ -n "$EXTRA" ]; then grep -vE "^https?://($(echo "$EXTRA" | sed 's/,/|/g; s/\./\\./g'))"; else cat; fi; } \
      | sort -u)
if [ -n "$BAD" ]; then
  echo "不通过:发现 $(echo "$BAD" | wc -l | tr -d ' ') 处外部引用"
  echo "$BAD" | sed 's/^/  /'
  exit 1
fi
echo "通过:无外部引用(Google Fonts 除外)"
