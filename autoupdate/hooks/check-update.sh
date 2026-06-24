#!/usr/bin/env bash
# check-update.sh — sky-skills 自动更新检测器(只读)。
#
# 对 repos 列表里的每个 git 仓:节流 fetch + 比对本地与远端(@{u}),落后就报告。
# 两种模式:
#   (默认 hook 模式) 落后时输出 {"hookSpecificOutput":{...,"additionalContext":...}},
#                    让 Claude 主动提示用户;无更新则静默(不打扰)。
#   --report         人类可读地打印各仓状态(给 /skills-sync 手动用)。
#
# 绝不改仓库:只 fetch + 比对。实际更新由 bin/do-update.sh 在用户确认后执行。
# 不锁 PATH:这是可分发工具,要用使用者环境里的 git/jq/timeout。

set -uo pipefail

# CLI 无关:配置与缓存放统一位置,Claude/Codex/Gemini 共用同一份
CONF_DIR="${SKYUP_HOME:-$HOME/.config/sky-skills-autoupdate}"
REPOS_FILE="${SKYUP_REPOS:-$CONF_DIR/repos}"
CACHE_DIR="$CONF_DIR/cache"

# do-update.sh 的真实路径(脚本自身在 clone/autoupdate/hooks/,更新器在 ../bin/),
# 任何 CLI 看到提示都能照这个绝对路径跑。
SELF_DIR="$(cd "$(dirname "$0")" && pwd)"
DO_UPDATE="$(cd "$SELF_DIR/../bin" 2>/dev/null && pwd)/do-update.sh"

EVENT="UserPromptSubmit"
MODE="hook"
THROTTLE=1800   # 秒;hook 入口会按事件覆盖

while [ $# -gt 0 ]; do
  case "$1" in
    --event)    EVENT="$2"; shift 2 ;;
    --throttle) THROTTLE="$2"; shift 2 ;;
    --report)   MODE="report"; shift ;;
    *)          shift ;;
  esac
done

[ -f "$REPOS_FILE" ] || exit 0          # 没配置 → 静默
mkdir -p "$CACHE_DIR" 2>/dev/null || true

emit_hook=""
emit_report=""

while IFS= read -r line; do
  repo="${line%%#*}"                    # 去行内注释
  repo="$(printf '%s' "$repo" | xargs 2>/dev/null)"   # 去首尾空白
  [ -z "$repo" ] && continue
  [ -d "$repo/.git" ] || continue
  name="$(basename "$repo")"

  # 节流 fetch(report 模式总是刷新)
  hash="$(printf '%s' "$repo" | cksum | cut -d' ' -f1)"
  stamp="$CACHE_DIR/$hash.lastfetch"
  now="$(date +%s 2>/dev/null || echo 0)"
  last=0; [ -f "$stamp" ] && last="$(cat "$stamp" 2>/dev/null || echo 0)"
  if [ "$MODE" = "report" ] || [ $((now - last)) -ge "$THROTTLE" ]; then
    if timeout 5 git -C "$repo" fetch --quiet 2>/dev/null; then
      printf '%s' "$now" > "$stamp" 2>/dev/null || true
    fi
  fi

  # 需要有 upstream 才比对
  git -C "$repo" rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1 || continue
  behind="$(git -C "$repo" rev-list --count 'HEAD..@{u}' 2>/dev/null || echo 0)"
  case "$behind" in ''|*[!0-9]*) behind=0 ;; esac

  if [ "$behind" -gt 0 ]; then
    titles="$(git -C "$repo" log --no-merges --format='· %s' 'HEAD..@{u}' 2>/dev/null | head -8)"
    shown="$(printf '%s\n' "$titles" | grep -c '·' || echo 0)"
    more=$((behind - shown))
    [ "$more" -gt 0 ] && titles="$titles
· …及另 $more 条"
    emit_hook="${emit_hook}【${name}】远端领先 ${behind} 个提交：
${titles}
"
    emit_report="${emit_report}${name}: 落后 ${behind} 个提交
${titles}

"
  else
    emit_report="${emit_report}${name}: 已是最新

"
  fi
done < "$REPOS_FILE"

if [ "$MODE" = "report" ]; then
  printf '%s' "${emit_report:-(repos 列表为空：$REPOS_FILE)}"
  exit 0
fi

# hook 模式：只有有更新才注入提示
[ -z "$emit_hook" ] && exit 0

ctx="检测到 skills 仓远端有更新(sky-skills-autoupdate）：
${emit_hook}
请先简洁告诉用户更新了哪些内容，再问是否现在更新。用户确认后运行：
  bash \"$DO_UPDATE\"
(它做 git pull --ff-only + 给新 skill 补 symlink；若涉及新 skill 或 hook 变更，提醒用户重启当前 CLI。)"

if command -v jq >/dev/null 2>&1; then
  jq -n --arg ev "$EVENT" --arg ctx "$ctx" \
    '{hookSpecificOutput:{hookEventName:$ev, additionalContext:$ctx}}'
fi
exit 0
