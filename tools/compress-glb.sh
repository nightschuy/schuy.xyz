#!/usr/bin/env bash
# Full GLB size pipeline: strip dead UVs, then Draco-compress.
#
# Usage:  ./tools/compress-glb.sh images/work/hero.glb
#
# Run this on a fresh Blender export before committing it. On the current
# hero this takes 4.44 MB -> ~590 KB with no visible change: the figure has
# no textures, so its UVs are dead weight, and Draco handles the rest.
#
# Requires Node (brew install node). Everything else in this repo is
# build-step-free; this is an offline authoring tool, not a runtime dep —
# the site just serves the compressed .glb that falls out of it.
#
# The site already ships a self-hosted Draco DECODER at
# js/vendor/three/draco/ and hero3d.js wires it into GLTFLoader, so a
# Draco-compressed model loads with no further changes.
set -euo pipefail

MODEL="${1:-images/work/hero.glb}"
cd "$(dirname "$0")/.."
[ -f "$MODEL" ] || { echo "no such file: $MODEL" >&2; exit 1; }

BACKUP="${MODEL%.glb}.orig.glb"
if [ ! -f "$BACKUP" ]; then
  cp "$MODEL" "$BACKUP"
  echo "backed up original -> $BACKUP (git-ignored; keep it, Draco is lossy)"
fi

before=$(wc -c < "$MODEL")

echo "1/2  stripping unused UVs…"
python3 tools/strip-glb-uvs.py "$MODEL"

echo "2/2  Draco…"
tmp=$(mktemp -t glbdraco).glb
npx -y @gltf-transform/cli draco "$MODEL" "$tmp"
mv "$tmp" "$MODEL"

after=$(wc -c < "$MODEL")
printf 'done: %d KB -> %d KB (%d%% smaller)\n' \
  $((before / 1024)) $((after / 1024)) $((100 - after * 100 / before))
echo "Verify the hero still renders before committing."
