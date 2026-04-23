#!/usr/bin/env bash
# sync-satellite.sh — sync a satellite repo from its gateway before a build.
#
# Three modes:
#   fetch       — git fetch origin; working tree untouched (safe default)
#   reset-hard  — git fetch origin && git reset --hard origin/<branch>;
#                 refuses (exit 1) if satellite has uncommitted changes,
#                 pass --yes to proceed and drop them
#   merge-ff    — git pull --ff-only origin <branch>; refuses divergent history
#
# Usage:
#   sync-satellite.sh [--satellite-dir=<path>] [--branch=<name>]
#                     [--mode=fetch|reset-hard|merge-ff] [--yes]

set -eu

SAT_DIR="$(pwd)"
BRANCH=""
MODE="fetch"
YES=0

for a in "$@"; do
  case "$a" in
    --satellite-dir=*)  SAT_DIR="${a#*=}" ;;
    --branch=*)         BRANCH="${a#*=}" ;;
    --mode=*)           MODE="${a#*=}" ;;
    --yes)              YES=1 ;;
    -h|--help)          sed -n '2,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)                  echo "unknown flag: $a" >&2; exit 1 ;;
  esac
done

SAT_DIR="${SAT_DIR/#\~/$HOME}"
[[ -d "$SAT_DIR/.git" ]] || { echo "not a git repo: $SAT_DIR" >&2; exit 1; }

cd "$SAT_DIR"
[[ -z "$BRANCH" ]] && BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || echo '')"
[[ -z "$BRANCH" ]] && { echo "could not determine branch · pass --branch=<name>" >&2; exit 1; }

case "$MODE" in
  fetch)
    echo "fetch · $BRANCH · working tree untouched"
    git fetch origin "$BRANCH"
    echo ""
    echo "done · working tree is unchanged"
    echo "  to apply: git merge --ff-only origin/$BRANCH   (if no divergence)"
    echo "        or: git reset --hard origin/$BRANCH      (if you want to drop local changes)"
    ;;
  reset-hard)
    # Safety: confirm unless --yes was passed.
    if [[ $YES -eq 0 ]]; then
      if [[ -n "$(git status --porcelain)" ]]; then
        echo "satellite has local changes:" >&2
        git status --short >&2
        echo "" >&2
        echo "reset-hard will DROP these changes · pass --yes to proceed" >&2
        exit 1
      fi
    fi
    echo "reset-hard · $BRANCH · dropping any local changes"
    git fetch origin "$BRANCH"
    git reset --hard "origin/$BRANCH"
    echo ""
    echo "done · satellite now matches origin/$BRANCH exactly"
    ;;
  merge-ff)
    echo "merge-ff · $BRANCH · refusing divergent history"
    git pull --ff-only origin "$BRANCH" || {
      echo "" >&2
      echo "merge-ff failed · satellite has diverged from origin/$BRANCH" >&2
      echo "  inspect:  cd $SAT_DIR && git log --oneline HEAD..origin/$BRANCH" >&2
      echo "  reset:    cd $SAT_DIR && git reset --hard origin/$BRANCH  (drops local work)" >&2
      exit 1
    }
    ;;
  *)
    echo "unknown --mode=$MODE · pick fetch / reset-hard / merge-ff" >&2
    exit 1
    ;;
esac
