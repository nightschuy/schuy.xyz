/* ============================================================
   HERO 3D — interactive Blender asset (three.js, no build step)
   ------------------------------------------------------------
   Loads images/work/hero.glb and renders it on a transparent
   canvas with brand-colored lighting + auto-rotate. Until that
   file exists, a neon placeholder solid is shown so the layout
   is visible. Swap in your GLB and it takes over automatically.
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MODEL_URL = 'images/work/hero.glb';   // ← drop your Blender export here

// Framing controls
const FILL  = 10;    // figure height in world units (bigger = more zoomed in on FOCUS)
const FOCUS = 0.88;  // vertical focus point: 0 = bottom (feet), 1 = top (head)
const OFFSET_X = 1.25; // bias the figure right on wide layouts so the head clears the copy

// Head-follow (desktop only). Mobile/touch keeps the 360° auto-rotate instead.
const HEAD_YAW   = 0.55;  // max left/right head turn (radians)
const HEAD_PITCH = 0.32;  // max up/down head tilt (radians)
const NECK_SHARE = 0.45;  // how much the neck adds on top of the head motion
const FOLLOW_EASE = 0.09; // smoothing toward the cursor (0–1, lower = lazier)
const SIGN_YAW   = -1;    // flip if the head turns away from the cursor
const SIGN_PITCH = -1;    // flip if the head tilts the wrong way vertically

// Blinking (eyelid bones; skipped under reduced-motion).
const BLINK_MIN_GAP  = 2.8;  // min seconds between blinks
const BLINK_MAX_GAP  = 6.5;  // max seconds between blinks
const BLINK_DURATION = 0.24; // seconds for one full close→open
const BLINK_MAX      = 0.6;  // upper-lid rotation when fully shut (radians)
const BLINK_LOWER    = 0.25; // how much the lower lid joins, as a fraction
const BLINK_SIGN     = 1;    // flip if eyes open instead of close

// Chain halo — chrome links in stacked rings around the head that flow
// continuously around it (after the "Bound" piece). Built in code, no asset.
// Heights / radii are fractions of the head's height, measured at load.
const CHAIN_RINGS = [
  //  height  radius  tilt(rad)  speed(rad/s, sign = direction)
  // Heights are from the head bone, which sits at about nose level on this
  // rig: the eyes are ~0.37 above it, the chin ~0.3 below. The eyes are left
  // clear on purpose — they're the figure's signature.
  {   h: 0.64, r: 0.52, tilt:  0.08, speed:  0.22 },   // forehead
  {   h: 0.17, r: 0.57, tilt: -0.10, speed: -0.17 },   // under the eyes
  {   h: -0.17, r: 0.54, tilt:  0.07, speed:  0.26 },  // mouth
];
const CHAIN_LINK_R    = 0.058; // link radius (fraction of head height)
const CHAIN_LINK_TUBE = 0.019; // link wire thickness
const CHAIN_FORWARD   = 0.12;  // shift rings toward the face (head bone sits at the back of the skull)
const CHAIN_DEPTH     = 1.22;  // rings are ovals: front-to-back radius as a multiple of side-to-side, to clear the face
// Colour loop: every ring cycles through these finishes, each starting at a
// different point, and the colour also travels along the chain as a wave.
// `irid` is three.js thin-film iridescence (the soap-bubble sheen), 0–1.
const CHAIN_PALETTE = [
  { color: 0x7b3cff, irid: 0.0 },   // purple
  { color: 0xff5fc8, irid: 0.0 },   // pink
  { color: 0x2f5bff, irid: 0.0 },   // blue
  { color: 0xe4e4f2, irid: 0.0 },   // chrome
  { color: 0xf2ecff, irid: 1.0 },   // iridescent
];
const CHAIN_CYCLE     = 12;    // seconds for one ring to pass through every finish
const CHAIN_WAVE      = 0.35;  // how much of the palette spans one ring at once (0 = solid)
const GLINT_COUNT     = 5;     // star sparkles that pop on the chain at once
const GLINT_LIFE      = 0.55;  // seconds per sparkle

// Portal — a tunnel of rotating wireframe hexagons flowing toward the head
// out of the dark, a preview of the visual packs. Sizes are in head heights.
const PORTAL_RINGS    = 16;    // rings in flight (fewer on phones)
const PORTAL_RADIUS   = 1.55;  // ring radius
const PORTAL_DEPTH    = 9;     // how far back the tunnel reaches
const PORTAL_SPEED    = 0.55;  // head heights per second toward the viewer
const PORTAL_TWIST    = 0.16;  // rotation per ring, so the tunnel spirals
const PORTAL_SPIN     = 0.12;  // whole-tunnel rotation, rad/s

// Eye bloom — layered additive glow sprites on each eye bone. Faked rather
// than a post-process bloom pass: that would need more vendored three.js
// files, fights the transparent canvas, and costs a full-screen blur on
// phones. Sizes are fractions of head height.
const EYE_BLOOM = [
  //  size   colour     opacity
  { s: 0.22, c: 0xfff0fa, o: 1.0  },   // hot core
  { s: 0.60, c: 0xff4fc4, o: 0.75 },   // magenta glow
  { s: 1.45, c: 0x9b4dff, o: 0.32 },   // wide violet haze
];
const EYE_EMISSIVE   = 1.8;   // boost on the eye materials' own glow (was 1)
const EYE_PULSE      = 0.08;  // breathing amount (0 = steady)

// Motes — glowing specks drifting up around the figure
const MOTE_COUNT      = 140;   // (fewer on phones)

/* The model is by far the heaviest thing on the page. On a metered or slow
   connection the placeholder solid is a far better trade than several
   seconds of blocking download for decoration, so skip the GLB entirely and
   let the placeholder stand in. Desktop and any normal connection are
   unaffected — this only fires on an explicit Save-Data request or a
   connection the browser itself reports as 2g-class. */
