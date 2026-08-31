#!/usr/bin/env bash
# Re-vendor three.js into js/vendor/three/ (self-hosted, no CDN at runtime).
#
# Usage:  ./tools/fetch-three.sh [version]     # default: current pinned version
#
# After bumping, the version only lives here — index.html's import map points
# at local paths, so nothing else needs editing.
set -euo pipefail

VERSION="${1:-0.160.0}"
cd "$(dirname "$0")/.."
BASE="https://unpkg.com/three@${VERSION}"
DEST="js/vendor/three"

mkdir -p "$DEST/addons/loaders" "$DEST/addons/controls" "$DEST/addons/utils" "$DEST/draco"

fetch () { curl -sSfL "$1" -o "$2" && echo "  ok  $2"; }

echo "Fetching three@${VERSION}…"
fetch "$BASE/build/three.module.js"                        "$DEST/three.module.js"
fetch "$BASE/examples/jsm/loaders/GLTFLoader.js"           "$DEST/addons/loaders/GLTFLoader.js"
fetch "$BASE/examples/jsm/loaders/DRACOLoader.js"          "$DEST/addons/loaders/DRACOLoader.js"
fetch "$BASE/examples/jsm/controls/OrbitControls.js"       "$DEST/addons/controls/OrbitControls.js"
fetch "$BASE/examples/jsm/utils/BufferGeometryUtils.js"    "$DEST/addons/utils/BufferGeometryUtils.js"

echo "Fetching Draco decoder…"
for f in draco_wasm_wrapper.js draco_decoder.wasm draco_decoder.js; do
  fetch "$BASE/examples/jsm/libs/draco/gltf/$f" "$DEST/draco/$f"
done

echo "Done. Update the version comment in index.html's import map if it changed."
