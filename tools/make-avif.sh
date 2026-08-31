#!/usr/bin/env bash
# Regenerate the responsive AVIF derivatives for the catalogue.
#
# Usage:  ./tools/make-avif.sh            # all pieces
#         ./tools/make-avif.sh saturn     # just one
#
# Uses macOS `sips`, which writes AVIF natively — no npm, no Homebrew, which
# keeps this in step with the site's no-build-step rule.
#
# Output, per piece, in images/work/avif/:
#   <name>-480.avif    grid tile, small viewports / 1x
#   <name>-800.avif    grid tile at 2x, feature tile at 1x
#   <name>-<native>.avif   lightbox / feature at 2x
#
# Quality climbs with size on purpose: artefacts that vanish in a thumbnail
# are visible in the viewer.
#
# Note: --resampleWidth, not -Z. -Z fits the LONGEST side, so on portrait art
# a "-800" file would come out 640px wide and the srcset width descriptors
# would be wrong — the browser would then under-pick and render soft.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p images/work/avif

shopt -s nullglob
if [ $# -gt 0 ]; then
  files=()
  for n in "$@"; do files+=("images/work/$n.jpg"); done
else
  files=(images/work/*.jpg)
fi

for f in "${files[@]}"; do
  [ -f "$f" ] || { echo "skip: $f not found" >&2; continue; }
  b=$(basename "$f" .jpg)
  w=$(sips -g pixelWidth "$f" | tail -1 | awk '{print $2}')
  h=$(sips -g pixelHeight "$f" | tail -1 | awk '{print $2}')

  sips -s format avif -s formatOptions 55 --resampleWidth 480 "$f" --out "images/work/avif/$b-480.avif" >/dev/null
  sips -s format avif -s formatOptions 60 --resampleWidth 800 "$f" --out "images/work/avif/$b-800.avif" >/dev/null
  sips -s format avif -s formatOptions 65        "$f" --out "images/work/avif/$b-$w.avif"   >/dev/null

  echo "$b  ${w}x${h}  jpg $(du -h "$f" | cut -f1) -> avif $(du -ch images/work/avif/$b-*.avif | tail -1 | cut -f1)"
  echo "   add to GALLERY_ITEMS:  { name: '$b', title: '???', year: '????', w: $w, h: $h },"
done
