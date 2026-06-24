#!/usr/bin/env bash
# do-update.sh — 用户确认后执行更新(会改仓库)。
#
# 对 repos 列表里每个落后的仓:
#   1) 工作树不干净 → 跳过(不强 pull,避免冲突)
#   2) git pull --ff-only(只快进;分叉则停下让用户手动处理)
#   3) 给 clone/skills/ 下的新 skill 目录在 ~/.claude/skills/ 补 symlink
#   4) 报告拉到的提交;涉及新 skill / hook 变更则提示重启 Claude Code
#
# 不锁 PATH:可分发工具,用使用者环境的 git。

set -uo pipefail

CONF_DIR="${SKYUP_HOME:-$HOME/.config/sky-skills-autoupdate}"
REPOS_FILE="${SKYUP_REPOS:-$CONF_DIR/repos}"
SKILLS_DIR="$HOME/.claude/skills"   # 新 skill 补 symlink 仅对 Claude Code 有意义

[ -f "$REPOS_FILE" ] || { echo "没有 repos 配置：$REPOS_FILE（先跑 install.sh）"; exit 1; }

restart_needed=0
any=0

while IFS= read -r line; do
  repo="${line%%#*}"
  repo="$(printf '%s' "$repo" | xargs 2>/dev/null)"
  [ -z "$repo" ] && continue
  [ -d "$repo/.git" ] || { echo "跳过(非 git 仓)：$repo"; continue; }
  name="$(basename "$repo")"
  any=1

  if [ -n "$(git -C "$repo" status --porcelain 2>/dev/null)" ]; then
    echo "【${name}】本地有未提交改动，已跳过——请先处理：cd \"$repo\" && git status"
    continue
  fi

  git -C "$repo" rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1 \
    || { echo "【${name}】没有 upstream，跳过"; continue; }

  # 先 fetch 一下拿最新远端状态
  timeout 8 git -C "$repo" fetch --quiet 2>/dev/null || true
  behind="$(git -C "$repo" rev-list --count 'HEAD..@{u}' 2>/dev/null || echo 0)"
  case "$behind" in ''|*[!0-9]*) behind=0 ;; esac
  if [ "$behind" -eq 0 ]; then echo "【${name}】已是最新"; continue; fi

  before="$(git -C "$repo" rev-parse HEAD)"
  if git -C "$repo" pull --ff-only --quiet 2>/dev/null; then
    echo "【${name}】已更新 ${behind} 个提交："
    git -C "$repo" log --no-merges --format='  · %s' "${before}..HEAD" 2>/dev/null | head -20

    # 给新 skill 补 symlink(仅当本机装了 Claude Code,~/.claude 存在)
    if [ -d "$repo/skills" ] && [ -d "$HOME/.claude" ]; then
      for d in "$repo"/skills/*/; do
        [ -d "$d" ] || continue
        sn="$(basename "$d")"
        if [ ! -e "$SKILLS_DIR/$sn" ]; then
          mkdir -p "$SKILLS_DIR"
          if ln -s "${d%/}" "$SKILLS_DIR/$sn" 2>/dev/null; then
            echo "  + 新 skill 已链接：$sn"
            restart_needed=1
          fi
        fi
      done
    fi

    # 改了 hook 脚本或 SKILL.md → 需重启才完全生效
    if git -C "$repo" diff --name-only "${before}..HEAD" 2>/dev/null \
         | grep -qE "autoupdate/hooks/|/SKILL\.md$"; then
      restart_needed=1
    fi
  else
    echo "【${name}】git pull --ff-only 失败（本地与远端可能分叉）——请手动处理："
    echo "         cd \"$repo\" && git status && git log --oneline -5"
  fi
done < "$REPOS_FILE"

[ "$any" -eq 0 ] && echo "repos 列表为空：$REPOS_FILE"
if [ "$restart_needed" -eq 1 ]; then
  printf '\n⚠ 涉及新 skill 或 hook 变更，请重启 Claude Code 让其完全生效。\n'
fi
echo "完成。"
