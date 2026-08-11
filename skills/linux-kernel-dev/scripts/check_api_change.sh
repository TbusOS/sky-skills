#!/usr/bin/env bash
#
# check_api_change.sh — 改一个已有函数的契约前,把所有调用点分类摆出来
#
# 为什么需要它
#     函数的「契约」里有一半东西类型系统表达不了:返回值的取值空间、
#     特殊值(-1 / 0 / NULL)到底是错误还是"不适用"、有没有副作用、
#     错误约定是负 errno 还是 -1。改这些东西时**类型没变,编译器一声不吭**,
#     所有调用点照样编过,行为却已经变了。这类问题的典型表现是
#     「功能间歇性失效」而不是崩溃 —— 最难查的一类。
#
#     本脚本不做完整 C 解析(那要 clang)。它做的是:把调用点按【风险模式】
#     分类,定位到人该亲自看的那几行。机器负责别漏,判断留给人 ——
#     与 check_cpp_arms.py 同一思路。
#
# 用法
#     check_api_change.sh <函数名> [--tree <代码树>] [--strict] [--ext <后缀>]
#
#     --tree    要扫的代码树,默认当前目录
#     --strict  把 [魔数比较] 也算失败(默认只有 [忽略返回值]/[流入全局] 算)
#     --ext     追加文件后缀,默认 c h
#
# 退出码
#     0  没有高危模式
#     1  有高危模式(细节见输出)
#     2  这个函数一个调用点都没找到(名字打错?还是根本没人调?)
#
# 四类输出
#     [忽略返回值] ret = foo(x); 之后 ret 再没被读过 —— 契约在这里已经断了
#     [流入全局]   g_state = foo(x);              —— 值会流向你看不见的消费者
#     [魔数比较]   if (foo(x) == -1)              —— 新增取值时这类判断最易漏
#     [已判断]     if (foo(x) < 0) return ret;    —— 通常是好的,仍建议扫一眼

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export PYTHONNOUSERSITE=1
set -uo pipefail

FUNC=""; TREE="."; STRICT=0; EXTS="c h"
while [ $# -gt 0 ]; do
    case "$1" in
        --tree)   TREE="${2:-}"; shift 2 ;;
        --strict) STRICT=1; shift ;;
        --ext)    EXTS="$EXTS ${2:-}"; shift 2 ;;
        -h|--help) sed -n '3,40p' "$0"; exit 0 ;;
        -*) echo "未知参数:$1" >&2; exit 2 ;;
        *)  FUNC="$1"; shift ;;
    esac
done

[ -n "$FUNC" ] || { echo "用法:$0 <函数名> [--tree <代码树>] [--strict]" >&2; exit 2; }
[ -d "$TREE" ] || { echo "代码树不存在:$TREE" >&2; exit 2; }

inc=()
for e in $EXTS; do inc+=(--include="*.$e"); done

echo "=================================================================="
echo " 契约变更影响面:$FUNC"
echo " 代码树:$TREE"
echo "=================================================================="
echo

# 调用点 = 出现 "func(" 且【不是】定义行、不是声明行、不是注释行
raw=$(grep -rn "${inc[@]}" -E "\<${FUNC}[[:space:]]*\(" "$TREE" 2>/dev/null \
      | grep -vE ":[[:space:]]*(\*|//)" || true)

if [ -z "$raw" ]; then
    echo "没有找到任何出现点 —— 函数名打错了?"
    exit 2
fi

n_ignore=0; n_global=0; n_magic=0; n_ok=0; n_def=0

