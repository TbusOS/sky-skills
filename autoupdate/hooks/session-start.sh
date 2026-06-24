#!/usr/bin/env bash
# SessionStart hook 入口 — 开会话时检测远端更新(节流 5 分钟)。
# 委托给 check-update.sh;只读,有更新才注入提示。
exec bash "$(cd "$(dirname "$0")" && pwd)/check-update.sh" --event SessionStart --throttle 300
