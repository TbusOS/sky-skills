#!/usr/bin/env bash
# Gemini CLI BeforeAgent hook 入口 — 用户提交后、agent 规划前检测远端更新（节流 30 分钟）。
# Gemini 没有 UserPromptSubmit;BeforeAgent 是做事中最接近的注入点。
# 委托给 check-update.sh;只读,有更新才注入 additionalContext。
exec bash "$(cd "$(dirname "$0")" && pwd)/check-update.sh" --event BeforeAgent --throttle 1800
