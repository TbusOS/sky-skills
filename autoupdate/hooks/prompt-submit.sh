#!/usr/bin/env bash
# UserPromptSubmit hook 入口 — 做事中检测远端更新(节流 30 分钟,避免每次输入都联网）。
# 委托给 check-update.sh;只读,有更新才注入提示。
exec bash "$(cd "$(dirname "$0")" && pwd)/check-update.sh" --event UserPromptSubmit --throttle 1800
