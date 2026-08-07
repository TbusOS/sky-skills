#!/usr/bin/env bash
#
# decompressor_limit_check.sh — 判断一棵内核树会不会踩「解压器可执行窗口上界」这个坑
#
# 背景
#     arm32 的 zImage 自带解压器(arch/arm/boot/compressed/)。它在解压前给自己建一张
#     临时页表,只把 [RAM 起点, RAM 起点 + LIMIT] 映射成可执行 + cacheable,界外置
#     XN + strongly-ordered。解压器会把自己整个搬到解压输出末尾之后,内核越大搬得越高;
#     顶端一旦越界,解压过程中的非对齐访问就 fault,表现为【零日志静默死机】。
#
#     上游 LIMIT 写死 0x10000000(256MB),现实中够不着。但某些 BSP 会把它改成 Kconfig
#     并调小 —— 调小到几十 MB 时,内核长大就会撞上。
#
# 两级判据(顺序不能颠倒)
#     ① 主 SoC 内核编的是 arm64?  → 到此为止。arm64 没有内核自解压器
#        (arch/arm64/boot/ 下无 compressed/),这一环整个不存在,不可能踩。
#        arm64 的压缩镜像 Image.gz 由 bootloader 解开 —— 见
#        Documentation/arch/arm64/booting.rst 第 3 步(Requirement: OPTIONAL):
#        "The AArch64 kernel does not currently provide a decompressor…"
#     ② 编 arm32?  → 再看这棵树的界是多少:
#        · 无 ARM_DECOMPRESSOR_LIMIT → 上游原样 0x10000000(256MB),现实中安全
#        · 有 → 读 default 值,小于阈值就要算余量
#
#     ★ 别按芯片厂商归类。实测见过同一颗 SoC:4.19+arm32 的 BSP 踩、5.15+arm64 的不踩。
#       要按「架构 + BSP 分支」归类。
#
# 用法
#     decompressor_limit_check.sh <内核树路径> [--arch arm|arm64] [--warn-mb N]
#       --arch      跳过架构自动判定,直接指定(自动判定看 vendor defconfig 分布)
#       --warn-mb   LIMIT 小于该值(MB)时判为需要关注,默认 128
#
# 退出码
#     0 = 不会踩(arm64,或 arm32 但界是上游默认值)
#     1 = 需要关注(arm32 且界被调小)
#     3 = 检查本身没跑成(路径不对 / 缺文件),不代表结论
#
set -uo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

TREE=""; FORCE_ARCH=""; WARN_MB=128
while [ $# -gt 0 ]; do
  case "$1" in
    --arch)     FORCE_ARCH="${2:-}"; shift 2 ;;
    --warn-mb)  WARN_MB="${2:-}";    shift 2 ;;
    -h|--help)  sed -n '2,45p' "$0"; exit 0 ;;
    *)          TREE="$1"; shift ;;
  esac
done

[ -n "$TREE" ] || { echo "用法: $(basename "$0") <内核树路径> [--arch arm|arm64] [--warn-mb N]" >&2; exit 3; }
[ -d "$TREE" ] || { echo "⛔ 路径不存在: $TREE" >&2; exit 3; }
[ -f "$TREE/Makefile" ] || { echo "⛔ 不像内核树(缺 Makefile): $TREE" >&2; exit 3; }

KVER=$(grep -hE '^(VERSION|PATCHLEVEL|SUBLEVEL) ' "$TREE/Makefile" 2>/dev/null | awk '{printf "%s.",$3}' | sed 's/\.$//')
echo "=================================================================="
echo " 解压器窗口上界检查"
echo "=================================================================="
echo "  内核树   : $TREE"
echo "  版本     : linux-${KVER:-未知}"
echo

# ---------- 第 ① 级:架构 ----------
echo "-- ① 主 SoC 内核编哪个架构 -------------------------------------"
ARCH="$FORCE_ARCH"; ARCH_BASIS=""
if [ -n "$ARCH" ]; then
  ARCH_BASIS="调用方用 --arch 指定"
  echo "     $ARCH_BASIS → $ARCH"
