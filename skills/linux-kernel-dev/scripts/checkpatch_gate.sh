#!/usr/bin/env bash
# checkpatch_gate.sh — coding-style gate (HARNESS-DESIGN §6.3).
# Runs the kernel's checkpatch.pl on a .patch or a C source file.
# checkpatch.pl is found from a bound tree (--tree / --checkpatch / discovery).
# Portable: no hardcoded PATH (this skill ships open-source).
#
# Usage:
#   checkpatch_gate.sh <file.c|file.patch> [--tree <kernel-tree>] [--checkpatch <path>] [--strict]
#
# Exit: 0 clean | 1 checkpatch reported issues | 3 gate-error (checkpatch not found / bad args)

set -uo pipefail

FILE=""; TREE=""; CHECKPATCH=""; STRICT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --tree)       TREE="$2"; shift 2;;
    --checkpatch) CHECKPATCH="$2"; shift 2;;
    --strict)     STRICT="--strict"; shift;;
    --*)          echo "unknown flag: $1" >&2; exit 3;;
    *)            FILE="$1"; shift;;
  esac
done

[ -z "$FILE" ] && { echo "usage: checkpatch_gate.sh <file.c|file.patch> [--tree <t>] [--checkpatch <p>] [--strict]" >&2; exit 3; }
[ -f "$FILE" ] || { echo "no such file: $FILE" >&2; exit 3; }

# resolve checkpatch.pl
if [ -z "$CHECKPATCH" ]; then
  if [ -n "$TREE" ] && [ -f "$TREE/scripts/checkpatch.pl" ]; then
    CHECKPATCH="$TREE/scripts/checkpatch.pl"
  elif [ -n "${KERNELDEV_TREE:-}" ] && [ -f "$KERNELDEV_TREE/scripts/checkpatch.pl" ]; then
    CHECKPATCH="$KERNELDEV_TREE/scripts/checkpatch.pl"
  elif [ -n "${KDIR:-}" ] && [ -f "$KDIR/scripts/checkpatch.pl" ]; then
    CHECKPATCH="$KDIR/scripts/checkpatch.pl"
  fi
fi
[ -n "$CHECKPATCH" ] && [ -f "$CHECKPATCH" ] || {
  echo "[checkpatch-gate] gate-error: checkpatch.pl not found." >&2
  echo "  pass --checkpatch <path> or --tree <kernel-tree>, or bind a tree (kernel-tree.mjs add)." >&2
  exit 3
}
command -v perl >/dev/null 2>&1 || { echo "[checkpatch-gate] gate-error: perl not found" >&2; exit 3; }

# patch vs source file
case "$FILE" in
  *.patch|*.diff) MODE="";;
  *)              MODE="--file";;
esac

echo "[checkpatch-gate] $CHECKPATCH  on  $FILE"
# --no-tree: run standalone; --terse: one line per issue
if perl "$CHECKPATCH" --no-tree --terse $STRICT $MODE "$FILE"; then
  echo "[checkpatch-gate] clean"
  exit 0
else
  echo "[checkpatch-gate] FAIL — checkpatch reported issues"
  exit 1
fi
