#!/usr/bin/env bash
# install.sh — 装/升级/卸载 sky-skills 自动更新提示器(多 CLI:Claude Code / Codex / Gemini CLI)。
#
#   install   (默认) 探测已装的 CLI,把 hook 接进各自配置;链接脚本/skill;播种 repos
#   upgrade   同 install,但保留已有 repos 配置
#   uninstall 反向移除(各 CLI 的 hook、Claude 的 skill symlink 与 CLAUDE.md 段;repos 保留)
#   --dry-run 只打印将做什么,不动文件(可与上面任意子命令组合)
#
# 检测+更新核心是 CLI 无关的纯 shell;三家 hook 都用相同的 hookSpecificOutput.additionalContext。
# 差异仅:配置文件位置、Gemini 用 BeforeAgent 代替 UserPromptSubmit。
# 幂等:重复跑不重复接入(按 hook 脚本路径精确剔除旧 entry)。改配置前自动备份 .bak。

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"        # <clone>/autoupdate
CLONE="$(cd "$SCRIPT_DIR/.." && pwd)"              # <clone>
CONF_DIR="${SKYUP_HOME:-$HOME/.config/sky-skills-autoupdate}"   # CLI 无关:repos + cache
REPOS="${SKYUP_REPOS:-$CONF_DIR/repos}"
CLAUDE_MD="$HOME/.claude/CLAUDE.md"
SKILL_LINK="$HOME/.claude/skills/skills-sync"
FRAGMENT="$SCRIPT_DIR/claude-md-fragment.md"
MARK_BEGIN="<!-- BEGIN: sky-skills-autoupdate v1 -->"
MARK_END="<!-- END: sky-skills-autoupdate v1 -->"

SS_CMD="bash \"$SCRIPT_DIR/hooks/session-start.sh\""
UPS_CMD="bash \"$SCRIPT_DIR/hooks/prompt-submit.sh\""
BA_CMD="bash \"$SCRIPT_DIR/hooks/before-agent.sh\""
# 精确识别本工具的 hook command(幂等剔除用),匹配三个入口脚本路径
STRIP_RE="autoupdate/hooks/(session-start|prompt-submit|before-agent)"

CMD="install"; DRY=0
for a in "$@"; do
  case "$a" in
    install|upgrade|uninstall) CMD="$a" ;;
    --dry-run) DRY=1 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "未知参数: $a" >&2; exit 2 ;;
  esac
done

say()  { printf '%s\n' "$*"; }
need() { command -v "$1" >/dev/null 2>&1 || { echo "缺少依赖: $1" >&2; exit 3; }; }
need git
[ "$CMD" = uninstall ] || need jq

backup()      { [ -f "$1" ] || return 0; if [ "$DRY" = 1 ]; then say "  [dry-run] cp $1 $1.bak"; else cp "$1" "$1.bak"; fi; }
ensure_json() { [ -f "$1" ] && return 0; if [ "$DRY" = 1 ]; then say "  [dry-run] 新建 $1 = {}"; else mkdir -p "$(dirname "$1")"; printf '{}' > "$1"; fi; }

