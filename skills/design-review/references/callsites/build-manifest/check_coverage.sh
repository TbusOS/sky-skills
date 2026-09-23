# check_coverage.sh - every file the shipping manifest lists must be in the build.
# Sourced by verify_all.sh.

find_manifest() {
  local m
  for m in "$1"/*manifest*.txt; do
    [ -f "$m" ] && { echo "$m"; return 0; }
  done
  return 1
}

check_coverage() {
  local dir="$1" manifest f missing=0
  manifest="$(find_manifest "$dir")" || return 1
  while IFS= read -r f; do
    [ -e "$dir/$f" ] || { printf 'missing: %s\n' "$f"; missing=1; }
  done < <(grep -v '^#' "$manifest")
  return "$missing"
}
