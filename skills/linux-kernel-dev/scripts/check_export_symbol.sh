#!/bin/sh
# SPDX-License-Identifier: GPL-2.0
#
# check_export_symbol.sh — is this EXPORT_SYMBOL actually needed?
#
# EXPORT_SYMBOL puts a symbol in __ksymtab so that *loadable modules* can link
# against it. Two functions that both end up in vmlinux do not need it: a
# non-static definition plus a declaration is enough.
#
# The cost of a needless export is not the wasted ksymtab entry. It is a
# statement: "this is a public interface for out-of-tree consumers". Readers
# believe it, go looking for the other consumers, and find none. Worse, an
# exported symbol looks like something you must keep compatible.
#
# Usage:
#     check_export_symbol.sh <symbol> [--tree <src-dir>] [--build <obj-dir>]
#
#     --tree   where to grep sources          (default: .)
#     --build  where vmlinux / *.ko / Module.symvers live, to check for real
#              module consumers. Without it only the source-level answer is
#              given.
#
# Exit codes:
#     0  the export is justified, or undecidable without build output
#     1  no module consumer found -> the export is very likely unnecessary
#     2  usage error / symbol not exported anywhere
#
# Reads only.

set -u

SYM=""
TREE="."
BUILD=""

usage() {
	sed -n '3,28p' "$0" | sed 's/^# \{0,1\}//'
	exit 2
}

while [ $# -gt 0 ]; do
	case "$1" in
	--tree) TREE=${2:-}; shift 2 || usage ;;
	--build) BUILD=${2:-}; shift 2 || usage ;;
	-h | --help) usage ;;
	-*) usage ;;
	*) SYM=$1; shift ;;
	esac
done
[ -n "$SYM" ] || usage
[ -d "$TREE" ] || { echo "no such tree: $TREE" >&2; exit 2; }

echo "======================================================================"
echo " check_export_symbol: $SYM"
echo "======================================================================"
echo

# ---------------------------------------------------------------- 1. source
echo "### 1. Where it is exported and declared"
echo
EXPORTS=$(grep -rn "EXPORT_SYMBOL\(_GPL\)\?[[:space:]]*([[:space:]]*$SYM[[:space:]]*)" \
	"$TREE" --include=*.c --include=*.h 2>/dev/null)
if [ -z "$EXPORTS" ]; then
	echo "  not exported anywhere under $TREE"
	echo "  (nothing to check - either the name is wrong or it is already"
	echo "   a plain non-static function)"
	exit 2
fi
printf '%s\n' "$EXPORTS" | sed 's/^/  [export]  /'

DECLS=$(grep -rn "^[[:space:]]*\(extern[[:space:]]\+\)\?[A-Za-z_].*[[:space:]*]$SYM[[:space:]]*(" \
	"$TREE" --include=*.h 2>/dev/null | head -5)
if [ -n "$DECLS" ]; then
	printf '%s\n' "$DECLS" | sed 's/^/  [header]  /'
else
	echo "  [header]  NONE - no prototype in any .h under $TREE"
fi

INLINE_EXT=$(grep -rn "^[[:space:]]*extern[[:space:]].*[[:space:]*]$SYM[[:space:]]*(" \
	"$TREE" --include=*.c 2>/dev/null | head -8)
if [ -n "$INLINE_EXT" ]; then
	echo
	printf '%s\n' "$INLINE_EXT" | sed 's/^/  [extern-in-.c]  /'
	echo
	echo "  ! extern in a .c file: the prototype is hand-copied. Change the"
	echo "    signature and the compiler will not catch the mismatch."
	echo "    checkpatch flags this as 'externs should be avoided in .c files'."
fi
echo

# ---------------------------------------------------------------- 2. callers
echo "### 2. Call sites in the source tree"
echo
CALLS=$(grep -rn "\b$SYM[[:space:]]*(" "$TREE" \
	--include=*.c --include=*.h 2>/dev/null |
	grep -v "EXPORT_SYMBOL" |
	grep -v "^[^:]*:[0-9]*:[[:space:]]*\(extern\|static\)\?[[:space:]]*[A-Za-z_].*[[:space:]*]$SYM[[:space:]]*([^;]*)[[:space:]]*$")
NCALL=$(printf '%s\n' "$CALLS" | grep -c . || true)
if [ "${NCALL:-0}" -gt 0 ]; then
	printf '%s\n' "$CALLS" | head -20 | sed 's/^/  /' | cut -c1-110
	[ "$NCALL" -gt 20 ] && echo "  ... ($((NCALL - 20)) more)"
else
	echo "  none found (dead code? called through a function pointer?)"
fi
echo

# ---------------------------------------------------------------- 3. build
VERDICT_CODE=0
echo "### 3. Real consumers in the build output"
echo
if [ -z "$BUILD" ]; then
	echo "  --build not given, so this cannot be decided from sources alone."
	echo "  Re-run with --build <obj-dir> (where vmlinux / *.ko live)."
	echo
else
	if [ ! -d "$BUILD" ]; then
		echo "  no such build dir: $BUILD"
		echo
	else
		SYMV=$(find "$BUILD" -maxdepth 3 -name Module.symvers 2>/dev/null | head -1)
		if [ -n "$SYMV" ]; then
			LINE=$(grep -w "$SYM" "$SYMV" 2>/dev/null | head -1)
			if [ -n "$LINE" ]; then
				echo "  Module.symvers: $LINE"
			else
				echo "  Module.symvers: symbol absent (not built?)"
			fi
		fi

		VMLINUX=$(find "$BUILD" -maxdepth 3 -name vmlinux -type f 2>/dev/null | head -1)
		if [ -n "$VMLINUX" ]; then
			NMOUT=$(nm "$VMLINUX" 2>/dev/null | grep -w "$SYM" | head -3)
			if [ -n "$NMOUT" ]; then
				printf '%s\n' "$NMOUT" | sed 's/^/  vmlinux: /'
			fi
		fi

		NKO=0
		USERS=""
		for k in $(find "$BUILD" -name '*.ko' 2>/dev/null); do
			NKO=$((NKO + 1))
			if nm -u "$k" 2>/dev/null | grep -qw "$SYM"; then
				USERS="$USERS $k"
			fi
		done
		echo
		echo "  scanned $NKO module(s) for an undefined reference to $SYM"
		if [ -n "$USERS" ]; then
			for u in $USERS; do echo "    consumer: $u"; done
			echo
			echo "  -> the export IS needed: a loadable module links against it."
		else
			echo "    consumers: NONE"
			echo
			if [ "$NKO" = 0 ]; then
				echo "  -> no modules were built here; cannot conclude."
			else
				echo "  -> no module consumes it. If every caller in section 2 is"
				echo "     built into vmlinux, the EXPORT_SYMBOL is unnecessary:"
				echo "     a non-static definition + a prototype in a shared .h is"
				echo "     all that is required."
				VERDICT_CODE=1
			fi
		fi
		echo
	fi
fi

cat <<'EOF'
### What to do with this

Keep the export when a loadable module links against it, or when it is a
deliberate, documented interface for out-of-tree code.

Drop it when producer and consumers all land in vmlinux. Replace it with:
  - a non-static definition (already the case), and
  - a prototype in a header both sides include - not a hand-written extern
    sitting in some .c file.

Removing a needless export is a behaviour-neutral cleanup, but it is still a
change to a file others touch: put it in its own commit, not folded into a
functional one.
EOF

exit "$VERDICT_CODE"