while IFS= read -r line; do
    [ -n "$line" ] || continue
    file="${line%%:*}"; rest="${line#*:}"
    lno="${rest%%:*}";  code="${rest#*:}"

    # 定义 / 原型声明:行尾是 '{' 或 ';' 且行首像类型 —— 不算调用点
    if printf '%s' "$code" | grep -qE "^[[:space:]]*(static[[:space:]]+|extern[[:space:]]+|inline[[:space:]]+)*(int|void|long|unsigned|u8|u16|u32|s32|bool|ssize_t|size_t|struct[[:space:]]+[A-Za-z_]+)[[:space:]*]+${FUNC}[[:space:]]*\("; then
        n_def=$((n_def + 1)); continue
    fi
    # EXPORT_SYMBOL 不是调用点
    printf '%s' "$code" | grep -q "EXPORT_SYMBOL" && continue

    trimmed=$(printf '%s' "$code" | sed 's/^[[:space:]]*//')

    # ① 与魔数直接比较
    if printf '%s' "$code" | grep -qE "${FUNC}[[:space:]]*\([^;]*\)[[:space:]]*(==|!=)[[:space:]]*-?[0-9A-Za-zx_]+"; then
        echo "[魔数比较]   $file:$lno"
        echo "             $trimmed"
        n_magic=$((n_magic + 1)); continue
    fi

    # ② 赋值形式:取左值变量名
    lhs=$(printf '%s' "$code" | sed -nE "s/^[[:space:]]*([A-Za-z_][A-Za-z0-9_.>-]*)[[:space:]]*=[[:space:]]*.*${FUNC}[[:space:]]*\(.*/\1/p")
    if [ -n "$lhs" ]; then
        base=$(printf '%s' "$lhs" | sed 's/[.>-].*//')
        # 左值是否在文件顶层声明(全局/静态)—— 值会流出当前函数的视野
        # 顶层声明必须【顶格】—— 函数内的局部变量都有缩进,不能一起算进来
        # (2026-08-11 实测踩过:漏了这条,把函数内的 int ret; 误判成全局)
        if grep -qE "^(static[[:space:]]+)?[A-Za-z_][A-Za-z0-9_ ]*[[:space:]*]+${base}[[:space:]]*(=|;)" "$file" 2>/dev/null; then
            echo "[流入全局]   $file:$lno   ← 左值 '$base' 在文件顶层声明,值会流向未知消费者"
            echo "             $trimmed"
            n_global=$((n_global + 1)); continue
        fi
        # 赋值之后,同文件后 20 行内该变量还被读过吗
        after=$(sed -n "$((lno + 1)),$((lno + 20))p" "$file" 2>/dev/null | grep -cE "\<${base}\>" || true)
        if [ "${after:-0}" -eq 0 ]; then
            echo "[忽略返回值] $file:$lno   ← '$base' 赋值后 20 行内未被读取"
            echo "             $trimmed"
            n_ignore=$((n_ignore + 1)); continue
        fi
        echo "[已判断]     $file:$lno"
        echo "             $trimmed"
        n_ok=$((n_ok + 1)); continue
    fi

    # ③ 独立语句,返回值完全没接
    if printf '%s' "$trimmed" | grep -qE "^${FUNC}[[:space:]]*\(.*\)[[:space:]]*;"; then
        echo "[忽略返回值] $file:$lno   ← 返回值完全没接"
        echo "             $trimmed"
        n_ignore=$((n_ignore + 1)); continue
    fi

    echo "[已判断]     $file:$lno"
    echo "             $trimmed"
    n_ok=$((n_ok + 1))
done <<< "$raw"

echo
echo "=================================================================="
printf " 定义/声明 %d · 忽略返回值 %d · 流入全局 %d · 魔数比较 %d · 已判断 %d\n" \
       "$n_def" "$n_ignore" "$n_global" "$n_magic" "$n_ok"
echo "=================================================================="

risky=$((n_ignore + n_global))
[ "$STRICT" -eq 1 ] && risky=$((risky + n_magic))

if [ "$risky" -eq 0 ]; then
    echo " ✅ 没有高危模式。仍建议人工扫一遍 [已判断] 各处对返回值的解释。"
    exit 0
fi

echo " ❌ 有 $risky 处高危模式,改契约前逐个确认:"
[ "$n_ignore" -gt 0 ] && echo "    · [忽略返回值] 契约在那里已经断了 —— 可能是既有 bug"
[ "$n_global" -gt 0 ] && echo "    · [流入全局]   先查清谁读这个全局变量,他怎么解释它"
[ "$n_magic"  -gt 0 ] && echo "    · [魔数比较]   取值空间一变,这类判断会静默漏掉新值"
exit 1
