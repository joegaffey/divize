#!/usr/bin/env bash
# One-time fetch of the Kodak 24 lossless test suite into harness/data/kodak/.
# Sources: the classic mirror at r0k.us (2560x1600) with a 768x512 fallback
# that several GitHub mirrors carry, since the spec sweeps at ~768x512.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$DIR/data/kodak"
mkdir -p "$OUT"

# r0k.us hosts kodimXX.png at full 768x512 resolution.
BASE_R0K="https://r0k.us/graphics/kodak/kodak"

# GitHub mirrors that keep the same naming (used as fallback).
BASE_GH="https://raw.githubusercontent.com/csjoycai/kodak/master"

fail=0
for i in $(seq -w 1 24); do
  f="$OUT/kodim$i.png"
  if [ -s "$f" ]; then
    echo "have $f"
    continue
  fi
  if curl -fsSL --connect-timeout 15 --max-time 120 -o "$f" "$BASE_R0K/kodim$i.png"; then
    echo "fetched $f (r0k.us)"
    continue
  fi
  rm -f "$f"
  if curl -fsSL --connect-timeout 15 --max-time 120 -o "$f" "$BASE_GH/kodim$i.png"; then
    echo "fetched $f (github mirror)"
    continue
  fi
  rm -f "$f"
  echo "FAILED kodim$i" >&2
  fail=1
done

echo "---"
echo "Kodak download complete: $(ls "$OUT" | wc -l) files in $OUT"
exit "$fail"
