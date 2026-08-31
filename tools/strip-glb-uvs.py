#!/usr/bin/env python3
"""Strip unused TEXCOORD (UV) attributes from a GLB and repack the binary.

The hero figure is shaded entirely by procedural PBR materials — the file
carries zero textures and zero samplers — so every UV coordinate in it is
dead weight that still costs the visitor a download.

This removes TEXCOORD_n attributes, garbage-collects any accessor and
bufferView that nothing references any more, and rewrites the BIN chunk
without the orphaned bytes.

It REFUSES to run if the file actually has textures, so it can't quietly
break a model that needs its UVs.

Usage:  python3 tools/strip-glb-uvs.py images/work/hero.glb [-o out.glb]
"""
import json
import struct
import sys
from pathlib import Path


def read_glb(path):
    d = path.read_bytes()
    magic, version, length = struct.unpack('<III', d[:12])
    if magic != 0x46546C67:
        sys.exit(f'{path}: not a GLB (bad magic)')
    chunks, off = {}, 12
    while off < length:
        clen, ctype = struct.unpack('<II', d[off:off + 8])
        chunks[ctype] = d[off + 8: off + 8 + clen]
        off += 8 + clen + (-clen % 4)
    return json.loads(chunks[0x4E4F534A]), bytearray(chunks[0x004E4942])


def write_glb(path, gltf, bin_data):
    js = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    js += b' ' * (-len(js) % 4)
    bn = bytes(bin_data) + b'\x00' * (-len(bin_data) % 4)
    total = 12 + 8 + len(js) + 8 + len(bn)
    with path.open('wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(bn), 0x004E4942)); f.write(bn)
    return total


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    src = Path(args[0])
    dst = Path(args[args.index('-o') + 1]) if '-o' in args else src

    gltf, bin_data = read_glb(src)

    if gltf.get('textures') or gltf.get('images'):
        sys.exit('REFUSING: this model has textures — its UVs are load-bearing.')
    for bv in gltf.get('bufferViews', []):
        if 'byteStride' in bv:
            sys.exit('REFUSING: interleaved bufferViews; repacking needs care.')
    if any('sparse' in a for a in gltf.get('accessors', [])):
        sys.exit('REFUSING: sparse accessors are not handled.')

    removed = 0
    for mesh in gltf.get('meshes', []):
        for prim in mesh.get('primitives', []):
            for attr in [a for a in prim['attributes'] if a.startswith('TEXCOORD_')]:
                del prim['attributes'][attr]
                removed += 1
            for target in prim.get('targets', []):
                for attr in [a for a in target if a.startswith('TEXCOORD_')]:
                    del target[attr]
                    removed += 1

    # Collect every accessor still reachable from the document.
    used = set()
    for mesh in gltf.get('meshes', []):
        for prim in mesh.get('primitives', []):
            used.update(prim['attributes'].values())
            if 'indices' in prim:
                used.add(prim['indices'])
            for target in prim.get('targets', []):
                used.update(target.values())
    for skin in gltf.get('skins', []):
        if 'inverseBindMatrices' in skin:
            used.add(skin['inverseBindMatrices'])
    for anim in gltf.get('animations', []):
        for s in anim.get('samplers', []):
            used.update((s['input'], s['output']))

    # Rebuild accessors + bufferViews, copying only live bytes.
    new_accessors, new_views, new_bin, remap = [], [], bytearray(), {}
    for old_idx, acc in enumerate(gltf['accessors']):
        if old_idx not in used:
            continue
        remap[old_idx] = len(new_accessors)
        acc = dict(acc)
        if 'bufferView' in acc:
            bv = gltf['bufferViews'][acc['bufferView']]
            start = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
            length = bv['byteLength'] - acc.get('byteOffset', 0)
            new_bin += b'\x00' * (-len(new_bin) % 4)          # keep 4-byte alignment
            offset = len(new_bin)
            new_bin += bin_data[start:start + length]
            view = {'buffer': 0, 'byteOffset': offset, 'byteLength': length}
            if 'target' in bv:
                view['target'] = bv['target']
            acc['bufferView'] = len(new_views)
            acc.pop('byteOffset', None)
            new_views.append(view)
        new_accessors.append(acc)

    # Repoint every accessor reference at its new index.
    for mesh in gltf.get('meshes', []):
        for prim in mesh.get('primitives', []):
            prim['attributes'] = {k: remap[v] for k, v in prim['attributes'].items()}
            if 'indices' in prim:
                prim['indices'] = remap[prim['indices']]
            for target in prim.get('targets', []):
                for k in list(target):
                    target[k] = remap[target[k]]
    for skin in gltf.get('skins', []):
        if 'inverseBindMatrices' in skin:
            skin['inverseBindMatrices'] = remap[skin['inverseBindMatrices']]
    for anim in gltf.get('animations', []):
        for s in anim.get('samplers', []):
            s['input'], s['output'] = remap[s['input']], remap[s['output']]

    gltf['accessors'] = new_accessors
    gltf['bufferViews'] = new_views
    gltf['buffers'] = [{'byteLength': len(new_bin)}]

    before = src.stat().st_size
    after = write_glb(dst, gltf, new_bin)
    print(f'removed {removed} TEXCOORD attributes, '
          f'{len(gltf["accessors"])} accessors kept '
          f'({len(remap)} of {len(remap) + (removed)} referenced)')
    print(f'{before/1e6:.2f} MB -> {after/1e6:.2f} MB '
          f'({100 - after * 100 // before}% smaller)')


if __name__ == '__main__':
    main()
