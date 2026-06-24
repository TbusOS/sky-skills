#!/usr/bin/env bash
# install.sh — 装/升级/卸载 sky-skills 自动更新提示器。
#
#   install   (默认) 接两个 hook 进 settings.json、链接脚本、播种 repos、插 CLAUDE.md 规则
#   upgrade   同 install,但保留已有 repos 配置
#   uninstall 反向移除(settings.json hook、symlink、CLAUDE.md 段;repos 配置保留)
#   --dry-run 只打印将做什么,不动文件(可与上面任意子命令组合)
#
# 幂等:重复跑不会重复接入。改 settings.json / CLAUDE.md 前自动备份 .bak。

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"        # <clone>/autoupdate
CLONE="$(cd "$SCRIPT_DIR/.." && pwd)"              # <clone>
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
SETTINGS="$CLAUDE_DIR/settings.json"
CLAUDE_MD="$CLAUDE_DIR/CLAUDE.md"
HOOK_LINK="$CLAUDE_DIR/hooks/sky-skills-autoupdate"
SKILL_LINK="$CLAUDE_DIR/skills/skills-sync"
REPOS="$CLAUDE_DIR/sky-skills-autoupdate.repos"
FRAGMENT="$SCRIPT_DIR/claude-md-fragment.md"
MARK_BEGIN="<!-- BEGIN: sky-skills-autoupdate v1 -->"
MARK_END="<!-- END: sky-skills-autoupdate v1 -->"

SS_CMD="bash \"$HOOK_LINK/hooks/session-start.sh\""
UPS_CMD="bash \"$HOOK_LINK/hooks/prompt-submit.sh\""

CMD="install"; DRY=0
for a in "$@"; do
  case "$a" in
    install|upgrade|uninstall) CMD="$a" ;;
    --dry-run) DRY=1 ;;
    -h|--help) sed -n '2,11p' "$0"; exit 0 ;;
    *) echo "未知参数: $a" >&2; exit 2 ;;
  esac
done

say()  { printf '%s\n' "$*"; }
run()  { if [ "$DRY" = 1 ]; then say "  [dry-run] $*"; else eval "$*"; fi; }
need() { command -v "$1" >/dev/null 2>&1 || { echo "缺少依赖: $1" >&2; exit 3; }; }

need git
[ "$CMD" = uninstall ] || need jq

backup() { [ -f "$1" ] && run "cp \"$1\" \"$1.bak\""; }