function prefersLightHero() {
  const c = navigator.connection;
  if (!c) return false;
  if (c.saveData) return true;
  return ['slow-2g', '2g'].includes(c.effectiveType);
}

const mount = document.getElementById('hero-3d');
if (mount) initHero3D(mount);

function initHero3D(mount) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loaderEl = mount.parentElement.querySelector('.hero-3d-loader');

  // ── Renderer (transparent so the ambient hero bg shows through) ──
  // Phones get fewer pixels and fewer particles: the hero is a full-screen
  // WebGL layer, and a 3× retina phone would otherwise shade ~9× the pixels.
  const isMobile = window.matchMedia('(max-width: 860px)').matches;
  const isTouch  = window.matchMedia('(pointer: coarse)').matches;
  const lite = isMobile || isTouch;

  // Antialias stays on for phones too: MSAA is cheap on mobile tile GPUs,
  // and without it the fine eyelid/brow geometry sparkled as dots on iPhone.
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  mount.appendChild(renderer.domElement);

  // ── Scene + camera ──
  const scene = new THREE.Scene();
  // Near/far kept tight (camera sits ~5 units out): a 0.1 near plane wasted
  // depth precision, and on phones the thin eye layers z-fought the skin.
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 40);
  camera.position.set(0, 0.4, 5);

  // ── Brand lighting (royal blue key, violet fill, magenta rim) ──
  scene.add(new THREE.AmbientLight(0x7a7aa6, 1.15));

  const key = new THREE.DirectionalLight(0x2b4bff, 2.4);   // --blue-2
  key.position.set(4, 5, 5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x6a3aff, 1.6);  // --violet-1
  fill.position.set(-5, 1, 3);
  scene.add(fill);

  const rim = new THREE.PointLight(0xd946ef, 6, 30);       // --magenta
  rim.position.set(-3, 2, -4);
  scene.add(rim);

  // Lower front fill so the torso stays lit all the way down to the fold.
  const torsoFill = new THREE.PointLight(0x4f63e6, 26, 20); // brand blue-violet
  torsoFill.position.set(0, -1.5, 4);
  scene.add(torsoFill);

  // ── Content group (model or placeholder) ──
  const group = new THREE.Group();
  scene.add(group);

  let spinObject = null; // what auto-rotates (mobile/touch)

  // Head-follow is for true mouse pointers; touch devices keep auto-rotate.
  const wantsHeadFollow =
    window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion;
  let headRig = null;                 // { head, neck, baseHead, baseNeck }
  const pointer = { x: 0, y: 0 };     // normalized -1..1 (0,0 = centered/front)
  let curYaw = 0, curPitch = 0;       // eased current angles

  // Blink state
  let eyeRig = null;                  // { upper: [{bone,base}], lower: [...] }
  let blink = 0;                      // 0 = open, 1 = shut
  let blinkStart = -1;                // time the current blink began (-1 = idle)
  let nextBlinkAt = 0;
  const rand = (a, b) => a + Math.random() * (b - a);

  // Robust bounds for skinned/multi-primitive figures: union each mesh's
  // own geometry box (THREE.Box3.setFromObject under-measures these).
  function measureBounds(obj) {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3();
    obj.traverse((o) => {
      if (o.isMesh && o.geometry) {
        o.geometry.computeBoundingBox();
        box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
      }
    });
    return box;
  }

  function frameObject(obj) {
    // 1) Reset, measure true size, scale so the whole figure spans FILL units.
    obj.scale.setScalar(1);
    obj.position.set(0, 0, 0);
    const size = measureBounds(obj).getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    obj.scale.setScalar(FILL / maxDim);

    // 2) Re-measure at final scale, center horizontally, put the FOCUS
    //    height (0 = feet, 1 = head) at the origin (the orbit target).
    const box = measureBounds(obj);
    const center = box.getCenter(new THREE.Vector3());
    obj.position.x -= center.x;
    obj.position.z -= center.z;
    obj.position.y -= THREE.MathUtils.lerp(box.min.y, box.max.y, FOCUS);
  }

  function showPlaceholder() {
    const geo = new THREE.IcosahedronGeometry(1.1, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a3acc,
      emissive: 0x6a3aff,
      emissiveIntensity: 0.35,
      metalness: 0.9,
      roughness: 0.18,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.35 })
    );
    mesh.add(wire);
    group.add(mesh);
    spinObject = mesh;
    if (loaderEl) loaderEl.style.display = 'none';
  }

  // ── Load the Blender GLB (falls back to placeholder) ──
  // On Save-Data / 2g the placeholder is the final state: never start the
  // multi-megabyte download. Everything below this block — controls, resize,
  // the render loop — still has to run, so this only skips the fetch.
  if (prefersLightHero()) {
    showPlaceholder();
  } else {
    loadModel();
  }

  function loadModel() {
    const draco = new DRACOLoader();
    draco.setDecoderPath('js/vendor/three/draco/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(draco);

    gltfLoader.load(
      MODEL_URL,
      (gltf) => {
        const model = gltf.scene;
        frameObject(model);
        group.add(model);
        spinObject = model;
        if (loaderEl) loaderEl.style.display = 'none';

        // Grab eyelid bones for blinking (skip under reduced-motion).
        if (!reduceMotion) {
          const grab = (names) => names
            .map((n) => { const b = model.getObjectByName(n); return b ? { bone: b, base: b.quaternion.clone() } : null; })
            .filter(Boolean);
          const upper = grab(['lEyelidUpper', 'lEyelidUpperInner', 'lEyelidUpperOuter',
                              'rEyelidUpper', 'rEyelidUpperInner', 'rEyelidUpperOuter']);
          const lower = grab(['lEyelidLower', 'lEyelidLowerInner', 'lEyelidLowerOuter',
                              'rEyelidLower', 'rEyelidLowerInner', 'rEyelidLowerOuter']);
          if (upper.length) {
            eyeRig = { upper, lower };
            nextBlinkAt = performance.now() / 1000 + rand(BLINK_MIN_GAP, BLINK_MAX_GAP);
          }
        }

        buildChain(model);
        buildAtmosphere();
        buildEyeBloom(model);

        // Grab the head/neck bones for cursor tracking (desktop).
        if (wantsHeadFollow) {
          const head = model.getObjectByName('head');
          const neck = model.getObjectByName('neckUpper') || model.getObjectByName('neckLower');
          if (head) {
            headRig = {
              head, neck,
              baseHead: head.quaternion.clone(),
              baseNeck: neck ? neck.quaternion.clone() : null,
            };
          }
        }
      },
      undefined,
      () => {
        // No GLB yet (or failed to load) → show placeholder.
        console.info('[hero3d] %s not found — showing placeholder.', MODEL_URL);
        showPlaceholder();
      }
    );
  }

  // ── Chain halo ──
  // A near-white studio reflection map with only a hint of brand colour:
  // chrome with nothing to reflect renders black, and a strongly tinted
  // backdrop drowns the chain's own colour loop (pink and silver read as
  // blue). Only the chain uses it, so the figure keeps its existing look.
  function brandEnvMap() {
    const env = new THREE.Scene();
    const quad = (color, w, h, pos, look) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
      m.position.set(...pos); m.lookAt(...look); env.add(m);
    };
    env.background = new THREE.Color(0x121220);
    quad(0xffffff, 6, 2,  [0, 6, 0],  [0, 0, 0]);   // top softbox
    quad(0xe2e6ff, 4, 6,  [6, 1, 2],  [0, 0, 0]);   // cool white key
    quad(0xffd9f4, 3, 5,  [-6, 1, -2], [0, 0, 0]);  // pink-white rim
    quad(0xf2eeff, 6, 3,  [0, 1, 6],  [0, 0, 0]);   // front fill
    quad(0x9fb8ff, 3, 3,  [-3, -2, 5], [0, 0, 0]);  // faint blue kicker
    const pmrem = new THREE.PMREMGenerator(renderer);
    const tex = pmrem.fromScene(env, 0.02).texture;
    pmrem.dispose();
    return tex;
  }

  let chain = null; // { group, rings: [{ mesh, count, ... }], bone, q0inv, offset }

  function buildChain(model) {
    const bone = model.getObjectByName('head');
    if (!bone) return;
    model.updateMatrixWorld(true);

    // Head size: from the head bone (base of the skull) to the top of the figure.
    const top = measureBounds(model).max.y;
    const bonePos = bone.getWorldPosition(new THREE.Vector3());
    const hh = top - bonePos.y;
    if (!(hh > 0)) return;

    // Physical material for the iridescence; the base colour is white and
    // each link's own instance colour tints it. One material per ring so
    // each ring's iridescence can rise and fall on its own.
    const envMap = brandEnvMap();
    const makeMat = () => new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 1,
      roughness: 0.14,
      envMap,
      envMapIntensity: 1.6,
      emissive: 0x1c0f66,
      emissiveIntensity: 0.08,
      iridescence: 0,
      iridescenceIOR: 1.4,
      iridescenceThicknessRange: [150, 750],
    });

    // One oval link: a torus stretched along X (its long axis = chain direction).
    const linkR = CHAIN_LINK_R * hh, tube = CHAIN_LINK_TUBE * hh;
    const geo = new THREE.TorusGeometry(linkR, tube, 10, 24);
    geo.scale(1.55, 1, 1);
    const pitch = linkR * 1.55 * 2 * 0.74;    // centre-to-centre, so links interlock

    const group = new THREE.Group();
    const rings = CHAIN_RINGS.map((cfg, rings0) => {
      const R = cfg.r * hh, Rz = R * CHAIN_DEPTH;
      // Ellipse perimeter (Ramanujan) → how many links fit
      const perim = Math.PI * (3 * (R + Rz) - Math.sqrt((3 * R + Rz) * (R + 3 * Rz)));
      let count = Math.round(perim / pitch);
      count += count % 2;                      // even, so the alternation closes
      const mesh = new THREE.InstancedMesh(geo, makeMat(), count);
      const holder = new THREE.Group();
      holder.position.y = cfg.h * hh;
      holder.rotation.x = cfg.tilt;
      holder.add(mesh);
      group.add(holder);
      return { mesh, count, R, Rz, speed: cfg.speed, phase: Math.random() * Math.PI * 2,
               hue: rings0 / CHAIN_RINGS.length };   // where this ring starts in the palette
    });

    // Rings live in world space and copy the head bone's motion each frame,
    // as a delta from its rest pose — independent of the rig's bone axes.
    scene.add(group);
    const q0 = bone.getWorldQuaternion(new THREE.Quaternion());
    chain = {
      group, rings, bone, hh,
      q0inv: q0.clone().invert(),
      offset: new THREE.Vector3(0, 0, CHAIN_FORWARD * hh),
    };
    layoutChain(0);
  }

  // Place every link on its ring at the ring's current phase.
  const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _t = new THREE.Vector3();
  const _up = new THREE.Vector3(0, 1, 0), _rad = new THREE.Vector3(), _z = new THREE.Vector3();
  // Palette lookup, wrapping: t in any range → smooth blend of two stops.
  const PALETTE = CHAIN_PALETTE.map((p) => ({ c: new THREE.Color(p.color), irid: p.irid }));
  const _col = new THREE.Color();
  function paletteAt(t, out) {
    const n = PALETTE.length;
    const f = (((t % 1) + 1) % 1) * n;
    const i = Math.floor(f), j = (i + 1) % n;
    const k = f - i, e = k * k * (3 - 2 * k);           // smoothstep: linger on each finish
    out.copy(PALETTE[i].c).lerp(PALETTE[j].c, e);
    return PALETTE[i].irid + (PALETTE[j].irid - PALETTE[i].irid) * e;
  }

  let colourClock = 0;
  function layoutChain(dt) {
    colourClock += dt / CHAIN_CYCLE;
    for (const ring of chain.rings) {
      ring.phase += ring.speed * dt;
      const base = ring.hue + colourClock;
      // The ring's sheen follows the colour at its midpoint
      ring.mesh.material.iridescence = paletteAt(base + CHAIN_WAVE / 2, _col);
      for (let i = 0; i < ring.count; i++) {
        const a = ring.phase + (i / ring.count) * Math.PI * 2;
        const c = Math.cos(a), sn = Math.sin(a);
        _p.set(c * ring.R, 0, sn * ring.Rz);
        _t.set(-sn * ring.R, 0, c * ring.Rz).normalize();   // tangent
        _rad.set(c * ring.Rz, 0, sn * ring.R).normalize();  // outward normal
        // Alternate links stand vertical / lie flat so they read as a chain.
        const side = i % 2 ? _rad : _up;
        _z.crossVectors(_t, side);
        _m.makeBasis(_t, side, _z).setPosition(_p);
        ring.mesh.setMatrixAt(i, _m);
        // Colour wave rides with the link (indexed by i, not position), so
        // it flows around the head as the chain turns.
        const w = Math.abs(i / ring.count * 2 - 1);      // 0→1→0 around the ring: no seam
        paletteAt(base + w * CHAIN_WAVE, _col);
        ring.mesh.setColorAt(i, _col);
      }
      ring.mesh.instanceMatrix.needsUpdate = true;
      ring.mesh.instanceColor.needsUpdate = true;
    }
  }

  const _hq = new THREE.Quaternion(), _hp = new THREE.Vector3();
  function updateChain(dt) {
    chain.bone.getWorldPosition(_hp);
    chain.bone.getWorldQuaternion(_hq).multiply(chain.q0inv);   // head motion since rest
    chain.group.quaternion.copy(_hq);
    chain.group.position.copy(_hp).add(_p.copy(chain.offset).applyQuaternion(_hq));
    if (!reduceMotion) layoutChain(dt);
  }

  // ── Atmosphere: portal tunnel, motes, chain glints ──
  // All three are anchored to the head (measured in buildChain) so they
  // frame it at any viewport size. They never rotate with the head.
  let atmo = null;

  // Soft round dot / four-point star, drawn once to small canvases.
  function spriteTexture(kind) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    if (kind === 'glow') {
      // Long, smooth falloff — reads as light bleeding, not a disc
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, 'rgba(255,255,255,1)');
      r.addColorStop(0.18, 'rgba(255,255,255,0.6)');
      r.addColorStop(0.45, 'rgba(255,255,255,0.18)');
      r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r;
      g.fillRect(0, 0, 64, 64);
    } else if (kind === 'dot') {
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, 'rgba(255,255,255,1)');
      r.addColorStop(0.35, 'rgba(255,255,255,0.45)');
      r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r;
      g.fillRect(0, 0, 64, 64);
    } else {
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 10);
      r.addColorStop(0, 'rgba(255,255,255,1)');
      r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r;
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = 'rgba(255,255,255,0.9)';
      for (const [w, h] of [[34, 2.4], [2.4, 34]]) {   // the star's spikes — short, so it reads as a sparkle, not a scratch
        g.beginPath(); g.ellipse(32, 32, w / 2, h / 2, 0, 0, Math.PI * 2); g.fill();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  // Cerulean → royal blue → violet → magenta, the site's spectrum rule.
  const SPECTRUM = [0x3d8ddf, 0x2b4bff, 0x6a3aff, 0xd946ef].map((h) => new THREE.Color(h));
  function spectrumAt(t) {
    const f = THREE.MathUtils.clamp(t, 0, 1) * (SPECTRUM.length - 1);
    const i = Math.min(SPECTRUM.length - 2, Math.floor(f));
    return SPECTRUM[i].clone().lerp(SPECTRUM[i + 1], f - i);
  }

  function buildAtmosphere() {
    if (!chain) return;
    const hh = chain.hh;
    const root = new THREE.Group();
    scene.add(root);

    // Portal: hexagon line loops, each with its own material for fading.
    const ringCount = lite ? Math.round(PORTAL_RINGS * 0.6) : PORTAL_RINGS;
    const hexPts = [];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
      hexPts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
    }
    const hexGeo = new THREE.BufferGeometry().setFromPoints(hexPts);
    const portal = new THREE.Group();
    root.add(portal);
    const portalRings = [];
    for (let i = 0; i < ringCount; i++) {
      const mat = new THREE.LineBasicMaterial({
        transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const loop = new THREE.LineLoop(hexGeo, mat);
      loop.scale.setScalar(PORTAL_RADIUS * hh);
      loop.renderOrder = -1;
      portal.add(loop);
      // Second, slightly larger loop gives each ring a doubled, neon-tube edge.
      const echo = new THREE.LineLoop(hexGeo, mat);
      echo.scale.setScalar(1.035);
      loop.add(echo);
      portalRings.push({ loop, mat, u: i / ringCount });  // u: 0 = far, 1 = at the head
    }

    // Motes: points in a column around the head and shoulders, drifting up.
    const moteCount = lite ? Math.round(MOTE_COUNT * 0.45) : MOTE_COUNT;
    const pos = new Float32Array(moteCount * 3);
    const col = new Float32Array(moteCount * 3);
    const speed = new Float32Array(moteCount);
    const span = { x: 3.2 * hh, y: 4.5 * hh, z: 2.4 * hh };
    for (let i = 0; i < moteCount; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * span.x;
      pos[i * 3 + 1] = (Math.random() - 0.6) * span.y;
      pos[i * 3 + 2] = (Math.random() - 0.5) * span.z;
      spectrumAt(Math.random()).toArray(col, i * 3);
      speed[i] = (0.08 + Math.random() * 0.18) * hh;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    moteGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
      size: 0.075 * hh, map: spriteTexture('dot'), vertexColors: true,
      transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    root.add(motes);

    // Glints: star sprites that flash on front-facing chain links.
    const starTex = spriteTexture('star');
    const glints = [];
    for (let i = 0; i < GLINT_COUNT; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: starTex, color: 0xf4f0ff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      sp.renderOrder = 10;
      scene.add(sp);
      glints.push({ sp, born: -1, wait: Math.random() * 1.5, ring: 0, idx: 0 });
    }

    atmo = { root, portal, portalRings, motes, speed, span, glints, t: 0 };
  }

  const _gm = new THREE.Matrix4(), _gp = new THREE.Vector3(), _camDir = new THREE.Vector3();
  function updateAtmosphere(dt) {
    const hh = chain.hh;
    atmo.t += dt;
    // Anchor at the head's centre (bone + half a head up), never its rotation.
    chain.bone.getWorldPosition(atmo.root.position);
    atmo.root.position.y += 0.35 * hh;
    // Point the tunnel straight away from the camera, so its vanishing point
    // sits behind the head even when the camera is offset (desktop layout).
    atmo.portal.lookAt(camera.position);

    if (!reduceMotion) {
      // Portal flows toward the head; each ring fades in far away and out
      // just behind the head so nothing ever crosses the face.
      const step = (PORTAL_SPEED * dt) / PORTAL_DEPTH;
      atmo.portalRings.forEach((r, i) => {
        r.u = (r.u + step) % 1;
        r.loop.position.z = -0.7 * hh - (1 - r.u) * PORTAL_DEPTH * hh;
        r.loop.rotation.z = i * PORTAL_TWIST + atmo.t * PORTAL_SPIN;
        const fade = Math.min(r.u / 0.25, (1 - r.u) / 0.12, 1);
        r.mat.opacity = Math.max(0, fade) * 0.55;
        r.mat.color.copy(spectrumAt(1 - r.u));
      });

      // Motes rise and wrap.
      const p = atmo.motes.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let y = p.array[i * 3 + 1] + atmo.speed[i] * dt;
        if (y > atmo.span.y * 0.4) y -= atmo.span.y;
        p.array[i * 3 + 1] = y;
        p.array[i * 3] += Math.sin(atmo.t * 0.6 + i) * 0.02 * hh * dt;
      }
      p.needsUpdate = true;

      // Glints: pick a link on a random ring, flash, rest, repeat.
      camera.getWorldDirection(_camDir);
      for (const g of atmo.glints) {
        if (g.born < 0) {
          g.wait -= dt;
          if (g.wait > 0) continue;
          g.ring = Math.floor(Math.random() * chain.rings.length);
          g.idx = Math.floor(Math.random() * chain.rings[g.ring].count);
          g.born = atmo.t;
        }
        const ring = chain.rings[g.ring];
        ring.mesh.getMatrixAt(g.idx, _gm);
        _gp.setFromMatrixPosition(_gm).applyMatrix4(ring.mesh.matrixWorld);
        // Only sparkle on links facing the camera (in front of the head).
        const facing = _gp.clone().sub(atmo.root.position).dot(_camDir) < 0;
        const k = (atmo.t - g.born) / GLINT_LIFE;
        if (k >= 1 || !facing) {
          g.born = -1; g.wait = 0.2 + Math.random() * 1.6;
          g.sp.material.opacity = 0;
          continue;
        }
        const pulse = Math.sin(k * Math.PI);
        g.sp.position.copy(_gp);
        g.sp.scale.setScalar(hh * (lite ? 0.18 : 0.24) * pulse);
        g.sp.material.opacity = pulse;
        g.sp.material.rotation = k * 0.8;
      }
    } else {
      // Still frame: the portal drawn once at rest.
      atmo.portalRings.forEach((r, i) => {
        r.loop.position.z = -0.7 * hh - (1 - r.u) * PORTAL_DEPTH * hh;
        r.loop.rotation.z = i * PORTAL_TWIST;
        r.mat.opacity = Math.max(0, Math.min(r.u / 0.25, (1 - r.u) / 0.12, 1)) * 0.55;
        r.mat.color.copy(spectrumAt(1 - r.u));
      });
    }
  }

  // ── Eye bloom ──
  let eyeGlow = null;   // { eyes: [{ bone, sprites: [...] }], hh }
  function buildEyeBloom(model) {
    const bones = ['lEye', 'rEye'].map((n) => model.getObjectByName(n)).filter(Boolean);
    if (!bones.length || !chain) return;
    const hh = chain.hh;

    // Push the eye materials' own emissive so the core is white-hot.
    model.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of [].concat(o.material)) {
        // Solid parts only. Cornea / EyeMoisture are thin shells lying almost
        // on the skin; boosting them made their z-fighting with the lids and
        // brow show up as glowing speckles on iPhone.
        if (/^(Sclera|Irises|Pupils)/.test(m.name)) m.emissiveIntensity = EYE_EMISSIVE;
      }
    });

    const tex = spriteTexture('glow');
    const eyes = bones.map((bone) => ({
      bone,
      sprites: EYE_BLOOM.map((l) => {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({
          map: tex, color: l.c, transparent: true, opacity: l.o,
          // depthTest off so the light spills over the brow and lids like
          // real bloom instead of being clipped by them
          blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
          toneMapped: false,   // full-strength light, not squeezed by ACES
        }));
        sp.scale.setScalar(l.s * hh);
        sp.renderOrder = 20;
        scene.add(sp);
        // Phones: a touch less glow — small screens read it as blown out
        return { sp, base: l.o * (lite ? 0.7 : 1), size: l.s * hh * (lite ? 0.85 : 1) };
      }),
    }));
    eyeGlow = { eyes, t: 0 };
  }

  function updateEyeBloom(dt) {
    eyeGlow.t += dt;
    const breathe = reduceMotion ? 1 : 1 + Math.sin(eyeGlow.t * 1.6) * EYE_PULSE;
    const open = 1 - blink * 0.9;              // closing lids smother the glow
    for (const e of eyeGlow.eyes) {
      e.bone.getWorldPosition(_gp);
      for (const l of e.sprites) {
        l.sp.position.copy(_gp);
        l.sp.material.opacity = l.base * open * breathe;
        l.sp.scale.setScalar(l.size * (0.85 + 0.15 * open) * breathe);
      }
    }
  }

  // ── Controls (orbit by drag; no zoom/pan) ──
  // Desktop (mouse) only: drag to orbit + cursor head-follow. Touch devices get
  // no interaction so finger swipes scroll the page (see below).
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = !isMobile && !wantsHeadFollow && !reduceMotion;
  controls.autoRotateSpeed = 1.1;
  controls.minPolarAngle = Math.PI * 0.25;
  controls.maxPolarAngle = Math.PI * 0.72;

  // On touch devices the figure is non-interactive: OrbitControls sets
  // touch-action:none on the canvas, which traps page scrolling over the
  // full-bleed figure. Drop all pointer capture so swipes scroll the page.
  if (isTouch) {
    controls.enabled = false;
    renderer.domElement.style.touchAction = 'pan-y';
    renderer.domElement.style.pointerEvents = 'none';
  }

  // ── Cursor tracking (desktop) ──
  if (wantsHeadFollow) {
    window.addEventListener('pointermove', (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;   // -1 (left) .. 1 (right)
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;  // -1 (top) .. 1 (bottom)
    }, { passive: true });
  }

  // Rotate a bone toward (yaw, pitch) on top of its rest pose.
  const _qy = new THREE.Quaternion();
  const _qx = new THREE.Quaternion();
  const _ax = new THREE.Vector3(1, 0, 0);
  const _ay = new THREE.Vector3(0, 1, 0);
  function applyLook(bone, base, yaw, pitch) {
    _qy.setFromAxisAngle(_ay, yaw);
    _qx.setFromAxisAngle(_ax, pitch);
    bone.quaternion.copy(base).multiply(_qy).multiply(_qx);
  }

  // ── Resize to the mount element ──
  function resize() {
    const w = mount.clientWidth || 1;
    const h = mount.clientHeight || 1;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Bias the figure right on wide (full-bleed) layouts so the head clears
    // the copy; stay centered on narrow/mobile (keeps auto-rotate balanced).
    const ox = (w / h) > 1.1 ? -OFFSET_X : 0;
    controls.target.x = ox;
    camera.position.x = ox;
  }
  new ResizeObserver(resize).observe(mount);
  resize();

  // ── Render loop (pauses when tab hidden) ──
  let raf = null;
  let lastT = performance.now();
  function tick() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    controls.update();

    if (headRig) {
      const tYaw   = SIGN_YAW   * THREE.MathUtils.clamp(pointer.x, -1, 1) * HEAD_YAW;
      const tPitch = SIGN_PITCH * THREE.MathUtils.clamp(pointer.y, -1, 1) * HEAD_PITCH;
      curYaw   += (tYaw   - curYaw)   * FOLLOW_EASE;
      curPitch += (tPitch - curPitch) * FOLLOW_EASE;
      applyLook(headRig.head, headRig.baseHead, curYaw, curPitch);
      if (headRig.neck && headRig.baseNeck) {
        applyLook(headRig.neck, headRig.baseNeck, curYaw * NECK_SHARE, curPitch * NECK_SHARE);
      }
    }

    if (eyeRig) {
      const t = performance.now() / 1000;
      if (blinkStart < 0 && t >= nextBlinkAt) blinkStart = t;
      if (blinkStart >= 0) {
        const p = (t - blinkStart) / BLINK_DURATION;
        if (p >= 1) { blink = 0; blinkStart = -1; nextBlinkAt = t + rand(BLINK_MIN_GAP, BLINK_MAX_GAP); }
        else blink = Math.sin(p * Math.PI); // smooth 0 → 1 → 0
      }
      const aUp =  BLINK_SIGN * BLINK_MAX * blink;
      const aLo = -BLINK_SIGN * BLINK_MAX * BLINK_LOWER * blink;
      for (const e of eyeRig.upper) applyLook(e.bone, e.base, 0, aUp);
      for (const e of eyeRig.lower) applyLook(e.bone, e.base, 0, aLo);
    }

    if (chain) {
      // Bone matrices are only refreshed at render; refresh now so the
      // chain tracks this frame's head pose rather than the last one.
      scene.updateMatrixWorld();
      updateChain(dt);
      if (atmo) updateAtmosphere(dt);
      if (eyeGlow) updateEyeBloom(dt);
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();

  // Only draw while the hero is on screen and the tab is visible — a
  // full-screen WebGL loop scrolled out of view is pure battery drain.
  let onScreen = true;
  function sync() {
    const run = onScreen && !document.hidden;
    if (!run && raf) { cancelAnimationFrame(raf); raf = null; }
    else if (run && !raf) { lastT = performance.now(); tick(); }
  }
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); }).observe(mount);
}
