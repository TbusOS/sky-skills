#!/usr/bin/env bash
#
# check_before_mr.sh — 开 MR 之前跑这个,五项全过才去托管平台点开 MR
#
# 为什么要有它
#     本 skill 原本靠 pre-push hook 的盖章检查(install-hooks.sh
#     --enforce-clean-verify)保证「没过 clean-verify 就推不上去」。
#     但那道检查【不看分支名,任何 push 都拦】。遇到「个人分支随时 push 当备份、
#     做完一整个主题才开 MR」这种流程,它会挡在每一次备份性质的 push 上,
#     逼人每次带 --push-option=allow-unverified。
#
#     绕过一旦变成肌肉记忆,哪天真该拦的那次也会顺手绕过 —— 比关掉更糟,
#     因为还以为有人看着。
#
#     真正该卡的是【开 MR 那一刻】。而开 MR 是托管平台上的动作,不是 git 事件,
#     hook 接不到。所以只能是「人在开 MR 前主动跑一次」—— 而写成散文的规矩会漏,
#     所以做成这个脚本。
#
#     ⇒ 选型建议:push-early / MR-late 的项目,把 enforce_cv 设 0,改用本脚本;
#       每次 push 都该验的项目,继续用 --enforce-clean-verify。
#
# 查什么(五项)
#     M1  gateway 工作区干净           有未提交改动 = 要 MR 的不是手上这份
#     M2  clean-verify 仓在位且是 git   空目录 = 那道关卡从来没建起来过
#     M3  盖章文件存在                  没跑过 clean-verify-run.sh
#     M4  盖章 sha == 待 MR 分支 HEAD   跑过但不是这一版(最容易漏:之后又提交了几笔)
#     M5  远端分支 == 本地 HEAD         本地验过但没推,MR 提的是远端那份旧的
#
# 用法
#     check_before_mr.sh --gateway-dir=<path> --clean-verify-dir=<path> \
#                        --branch=<待 MR 的分支> [--remote=origin]
#     同名大写环境变量亦可:GATEWAY_DIR / CLEAN_VERIFY_DIR / BRANCH / REMOTE
#
#     exit 0 全过 · 1 有项不过 · 2 参数不对
set -uo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

GATEWAY_DIR="${GATEWAY_DIR:-}"; CLEAN_VERIFY_DIR="${CLEAN_VERIFY_DIR:-}"
BRANCH="${BRANCH:-}"; REMOTE="${REMOTE:-origin}"
for a in "$@"; do
  case "$a" in
    --gateway-dir=*)      GATEWAY_DIR="${a#*=}" ;;
    --clean-verify-dir=*) CLEAN_VERIFY_DIR="${a#*=}" ;;
    --branch=*)           BRANCH="${a#*=}" ;;
    --remote=*)           REMOTE="${a#*=}" ;;
    -h|--help)            sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "未知参数: $a" >&2; exit 2 ;;
  esac
done
[ -n "$GATEWAY_DIR" ] || { echo "必须给 --gateway-dir" >&2; exit 2; }
[ -n "$BRANCH" ]      || { echo "必须给 --branch" >&2; exit 2; }
[ -d "$GATEWAY_DIR/.git" ] || { echo "gateway 不是 git 仓: $GATEWAY_DIR" >&2; exit 2; }

fail=0
ok()  { printf '  OK   %-4s %-34s %s\n' "$1" "$2" "${3:-}"; }
bad() { printf '  FAIL %-4s %-34s %s\n' "$1" "$2" "${3:-}"; fail=1; }

echo "==== 开 MR 前检查 ===="
echo "  gateway      $GATEWAY_DIR"
echo "  clean-verify ${CLEAN_VERIFY_DIR:-(没给)}"
echo "  分支         $BRANCH  ->  $REMOTE"
echo

dirty="$(git -C "$GATEWAY_DIR" status --porcelain 2>/dev/null | head -5)"
if [ -z "$dirty" ]; then ok M1 "gateway 工作区干净"
else bad M1 "gateway 有未提交改动" "$(echo "$dirty" | head -1 | cut -c1-40)"; fi

head_sha="$(git -C "$GATEWAY_DIR" rev-parse --verify -q "$BRANCH" 2>/dev/null)"
if [ -z "$head_sha" ]; then
  bad M1 "分支不存在" "$BRANCH"; echo; echo "结果: FAIL"; exit 1
fi

if [ -z "$CLEAN_VERIFY_DIR" ]; then
  bad M2 "没给 --clean-verify-dir" "那道关卡等于不存在"
elif [ -d "$CLEAN_VERIFY_DIR/.git" ]; then
  ok M2 "clean-verify 仓在位" "$CLEAN_VERIFY_DIR"
else
  bad M2 "clean-verify 不是 git 仓" "$CLEAN_VERIFY_DIR (空目录? 先 clone)"
fi

stamp="$GATEWAY_DIR/.git/last-clean-verify"
if [ ! -r "$stamp" ]; then
  bad M3 "没有盖章文件" "先跑 clean-verify-run.sh"
  bad M4 "无从比对" "-"
else
  ok M3 "盖章文件在" "$(awk '{print $2}' "$stamp" 2>/dev/null)"
  st_sha="$(awk '{print $1}' "$stamp" 2>/dev/null)"
  if [ "$st_sha" = "$head_sha" ]; then
    ok M4 "盖章 sha == 分支 HEAD" "${head_sha:0:11}"
  else
    bad M4 "盖章不是这一版" "盖=${st_sha:0:11} 待MR=${head_sha:0:11}"
  fi
fi

rsha="$(git -C "$GATEWAY_DIR" ls-remote "$REMOTE" "refs/heads/$BRANCH" 2>/dev/null | awk '{print $1}')"
if [ -z "$rsha" ]; then
  bad M5 "远端没有这条分支" "先 git push $REMOTE $BRANCH"
elif [ "$rsha" = "$head_sha" ]; then
  ok M5 "远端 == 本地" "${head_sha:0:11}"
else
  bad M5 "远端不是本地这一版" "远端=${rsha:0:11} 本地=${head_sha:0:11}, 先 push"
fi

echo
if [ "$fail" = 0 ]; then echo "结果: OK  五项全过,可以去开 MR"; exit 0
else echo "结果: FAIL  修完再开 MR"; exit 1; fi