else
  # 只认 configs/vendor/ —— 那是 BSP 树才有的目录,数量对比才有意义。
  # 通用/上游内核树的 arch/arm/configs 里有几百个历史 defconfig,
  # 拿它跟 arm64 比数量必然误判成 arm32(结论可能碰巧对,但理由是错的)。
  va="$TREE/arch/arm/configs/vendor"; vb="$TREE/arch/arm64/configs/vendor"
  ha=no; hb=no
  [ -d "$va" ] && ha=yes; [ -d "$vb" ] && hb=yes
  echo "     arch/arm/configs/vendor  : $ha$([ "$ha" = yes ] && echo "($(find "$va" -maxdepth 1 -type f 2>/dev/null|wc -l) 个)")"
  echo "     arch/arm64/configs/vendor: $hb$([ "$hb" = yes ] && echo "($(find "$vb" -maxdepth 1 -type f 2>/dev/null|wc -l) 个)")"
  if   [ "$ha" = yes ] && [ "$hb" = no  ]; then ARCH=arm;   ARCH_BASIS="只有 arm 侧有 vendor defconfig"
  elif [ "$hb" = yes ] && [ "$ha" = no  ]; then ARCH=arm64; ARCH_BASIS="只有 arm64 侧有 vendor defconfig"
  else
    ARCH=""
    # 两边都有(部分厂商 BSP 会两个架构都铺)或都没有(通用/上游树)——两种情况下"数量多的那个"
    # 都不是可靠判据:上游树 arch/arm/configs 有几百个历史 defconfig;
    # 有的厂商 BSP 两个架构都铺 vendor defconfig,但实际只编其中一个。
    echo "     ⚠ 架构【未判定】—— 两边都有 / 都没有 vendor defconfig 时,"
    echo "       按数量比是错的判据(实测见过某厂商 BSP 两侧都有 vendor defconfig,实际只编 arm32)。"
  fi
fi

HAS_A64_COMPRESSED=no
[ -d "$TREE/arch/arm64/boot/compressed" ] && HAS_A64_COMPRESSED=yes
echo "     arch/arm64/boot/compressed 存在? $HAS_A64_COMPRESSED"

if [ -z "$ARCH" ]; then
  echo
  echo "-- ② 架构未判定,只报这棵树的客观事实,不给「会不会踩」的结论 --"
  HEAD_S="$TREE/arch/arm/boot/compressed/head.S"
  if [ -f "$HEAD_S" ]; then
    echo "  arm32 解压器建表上界那一行:"
    grep -nE 'add[[:space:]]+r10,[[:space:]]*r9,[[:space:]]*#' "$HEAD_S" | head -1 | sed 's/^/     head.S:/'
  fi
  echo "  ARM_DECOMPRESSOR_LIMIT 在 arch/ 下命中文件数: $(grep -rl 'ARM_DECOMPRESSOR_LIMIT' "$TREE/arch/" 2>/dev/null | wc -l)"
  cat <<'EOF'

  ⚠ 未判定 —— 补 --arch 再跑一次。怎么确定这棵树实际编哪个架构:
       · 构建脚本里的 ARCH= / DEFCONFIG=(最直接)
       · 已编产物:file <out>/vmlinux → "ELF 32-bit … ARM" vs "ELF 64-bit … aarch64"
       · 实际用的那个 defconfig 落在 arch/arm/ 还是 arch/arm64/ 下
     别用"哪边 defconfig 多"来猜 —— 那不是判据。
EOF
  exit 3
fi

