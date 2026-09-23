#!/usr/bin/env bash
# verify_all.sh - post-build checks against a finished $OUT_DIR.
# Started by the CI job "verify" after every full build. Any failing check
# fails the job.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${OUT_DIR:?OUT_DIR must point at a finished build}"
. "$HERE/check_layout.sh"
. "$HERE/check_symbols.sh"
. "$HERE/check_coverage.sh"

verify_all() {
  local failed=0
  check_layout "$OUT_DIR"   || failed=1
  check_symbols "$OUT_DIR"  || failed=1
  check_coverage "$OUT_DIR" || failed=1
  return "$failed"
}

verify_all
