#!/bin/sh
# SPDX-License-Identifier: GPL-2.0
#
# why_this_code.sh — dig up the design intent behind a piece of code.
#
# The commit message of whoever wrote it is the only first-hand record of
# *why*. Comments go stale, and reading the code only ever tells you *what*.
# This script puts that record in front of you before you change anything.
#
# Usage:
#     why_this_code.sh <file> [symbol]
#     why_this_code.sh <file>:<line>       # who introduced that exact line
#     why_this_code.sh -o <out.txt> <file> [symbol]
#     why_this_code.sh --help
#
# Options / environment:
#     -o <file>       write the report to <file>, print only a table of
#                     contents. Only an explicit -o writes where you point it;
#                     the automatic spill (report longer than MAX_LINES) goes
#                     to TMPDIR so it never lands in the tree you are reading.
#     --tree-wide     also pickaxe the symbol across the WHOLE repo. Off by
#                     default: an unrestricted pickaxe walks every commit and
#                     takes minutes on a large tree.
#     MAX_COMMITS=25  how many commits to list
#     BODY_LINES=10   per-commit body cap (0 = uncapped)
#     MAX_LINES=120   above this the report goes to a file instead of stdout
#
# Exit codes:
#     0  history found
#     1  no history (new file, shallow clone, or outside a git repo)
#     2  usage / IO error
#
# Reads only. Never writes into the tree unless you pass -o with a path
# inside it, never checks anything out.

set -u

MAX_COMMITS=${MAX_COMMITS:-25}
BODY_LINES=${BODY_LINES:-10}
MAX_LINES=${MAX_LINES:-120}

usage() {
	sed -n '3,32p' "$0" | sed 's/^# \{0,1\}//'
	exit 2
}

ORIG_PWD=$(pwd)
OUTFILE=""
TREE_WIDE=0

while [ $# -gt 0 ]; do
	case "$1" in
	-h | --help) usage ;;
	-o)
		[ $# -ge 2 ] || usage
		OUTFILE=$2
		shift 2
		;;
	--tree-wide)
		TREE_WIDE=1
		shift
		;;
	-*) usage ;;
	*) break ;;
	esac
done

[ $# -ge 1 ] || usage

TARGET=$1
LINE=""
case "$TARGET" in
*:[0-9]*)
	LINE=${TARGET##*:}
	TARGET=${TARGET%:*}
	;;
esac
SYMBOL=${2:-}

[ -e "$TARGET" ] || {
	echo "no such file: $TARGET" >&2
	exit 2
}

DIR=$(dirname "$TARGET")
BASE=$(basename "$TARGET")
cd "$DIR" || exit 2

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
	echo "not inside a git repository: $TARGET" >&2
	exit 1
}

if [ "$(git rev-parse --is-shallow-repository 2>/dev/null)" = "true" ]; then
	echo "WARNING: shallow clone - older commits are missing." >&2
	echo "         run 'git fetch --unshallow' for the full record." >&2
fi

# Cap each commit body so one verbose message does not bury the rest.
# A commit starts at a line like "  <hash>  <date>  <author>".
cap_bodies() {
	[ "$BODY_LINES" = 0 ] && { cat; return; }
	awk -v cap="$BODY_LINES" '
	/^  [0-9a-f]{7,}  / { n = 0; hash = $1; print; next }
	{
		n++
		if (n <= cap) { print; next }
		if (n == cap + 1)
			printf "      ... body truncated - full text: git show -s --format=%%B %s\n", hash
	}'
}

FOUND=0
if git log --follow --format='%H' -- "$BASE" 2>/dev/null | head -1 | grep -q .; then
	FOUND=1
fi

