#!/usr/bin/env bash
# build.sh - full build of the product image.
# Every full build ends with the release archive; CI runs verify_all.sh on
# whatever lands in $OUT_DIR.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${OUT_DIR:-$SRC/out}"
JOBS="${JOBS:-$(nproc)}"

log() { printf '[build] %s\n' "$*"; }

build_kernel() {
  log "kernel"
  make -C "$SRC/kernel" -j"$JOBS" O="$OUT_DIR/kernel"
}

build_rootfs() {
  log "rootfs"
  make -C "$SRC/rootfs" -j"$JOBS" DESTDIR="$OUT_DIR/rootfs"
}

copy_manifest() {
  mkdir -p "$OUT_DIR"
  cp "$SRC/ship_manifest.txt" "$OUT_DIR/"
}

pack_release_archive() {
  log "pack"
  copy_manifest
  tar -C "$OUT_DIR" -czf "$OUT_DIR/release.tar.gz" kernel rootfs
}

main() {
  build_kernel
  build_rootfs
  pack_release_archive
  log "done: $OUT_DIR"
}

main "$@"