merge_settings() {
  # 先剔除本工具旧 entry(command 含 sky-skills-autoupdate),再追加,保证幂等。
  [ -f "$SETTINGS" ] || run "printf '{}' > \"$SETTINGS\""
  backup "$SETTINGS"
  local jqprog='
    def strip(arr): (arr // []) | map(select((.hooks // []) | map(.command) | any(test("sky-skills-autoupdate")) | not));
    .hooks = (.hooks // {})
    | .hooks.SessionStart    = (strip(.hooks.SessionStart)    + [{hooks:[{type:"command", command:$ss}]}])
    | .hooks.UserPromptSubmit = (strip(.hooks.UserPromptSubmit) + [{hooks:[{type:"command", command:$ups}]}])
  '
  if [ "$DRY" = 1 ]; then
    say "  [dry-run] jq 接入 SessionStart: $SS_CMD"
    say "  [dry-run] jq 接入 UserPromptSubmit: $UPS_CMD"
  else
    tmp="$(mktemp "$CLAUDE_DIR/.skyup.XXXXXX")"
    jq --arg ss "$SS_CMD" --arg ups "$UPS_CMD" "$jqprog" "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"
  fi
}

unmerge_settings() {
  [ -f "$SETTINGS" ] || return 0
  backup "$SETTINGS"
  local jqprog='
    def strip(arr): (arr // []) | map(select((.hooks // []) | map(.command) | any(test("sky-skills-autoupdate")) | not));
    .hooks.SessionStart = strip(.hooks.SessionStart)
    | .hooks.UserPromptSubmit = strip(.hooks.UserPromptSubmit)
  '
  if [ "$DRY" = 1 ]; then say "  [dry-run] 从 settings.json 摘掉本工具 hook";
  else tmp="$(mktemp "$CLAUDE_DIR/.skyup.XXXXXX")"; jq "$jqprog" "$SETTINGS" > "$tmp" && mv "$tmp" "$SETTINGS"; fi
}

write_claude_md() {
  backup "$CLAUDE_MD"
  if [ "$DRY" = 1 ]; then say "  [dry-run] 在 CLAUDE.md 插/更新 sky-skills-autoupdate 规则段"; return; fi
  touch "$CLAUDE_MD"
  # 删旧段(BEGIN..END)再追加新段
  awk -v b="$MARK_BEGIN" -v e="$MARK_END" '
    $0==b{skip=1} skip&&$0==e{skip=0; next} !skip' "$CLAUDE_MD" > "$CLAUDE_MD.tmp" && mv "$CLAUDE_MD.tmp" "$CLAUDE_MD"
  printf '\n' >> "$CLAUDE_MD"; cat "$FRAGMENT" >> "$CLAUDE_MD"
}

remove_claude_md() {
  [ -f "$CLAUDE_MD" ] || return 0
  backup "$CLAUDE_MD"
  if [ "$DRY" = 1 ]; then say "  [dry-run] 从 CLAUDE.md 删除规则段"; return; fi
  awk -v b="$MARK_BEGIN" -v e="$MARK_END" '
    $0==b{skip=1} skip&&$0==e{skip=0; next} !skip' "$CLAUDE_MD" > "$CLAUDE_MD.tmp" && mv "$CLAUDE_MD.tmp" "$CLAUDE_MD"
}

seed_repos() {
  if [ -f "$REPOS" ] && [ "$CMD" = upgrade ]; then say "  保留已有 repos 配置: $REPOS"; return; fi
  if [ -f "$REPOS" ]; then say "  repos 已存在,保留: $REPOS"; return; fi
  if [ "$DRY" = 1 ]; then say "  [dry-run] 播种 $REPOS(写入 $CLONE + 探测到的 skill 仓)"; return; fi
  cp "$SCRIPT_DIR/repos.txt.template" "$REPOS"
  {
    echo "$CLONE"
    for s in "$CLAUDE_DIR"/skills/*; do
      [ -L "$s" ] || continue
      tgt="$(readlink -f "$s" 2>/dev/null)" || continue
      git -C "$tgt" rev-parse --show-toplevel 2>/dev/null || true
    done
  } | sort -u >> "$REPOS"
}

case "$CMD" in
  install|upgrade)
    say "== sky-skills-autoupdate $CMD =="
    say "clone: $CLONE"
    run "mkdir -p \"$CLAUDE_DIR/hooks\" \"$CLAUDE_DIR/skills\" \"$CLAUDE_DIR/.cache/sky-skills-autoupdate\""
    run "chmod +x \"$SCRIPT_DIR/hooks/\"*.sh \"$SCRIPT_DIR/bin/\"*.sh"
    # 脚本目录 symlink(pull 即更新)
    run "rm -f \"$HOOK_LINK\""; run "ln -s \"$SCRIPT_DIR\" \"$HOOK_LINK\""
    # 手动 skill symlink
    run "rm -f \"$SKILL_LINK\""; run "ln -s \"$CLONE/skills/skills-sync\" \"$SKILL_LINK\""
    merge_settings
    write_claude_md
    seed_repos
    say ""
    say "✓ 完成。重启 Claude Code 让 hook 生效。"
    say "  手动检查: /skills-sync   ·   配置: $REPOS"
    ;;
  uninstall)
    say "== sky-skills-autoupdate uninstall =="
    unmerge_settings
    remove_claude_md
    run "rm -f \"$HOOK_LINK\" \"$SKILL_LINK\""
    say "  (repos 配置保留: $REPOS,如需一并删除请手动 rm)"
    say "✓ 已卸载。重启 Claude Code 生效。"
    ;;
esac