# ---------------------------------------------------------------- report body
report() {
	echo "======================================================================"
	echo " why_this_code: $BASE"
	[ -n "$SYMBOL" ] && echo " symbol filter: $SYMBOL"
	[ -n "$LINE" ] && echo " line:          $LINE"
	echo "======================================================================"
	echo

	echo "### 1. File history (newest first) - read the messages, not the titles"
	echo
	if [ "$FOUND" = 1 ]; then
		git log --follow -n "$MAX_COMMITS" --no-color \
			--format='  %h  %ad  %an%n      %s%n%w(0,6,6)%b%n' \
			--date=short -- "$BASE" 2>/dev/null | cap_bodies
	else
		echo "  (no history for this path)"
	fi
	echo

	if [ -n "$SYMBOL" ]; then
		echo "### 2. Commits adding or removing '$SYMBOL' in this file (git log -S)"
		echo
		if git log -S"$SYMBOL" --format='%H' -- "$BASE" 2>/dev/null | head -1 | grep -q .; then
			git log -S"$SYMBOL" -n "$MAX_COMMITS" --no-color \
				--format='  %h  %ad  %an%n      %s%n' \
				--date=short -- "$BASE" 2>/dev/null
			echo "  The OLDEST commit above is where it came from."
			echo "  Read it in full: git show -s --format=%B <hash>"
		else
			echo "  (symbol never appears in this file's history - check the"
			echo "   spelling, or it arrived with the file's initial import)"
		fi
		echo

		echo "### 3. Same symbol across the whole repo"
		echo
		if [ "$TREE_WIDE" = 1 ]; then
			git log -S"$SYMBOL" -n 10 --no-color \
				--format='  %h  %ad  %s' --date=short 2>/dev/null
		else
			echo "  (skipped - an unrestricted pickaxe walks every commit and"
			echo "   takes minutes on a large tree. Re-run with --tree-wide"
			echo "   if the per-file history above did not answer the question.)"
		fi
		echo
	fi

	if [ -n "$LINE" ]; then
		echo "### 4. Who last touched line $LINE"
		echo
		git blame -L "$LINE,$LINE" --date=short -- "$BASE" 2>/dev/null | sed 's/^/  /'
		BL=$(git blame -L "$LINE,$LINE" --porcelain -- "$BASE" 2>/dev/null |
			head -1 | cut -d' ' -f1)
		if [ -n "${BL:-}" ]; then
			echo
			echo "  Full message of $BL:"
			git show -s --format='%B' "$BL" 2>/dev/null | sed 's/^/      /'
		fi
		echo
	fi

	cat <<'EOF'
### What to do with this

The commit messages above are the only first-hand record of design intent.
Before changing anything, classify the original design - and give a reason:

  a) right, and its constraint still holds   -> do not touch it; work around
  b) right, but the constraint is now gone   -> may change; say how it changed
  c) wrong                                   -> say exactly what is wrong, and
                                                why it was written that way

Watch for (c) being really (a): a lot of awkward code is a targeted fix for a
specific problem, correct at the time. Its flaw only shows up when a new
situation appears. "I think this is nicer" is not a reason.

Next: references/modifying-existing-code.md step 2.
EOF
}

# ---------------------------------------------------------------- table of contents
print_toc() {
	f=$1
	total=$2
	echo "report is $total lines - written to:"
	echo "    $f"
	echo
	echo "sections (read what you need, do not slurp the whole file):"
	awk '
	/^### / { if (start) printf "  %5d-%-5d  %s\n", start, NR-1, title
	          start = NR; title = substr($0, 5) }
	END     { if (start) printf "  %5d-%-5d  %s\n", start, NR, title }
	' "$f"
	echo
	echo "e.g.   sed -n '<from>,<to>p' $f"
}

OUT=$(report)
NLINES=$(printf '%s\n' "$OUT" | wc -l | tr -d ' ')

# The automatic spill goes to TMPDIR, not the cwd. You are normally sitting in
# the tree you are investigating, and a stray report file there shows up in
# git status and eventually gets committed by accident.
if [ -z "$OUTFILE" ] && [ "$NLINES" -gt "$MAX_LINES" ]; then
	OUTFILE="${TMPDIR:-/tmp}/why_this_code-${BASE%.*}.$$.txt"
	AUTO=1
else
	AUTO=0
fi

if [ -n "$OUTFILE" ]; then
	case "$OUTFILE" in
	/*) ABS=$OUTFILE ;;
	*) ABS=$ORIG_PWD/$OUTFILE ;;
	esac
	printf '%s\n' "$OUT" >"$ABS" || {
		echo "cannot write $ABS" >&2
		exit 2
	}
	[ "$AUTO" = 1 ] && echo "(over ${MAX_LINES}-line threshold, so it went to a file)"
	print_toc "$ABS" "$NLINES"
else
	printf '%s\n' "$OUT"
fi

[ "$FOUND" = 1 ] || exit 1
exit 0