if [ "$ARCH" = "arm64" ]; then
  echo
  echo "  ✅ 不会踩 —— arm64 没有内核自解压器,这一环整个不存在。"
  echo "     压缩镜像(Image.gz 等)由 bootloader 解开,见"
  echo "     Documentation/arch/arm64/booting.rst 第 3 步(Requirement: OPTIONAL)。"
  echo "     注意:这不等于「arm64 不压缩」—— arch/arm64/boot/Makefile 里"
  echo "     Image.gz / Image.lz4 / Image.lzma / Image.lzo 都在,只是解压归 bootloader 管。"
  exit 0
fi

# ---------- 第 ② 级:这棵 arm32 树的界是多少 ----------
echo
echo "-- ② arm32:这棵树的界是多少 -----------------------------------"
HEAD_S="$TREE/arch/arm/boot/compressed/head.S"
if [ ! -f "$HEAD_S" ]; then
  echo "  ⛔ 找不到 $HEAD_S —— 检查没跑成,不下结论"; exit 3
fi

LINE=$(grep -nE 'add[[:space:]]+r10,[[:space:]]*r9,[[:space:]]*#' "$HEAD_S" | head -1)
[ -n "$LINE" ] || { echo "  ⛔ head.S 里找不到建表上界那一行(add r10, r9, #…),检查没跑成"; exit 3; }
echo "  head.S 那一行:"
echo "     $HEAD_S:$LINE" | sed 's/:\s*/:  /'

N_SYM=$(grep -rl 'ARM_DECOMPRESSOR_LIMIT' "$TREE/arch/" 2>/dev/null | wc -l)
echo "  ARM_DECOMPRESSOR_LIMIT 在 arch/ 下命中文件数: $N_SYM"

if [ "$N_SYM" -eq 0 ]; then
  if echo "$LINE" | grep -q '0x10000000'; then
    echo
    echo "  ✅ 不会踩 —— 上游原样,界 = RAM 起点 + 0x10000000(256 MB)。"
    echo "     内核要长到 256 MB 才可能出事,现实中够不着。"
    exit 0
  fi
  echo
  echo "  ⚠  无 ARM_DECOMPRESSOR_LIMIT,但 head.S 那行也不是上游的 0x10000000。"
  echo "     这棵树被改过,需要人工确认那个立即数的含义。"
  exit 1
fi

# 有该符号 → 读 default
DEF=$(grep -A6 -E '^config[[:space:]]+ARM_DECOMPRESSOR_LIMIT' "$TREE/arch/arm/Kconfig" 2>/dev/null \
      | grep -oE 'default[[:space:]]+0x[0-9a-fA-F]+' | head -1 | grep -oE '0x[0-9a-fA-F]+')
echo "  Kconfig default: ${DEF:-未取到}"
if [ -z "$DEF" ]; then
  echo; echo "  ⚠  有该符号但取不到 default,人工看 arch/arm/Kconfig"; exit 1
fi
MB=$(( DEF / 1024 / 1024 ))
echo "  换算: $DEF = ${MB} MB"
echo
if [ "$MB" -lt "$WARN_MB" ]; then
  cat <<EOF
  ⚠  需要关注 —— 界被调小到 ${MB} MB(阈值 ${WARN_MB} MB)。

     这棵树的内核一旦长大,解压器搬迁块顶端就可能越界,表现为
     【零日志静默死机】:LCD 停在 bootloader 画面,UART 上内核一个字符都没有。

     怎么量余量(需要一版能启动的固件 + 解压器诊断打印):
       界        = RAM 起点 + ${DEF}
       实际顶端  = 解压器 malloc 区的顶(sp + 0x10000),不是 sp 本身
       两者之差就是余量;余量小于几百 KB 时,加一个驱动就可能出事。

     注意增量不是线性的:内核 .text/.rodata 段末尾按 1 MB 对齐
     (CONFIG_DEBUG_ALIGN_RODATA),跨过边界会一次涨 1 MB;
     而 .bss 根本不进镜像,完全不影响。
EOF
  exit 1
fi
echo "  ✅ 界为 ${MB} MB,不低于阈值 ${WARN_MB} MB"
exit 0
