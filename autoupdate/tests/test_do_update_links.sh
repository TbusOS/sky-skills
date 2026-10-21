#!/usr/bin/env bash
# 回归测试：do-update.sh 补 skill 软链接，不能只在 pull 成功时做。
#
# 起因：仓库是手动 pull 的（或上次被跳过），下次跑 do-update 时它已是最新，
# 旧脚本在「已是最新」那里直接 continue，新 skill 永远链接不上。
#
# 用法：bash autoupdate/tests/test_do_update_links.sh [do-update.sh 路径]
#       BASH_BIN=/bin/bash bash ...   换一个 bash 跑被测脚本（macOS 自带的是 3.2）
# 退出码：全部通过为 0。

set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="${1:-$HERE/../bin/do-update.sh}"
BASH_BIN="${BASH_BIN:-bash}"

T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT
export HOME="$T/home"
SK="$HOME/.claude/skills"
mkdir -p "$SK"

g() { git -c user.name=t -c user.email=t@example.com "$@"; }

# 远端 + 本地 clone，两边一致（已是最新）。clone 里有三个 skill：
#   new-skill   从没链接过 → 应当补上
#   linked      已经链接过 → 不动
#   occupied    同名位置被一个真目录占着 → 不能覆盖
git init -q --bare "$T/remote.git"
git clone -q "$T/remote.git" "$T/clone" 2>/dev/null
for s in new-skill linked occupied; do
  mkdir -p "$T/clone/skills/$s"
  echo "name: $s" > "$T/clone/skills/$s/SKILL.md"
done
g -C "$T/clone" add -A
g -C "$T/clone" commit -qm init
g -C "$T/clone" push -q -u origin HEAD 2>/dev/null
ln -s "$T/clone/skills/linked" "$SK/linked"
mkdir -p "$SK/occupied" && echo mine > "$SK/occupied/keep.txt"
printf '%s\n' "$T/clone" > "$T/repos"

run() { SKYUP_REPOS="$T/repos" "$BASH_BIN" "$SCRIPT" 2>&1; }

fail=0
check() {  # check <描述> <条件命令...>
  local desc="$1"; shift
  if "$@"; then echo "  通过：$desc"; else echo "  失败：$desc"; fail=1; fi
}
contains() { case "$1" in *"$2"*) return 0 ;; *) return 1 ;; esac; }

out1="$(run)"
check "前提：仓库已是最新" contains "$out1" "已是最新"
check "已是最新的仓库，新 skill 也补上软链接" \
  test "$(readlink "$SK/new-skill" 2>/dev/null)" = "$T/clone/skills/new-skill"
check "补了链接就提示重启" contains "$out1" "重启"
check "已有的链接不变" test "$(readlink "$SK/linked")" = "$T/clone/skills/linked"
check "同名真目录不被覆盖" test "$(cat "$SK/occupied/keep.txt" 2>/dev/null)" = "mine"

out2="$(run)"
check "第二次运行不再报新链接" sh -c '! printf "%s" "$1" | grep -q "新 skill 已链接"' _ "$out2"
check "第二次运行不再提示重启" sh -c '! printf "%s" "$1" | grep -q "重启"' _ "$out2"

# 原来就支持的情况也不能坏：新 skill 是这次 pull 下来的
git clone -q "$T/remote.git" "$T/other" 2>/dev/null
mkdir -p "$T/other/skills/pulled-skill"
echo "name: pulled-skill" > "$T/other/skills/pulled-skill/SKILL.md"
g -C "$T/other" add -A
g -C "$T/other" commit -qm "add pulled-skill"
g -C "$T/other" push -q 2>/dev/null
out3="$(run)"
check "前提：这次真的 pull 了" contains "$out3" "已更新 1 个提交"
check "pull 下来的新 skill 补上软链接" \
  test "$(readlink "$SK/pulled-skill" 2>/dev/null)" = "$T/clone/skills/pulled-skill"

if [ "$fail" -ne 0 ]; then
  printf '\n第一次运行的输出：\n%s\n' "$out1"
  exit 1
fi
echo "全部通过"
