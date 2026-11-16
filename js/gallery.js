/* ============================================================
   SCHUY.XYZ — Gallery page
   Exhibit (one piece at a time on a horizontal strip) and Index
   (even grid), both built from GALLERY_ITEMS. Loaded after main.js,
   which handles the nav, cursor glow, analytics and footer year.
   ============================================================ */

'use strict';

// ── Add or remove entries to update the gallery ───────────
// Put the source image in /images/work/<name>.jpg (any 4:5 size, 1080 wide
// or larger), then run tools/make-avif.sh — it serves every piece at the
// same 1080×1350 so the exhibit never jumps between resolutions. Then add
// an entry here. Order here is the order of the exhibit.
//
//   name    file stem, shared by the JPEG and every AVIF derivative — also
//           the piece's deep link (/gallery/#saturn)
//   title   used only in alt text and accessible labels, never shown
//   year    optional; likewise
//
// Keep this list in sync with the structured data in index.html.
const PIECE_W = 1080, PIECE_H = 1350;

const GALLERY_ITEMS = [
  { name: 'saturn',     title: 'Saturn',     year: '2025' },
  { name: 'bound',      title: 'Bound' },
  { name: 'shattered',  title: 'Shattered',  year: '2025' },
  { name: 'kickflip',   title: 'Kickflip' },
  { name: 'boogie',     title: 'Boogie',     year: '2025' },
  { name: 'partner',    title: 'Partner',    year: '2025' },
  { name: 'levitate',   title: 'Levitate' },
  { name: 'viber',      title: 'Viber',      year: '2024' },
  { name: 'skullmance', title: 'Skullmance', year: '2024' },
  { name: 'ritual',     title: 'Ritual' },
  { name: 'return',     title: 'Return',     year: '2025' },
  { name: 'focus',      title: 'Focus',      year: '2023' },
  { name: 'fixed',      title: 'Fixed',      year: '2024' },
];

/* ── Responsive image helpers ─────────────────────────────
   Each piece ships as three AVIFs (480 / 800 / 1080) plus the source JPEG
   as the <picture> fallback. */
const jpegSrc = item => `/images/work/${item.name}.jpg`;
const avifSrc = (item, w) => `/images/work/avif/${item.name}-${w}.avif`;
const avifSet = item => [480, 800, PIECE_W].map(w => `${avifSrc(item, w)} ${w}w`).join(', ');
const altText = item =>
  `${item.title}${item.year ? ` (${item.year})` : ''} — digital artwork by Schuyler Hample (Schuy)`;

const picture = (item, sizes, eager) => `
  <picture>
    <source type="image/avif" srcset="${avifSet(item)}" sizes="${sizes}">
    <img src="${jpegSrc(item)}" alt="${altText(item)}" width="${PIECE_W}" height="${PIECE_H}"
         loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>
  </picture>`;

// The exhibit slide is ~0.8 × its height wide; the stage is roughly the
// viewport less the nav and controls. Focus mode serves the native tier.
const SIZES_SLIDE = '(max-width: 768px) 74vw, 62vh';
const SIZES_TILE  = '(max-width: 1024px) 46vw, (min-width: 1280px) 384px, 31vw';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', initGalleryPage);

