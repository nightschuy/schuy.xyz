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

const mount = document.getElementById('hero-3d');
if (mount) initHero3D(mount);

function initHero3D(mount) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loaderEl = mount.parentElement.querySelector('.hero-3d-loader');

  // ── Renderer (transparent so the ambient hero bg shows through) ──
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  mount.appendChild(renderer.domElement);

  // ── Scene + camera ──
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
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

  const isMobile = window.matchMedia('(max-width: 860px)').matches;

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
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
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

  // ── Controls (orbit by drag; no zoom/pan) ──
  // Touch devices auto-rotate; mouse devices stay still and track the cursor.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = !isMobile && !wantsHeadFollow && !reduceMotion;
  controls.autoRotateSpeed = 1.1;
  controls.minPolarAngle = Math.PI * 0.25;
  controls.maxPolarAngle = Math.PI * 0.72;
  if (isMobile) controls.enabled = false;

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
  function tick() {
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

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (!raf) tick();
  });
}