merge_one_hook() {   # <file> <event> <command>
  local file="$1" ev="$2" cmd="$3"
  if [ "$DRY" = 1 ]; then say "  [dry-run] $file ← hooks.$ev += $cmd"; return; fi
  ensure_json "$file"
  local tmp; tmp="$(mktemp "${file%/*}/.skyup.XXXXXX")"
  jq --arg ev "$ev" --arg cmd "$cmd" --arg re "$STRIP_RE" '
    .hooks = (.hooks // {})
    | .hooks[$ev] = ((((.hooks[$ev]) // [])
        | map(select((.hooks // []) | map(.command) | any(test($re)) | not)))
        + [{hooks:[{type:"command", command:$cmd}]}])
  ' "$file" > "$tmp" && mv "$tmp" "$file"
}

unmerge_hooks() {    # <file> <event...>
  local file="$1"; shift
  [ -f "$file" ] || return 0
  backup "$file"
  if [ "$DRY" = 1 ]; then say "  [dry-run] 从 $file 摘掉本工具 hook"; return; fi
  for ev in "$@"; do
    local tmp; tmp="$(mktemp "${file%/*}/.skyup.XXXXXX")"
    jq --arg ev "$ev" --arg re "$STRIP_RE" '
      if (.hooks[$ev]?) then .hooks[$ev] = ((.hooks[$ev]) | map(select((.hooks // []) | map(.command) | any(test($re)) | not))) else . end
    ' "$file" > "$tmp" && mv "$tmp" "$file"
  done
}

install_claude() { local f="$HOME/.claude/settings.json"; say "  [Claude Code] $f"; backup "$f"
  merge_one_hook "$f" SessionStart "$SS_CMD"; merge_one_hook "$f" UserPromptSubmit "$UPS_CMD"; }
install_codex()  { local f="$HOME/.codex/hooks.json";    say "  [Codex] $f";       backup "$f"
  merge_one_hook "$f" SessionStart "$SS_CMD"; merge_one_hook "$f" UserPromptSubmit "$UPS_CMD"; }
install_gemini() { local f="$HOME/.gemini/settings.json"; say "  [Gemini CLI] $f";  backup "$f"
  merge_one_hook "$f" SessionStart "$SS_CMD"; merge_one_hook "$f" BeforeAgent "$BA_CMD"; }

write_claude_md() {
  backup "$CLAUDE_MD"
  if [ "$DRY" = 1 ]; then say "  [dry-run] 在 ~/.claude/CLAUDE.md 插/更新规则段"; return; fi
  touch "$CLAUDE_MD"
  awk -v b="$MARK_BEGIN" -v e="$MARK_END" '$0==b{skip=1} skip&&$0==e{skip=0; next} !skip' "$CLAUDE_MD" > "$CLAUDE_MD.tmp" && mv "$CLAUDE_MD.tmp" "$CLAUDE_MD"
  printf '\n' >> "$CLAUDE_MD"; cat "$FRAGMENT" >> "$CLAUDE_MD"
}
remove_claude_md() {
  [ -f "$CLAUDE_MD" ] || return 0; backup "$CLAUDE_MD"
  if [ "$DRY" = 1 ]; then say "  [dry-run] 从 CLAUDE.md 删规则段"; return; fi
  awk -v b="$MARK_BEGIN" -v e="$MARK_END" '$0==b{skip=1} skip&&$0==e{skip=0; next} !skip' "$CLAUDE_MD" > "$CLAUDE_MD.tmp" && mv "$CLAUDE_MD.tmp" "$CLAUDE_MD"
}
link_skill() {
  if [ "$DRY" = 1 ]; then say "  [dry-run] ln -s $CLONE/skills/skills-sync $SKILL_LINK"; return; fi
  mkdir -p "$HOME/.claude/skills"; rm -f "$SKILL_LINK"; ln -s "$CLONE/skills/skills-sync" "$SKILL_LINK"
}

seed_repos() {
  if [ -f "$REPOS" ]; then say "  repos 已存在,保留: $REPOS"; return; fi
  if [ "$DRY" = 1 ]; then say "  [dry-run] 播种 $REPOS(写入 $CLONE + 探测到的 skill 仓)"; return; fi
  mkdir -p "$CONF_DIR/cache"; cp "$SCRIPT_DIR/repos.txt.template" "$REPOS"
  {
    echo "$CLONE"
    for s in "$HOME"/.claude/skills/*; do
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
    [ "$DRY" = 1 ] || chmod +x "$SCRIPT_DIR/hooks/"*.sh "$SCRIPT_DIR/bin/"*.sh
    detected=0
    if [ -d "$HOME/.claude" ]; then install_claude; write_claude_md; link_skill; detected=$((detected+1)); fi
    if [ -d "$HOME/.codex" ];  then install_codex;  detected=$((detected+1)); fi
    if [ -d "$HOME/.gemini" ]; then install_gemini; detected=$((detected+1)); fi
    if [ "$detected" = 0 ]; then
      say "⚠ 没探测到 ~/.claude、~/.codex、~/.gemini —— 没有可接入的 CLI。装好任一 CLI 后重跑本脚本。"
    fi
    seed_repos
    say ""
    say "✓ 完成,接入了 $detected 个 CLI。重启对应 CLI 让 hook 生效。"
    say "  手动检查(Claude): /skills-sync"
    say "  通用脚本: bash $SCRIPT_DIR/hooks/check-update.sh --report"
    say "  配置(可加多仓): $REPOS"
    ;;
  uninstall)
    say "== sky-skills-autoupdate uninstall =="
    unmerge_hooks "$HOME/.claude/settings.json" SessionStart UserPromptSubmit
    unmerge_hooks "$HOME/.codex/hooks.json"     SessionStart UserPromptSubmit
    unmerge_hooks "$HOME/.gemini/settings.json" SessionStart BeforeAgent
    remove_claude_md
    if [ "$DRY" = 1 ]; then say "  [dry-run] rm $SKILL_LINK"; else rm -f "$SKILL_LINK"; fi
    say "  (repos 配置保留: $REPOS,如需一并删 rm -rf $CONF_DIR)"
    say "✓ 已卸载。重启对应 CLI 生效。"
    ;;
esac