function initGalleryPage() {
  const root  = document.getElementById('gallery');
  if (!root) return;

  const track = root.querySelector('.exhibit-track');
  const rail  = root.querySelector('.exhibit-rail');
  const grid  = root.querySelector('.gallery-grid');
  const ambient = [...root.querySelectorAll('.exhibit-ambient-layer')];

  let current = -1;
  let ambientFront = 0;
  // While a programmatic scroll is in flight, the scroll handler must not
  // re-pick the "current" piece from whatever happens to be mid-screen.
  let target = null, targetTimer;

  /* ── Build ─────────────────────────────────────────────── */
  GALLERY_ITEMS.forEach((item, i) => {
    // Exhibit slide
    const li = document.createElement('li');
    li.className = 'exhibit-slide';
    // data-name, not id: an id matching the URL hash would make the browser
    // run its own anchor jump after load and knock the strip off by a piece.
    li.dataset.name = item.name;
    li.setAttribute('aria-roledescription', 'slide');
    li.setAttribute('aria-label', `${i + 1} of ${GALLERY_ITEMS.length}`);
    li.innerHTML = `
      <button type="button" class="exhibit-frame" aria-label="View ${item.title} full screen">
        ${picture(item, SIZES_SLIDE, i < 2)}
      </button>`;
    li.querySelector('.exhibit-frame').addEventListener('click', () => {
      if (i !== current) return goTo(i);
      setFocus(!document.body.classList.contains('gallery-focus'));
    });
    track.appendChild(li);

    // Thumbnail rail
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'exhibit-thumb';
    thumb.setAttribute('role', 'tab');
    thumb.setAttribute('aria-label', `Go to ${item.title}`);
    thumb.innerHTML = `<img src="${avifSrc(item, 480)}" alt="" loading="lazy" decoding="async">`;
    thumb.addEventListener('click', () => goTo(i));
    rail.appendChild(thumb);

    // Index tile
    const fig = document.createElement('figure');
    fig.className = 'gallery-item';
    fig.setAttribute('role', 'listitem');
    fig.innerHTML = `
      <button type="button" class="gallery-frame" aria-label="Open ${item.title} in the exhibit">
        ${picture(item, SIZES_TILE, false)}
      </button>`;
    fig.querySelector('.gallery-frame').addEventListener('click', () => {
      setView('exhibit');
      goTo(i, true);
    });
    grid.appendChild(fig);
  });

  const slides = [...track.children];
  const thumbs = [...rail.children];

  /* ── Navigation ─────────────────────────────────────────── */
  function slideOffset(i) {
    const s = slides[i];
    return s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2;
  }

  function goTo(i, instant) {
    i = Math.max(0, Math.min(GALLERY_ITEMS.length - 1, i));
    target = i;
    clearTimeout(targetTimer);
    targetTimer = setTimeout(() => { target = null; }, 900);   // scrollend fallback
    track.scrollTo({ left: slideOffset(i), behavior: instant || reducedMotion ? 'auto' : 'smooth' });
    setCurrent(i);
  }

  function setCurrent(i) {
    if (i === current) return;
    current = i;
    const item = GALLERY_ITEMS[i];

    slides.forEach((s, k) => s.classList.toggle('is-current', k === i));
    thumbs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
    // Keep the active thumb in view. Set directly, not with a smooth
    // scrollIntoView — Chrome cancels the track's own smooth scroll when a
    // second smooth scroll starts, which snapped the exhibit back a piece.
    const t = thumbs[i];
    rail.scrollLeft = t.offsetLeft - (rail.clientWidth - t.offsetWidth) / 2;
    root.querySelector('.exhibit-arrow[data-dir="-1"]').disabled = i === 0;
    root.querySelector('.exhibit-arrow[data-dir="1"]').disabled  = i === GALLERY_ITEMS.length - 1;

    // Light the room with this piece: load the blurred layer behind, then
    // fade it up over the old one.
    const back = ambient[1 - ambientFront];
    back.style.backgroundImage = `url("${avifSrc(item, 480)}")`;
    back.classList.add('is-on');
    ambient[ambientFront].classList.remove('is-on');
    ambientFront = 1 - ambientFront;

    // Deep link without filling the back-button history
    history.replaceState(null, '', `#${item.name}`);
  }

  // Scroll → which slide is centred, and how far each slide sits from centre
  // (drives the scale/fade of the neighbours via --d).
  let ticking = false;
  function onTrackScroll() {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    slides.forEach((s, k) => {
      const centre = s.offsetLeft + s.offsetWidth / 2;
      const dist = Math.abs(centre - mid);
      s.style.setProperty('--d', Math.min(1, dist / (s.offsetWidth * 1.1)).toFixed(3));
      if (dist < bestDist) { bestDist = dist; best = k; }
    });
    if (target === null) setCurrent(best);
    else if (best === target) target = null;
    ticking = false;
  }
  track.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onTrackScroll); }
  }, { passive: true });
  track.addEventListener('scrollend', () => { target = null; onTrackScroll(); });

  root.querySelectorAll('.exhibit-arrow').forEach(btn =>
    btn.addEventListener('click', () => goTo(current + Number(btn.dataset.dir))));

  // A mouse wheel scrolls vertically; in the exhibit that should move
  // through the work. One notch = one piece. At either end the wheel is
  // released so the page can still scroll to the footer.
  let wheelLock = 0;
  track.addEventListener('wheel', e => {
    if (root.dataset.view !== 'exhibit') return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   // trackpad sideways: native
    const dir = Math.sign(e.deltaY);
    if (!dir) return;
    if ((dir < 0 && current === 0) || (dir > 0 && current === GALLERY_ITEMS.length - 1)) return;
    e.preventDefault();
    const now = performance.now();
    if (now - wheelLock < 450) return;
    wheelLock = now;
    goTo(current + dir);
  }, { passive: false });

  document.addEventListener('keydown', e => {
    if (root.dataset.view !== 'exhibit') return;
    if (e.target.closest?.('input, textarea, select')) return;
    if (document.querySelector('.nav-drawer.open')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); }
    if (e.key === 'Home')       { e.preventDefault(); goTo(0); }
    if (e.key === 'End')        { e.preventDefault(); goTo(GALLERY_ITEMS.length - 1); }
    if (e.key === 'Escape' && document.body.classList.contains('gallery-focus')) setFocus(false);
  });

  /* ── Focus mode — the piece alone, as large as the screen allows ── */
  function setFocus(on) {
    document.body.classList.toggle('gallery-focus', on);
    // Slide sizes change with the mode; re-centre once layout settles.
    requestAnimationFrame(() => goTo(current, true));
    // Ask for the native-width tier once the piece fills the screen
    if (on) slides[current].querySelector('source').sizes = '100vw';
  }

  /* ── Views ─────────────────────────────────────────────── */
  function setView(view) {
    root.dataset.view = view;
    root.querySelectorAll('.gallery-view-btn').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    if (view === 'index') {
      setFocus(false);
      history.replaceState(null, '', '#index');
    } else {
      requestAnimationFrame(() => {
        goTo(Math.max(0, current), true);
        history.replaceState(null, '', `#${GALLERY_ITEMS[Math.max(0, current)].name}`);
      });
    }
  }
  root.querySelectorAll('.gallery-view-btn').forEach(b =>
    b.addEventListener('click', () => setView(b.dataset.view)));

  window.addEventListener('resize', () => goTo(current, true));

  /* ── Start: honour a deep link (#saturn / #index) ───────── */
  const hash = location.hash.slice(1);
  const start = Math.max(0, GALLERY_ITEMS.findIndex(it => it.name === hash));
  // Wait a frame so the track has its final width before measuring.
  requestAnimationFrame(() => {
    goTo(start, true);
    onTrackScroll();
    if (hash === 'index') setView('index');
  });
}
