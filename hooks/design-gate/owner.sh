#!/usr/bin/env bash
# owner.sh — answer the two questions the hooks have to answer before they can
# do anything, which the first version answered with one lookup and got
# backwards as a result.
#
#   which project owns this page?  → a marker the project itself puts there
#   where does the checker live?   → this script's own path
#
# The first version walked up from the edited file looking for
# skills/design-review/scripts/verify.py. That is the checker's own address, so
# the only repo it ever matched was sky-skills — the one repo whose author edits
# the checker daily and is the least likely person alive to forget to run it.
# Every downstream project that installed the hook got silence: the medicine
# reached only the person who wrote the prescription. The two questions are not
# the same question, and answering them with one lookup is what inverted them.
#
# The marker is DESIGN.md, deliberately the same file design-md.mjs looks for
# (design-md.mjs find()). A project says once, in one place, that it writes in
# one of these nine languages; the hook and the checker both read that one
# place. sky-skills itself has no DESIGN.md, so it is still recognised the old
# way — as the repo that contains the checker.
#
# Sourced by post-edit.sh and stop.sh. On success sets:
#   DG_ROOT       where .design-gate/ lives and what paths are relative to
#   DG_SKY_ROOT   the sky-skills checkout the hook was installed from
#   DG_VERIFY     absolute path to verify.py
#   DG_DESIGN_MD  the marker, or "" when the project is sky-skills itself
#   DG_SKILL      DESIGN.md's skill: field, or ""
#   DG_MONO       1 when DESIGN.md says monolingual: true, else ""
# Returns 1 when the file belongs to no design project — the silent case, and
# the common one.

# Read one top-level scalar out of a DESIGN.md front matter block.
#
# Two fields, no schema: design-md.mjs is the validator and bin/design-review
# refuses to run on a malformed file, so this only has to agree with it on the
# two values that change what the hook does. Anchoring at column 0 is what keeps
# `check:` inside a waiver from being mistaken for a top-level key.
dg_design_field() {   # <design.md> <key>
  sed -n '1{/^---$/!q}; 2,${/^---$/q; p}' "$1" 2>/dev/null \
    | sed -n "s/^$2:[[:space:]]*//p" \
    | head -1 \
    | sed 's/[[:space:]]*$//; s/^["'\'']//; s/["'\'']$//'
}

# Walk up from a directory to the project that owns it.
dg_owner() {          # <absolute-dir>
  local dir="$1" marker="" top
  DG_ROOT=""; DG_SKY_ROOT=""; DG_VERIFY=""; DG_DESIGN_MD=""; DG_SKILL=""; DG_MONO=""

  while [ -n "$dir" ] && [ "$dir" != "/" ]; do
    if [ -f "$dir/DESIGN.md" ]; then
      marker="$dir"; DG_DESIGN_MD="$dir/DESIGN.md"; break
    fi
    # sky-skills has no DESIGN.md of its own; the checker sitting there is what
    # identifies it. Kept second so a DESIGN.md always wins.
    if [ -f "$dir/skills/design-review/scripts/verify.py" ]; then
      marker="$dir"; break
    fi
    dir="$(dirname "$dir")"
  done
  [ -n "$marker" ] || return 1

  # The marker locates the project; the git top level locates its root. These
  # differ when a repo keeps one DESIGN.md per site (docs/DESIGN.md), and the
  # difference matters: bin/design-review writes its receipt under the directory
  # it was run from, which is the repo root. Anchoring state at the marker
  # instead would put pending.tsv and passed.tsv in different directories, and
  # the Stop hook would then report pages that had in fact passed — a nag that
  # cannot be satisfied, which is the one failure mode this hook must not have.
  top="$(cd "$marker" 2>/dev/null && git rev-parse --show-toplevel 2>/dev/null)"
  DG_ROOT="${top:-$marker}"

  # The checker is found from this file's own location, never from the edited
  # file's ancestry — that is the whole point of the split.
  local here
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)" || return 1
  DG_SKY_ROOT="$(cd "$here/../.." 2>/dev/null && pwd)" || return 1
  DG_VERIFY="$DG_SKY_ROOT/skills/design-review/scripts/verify.py"
  # A checkout that moved out from under an installed hook entry: fall back to a
  # checker inside the project before giving up.
  if [ ! -f "$DG_VERIFY" ]; then
    DG_SKY_ROOT="$DG_ROOT"
    DG_VERIFY="$DG_ROOT/skills/design-review/scripts/verify.py"
  fi
  [ -f "$DG_VERIFY" ] || return 1

  if [ -n "$DG_DESIGN_MD" ]; then
    DG_SKILL="$(dg_design_field "$DG_DESIGN_MD" skill)"
    [ "$(dg_design_field "$DG_DESIGN_MD" monolingual)" = true ] && DG_MONO=1
  fi
  return 0
}

# Find the state directory an earlier post-edit.sh wrote, walking up from a
# directory. The Stop hook uses this instead of dg_owner: it starts from the
# session's cwd rather than from a file, and a project may keep its DESIGN.md
# one directory *below* the root (docs/DESIGN.md), where walking up from the
# root would never see it. The pending list is itself the evidence that this
# project is in scope, so look for that and skip the question entirely.
dg_state_root() {     # <absolute-dir>
  local dir="$1"
  while [ -n "$dir" ] && [ "$dir" != "/" ]; do
    if [ -f "$dir/.design-gate/pending.tsv" ]; then printf '%s' "$dir"; return 0; fi
    dir="$(dirname "$dir")"
  done
  return 1
}
