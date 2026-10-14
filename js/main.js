/* ============================================================
   SCHUY.XYZ — Main JS
   ============================================================ */

'use strict';

/* ── Analytics helper ────────────────────────────────────── */
function trackEvent(name, params) {
  if (typeof gtag === 'function') {
    gtag('event', name, params || {});
  }
}

/* ── DOM ready ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initHeroCanvas();
  initHeroParallax();
  initHeroReveal();
  initGallery();
  initLightbox();
  initScrollReveal();
  initCursorGlow();
  initForms();
  initSonarGrid();
  initAnalyticsEvents();
  updateFooterYear();
});

/* ============================================================
   NAV — sticky frosted glass + mobile drawer
   ============================================================ */
function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.querySelector('.nav-toggle');
  const drawer = document.querySelector('.nav-drawer');

  const progress = document.querySelector('.scroll-progress');
  let ticking = false;

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 40);

    if (progress) {
      // Guard the divide: on a page shorter than the viewport there is
      // nothing to scroll and the denominator is 0.
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      progress.style.setProperty('--scroll-progress', Math.min(1, Math.max(0, ratio)).toFixed(4));
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  onScroll();

  if (toggle && drawer) {
    const setDrawer = (open, returnFocus) => {
      drawer.classList.toggle('open', open);
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      // The drawer covers the page when open; its links must not be
      // reachable by keyboard while it is closed.
      drawer.setAttribute('aria-hidden', String(!open));
      if (!open && returnFocus) toggle.focus();
    };

    setDrawer(false, false);

    toggle.addEventListener('click', () => {
      const open = !drawer.classList.contains('open');
      setDrawer(open, false);
      // The drawer is visibility:hidden until the class lands, and calling
      // focus() on a still-hidden element silently does nothing — so let the
      // style apply first. A timer rather than rAF: rAF is suspended while
      // the page is hidden, which would strand focus on <body>.
      if (open) setTimeout(() => drawer.querySelector('a')?.focus(), 0);
    });

    // Close on link click
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => setDrawer(false, false));
    });

    // Escape closes it and puts focus back on the toggle, so a keyboard user
    // isn't stranded in a panel they can't see.
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        setDrawer(false, true);
      }
    });

    // A tap outside the drawer closes it too.
    document.addEventListener('click', e => {
      if (!drawer.classList.contains('open')) return;
      if (drawer.contains(e.target) || toggle.contains(e.target)) return;
      setDrawer(false, false);
    });
  }
}

/* ============================================================
   HERO CANVAS — animated fallback (particles + nebula + grid)
   ============================================================ */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles, animId;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  /* Particle pool */
  function createParticles() {
    particles = [];
    const count = Math.min(Math.floor(W * 0.06), 100);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.3,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.6 + 0.1,
        hue: 200 + Math.random() * 80, // blue-violet range
      });
    }
  }

  /* Nebula blobs (static positions, animate alpha) */
  const blobs = [
    { x: 0.25, y: 0.35, r: 0.4,  c: '43, 75, 255',  a: 0.08 },
    { x: 0.75, y: 0.45, r: 0.35, c: '107, 58, 255', a: 0.06 },
    { x: 0.5,  y: 0.6,  r: 0.45, c: '26, 58, 204',  a: 0.05 },
    { x: 0.8,  y: 0.2,  r: 0.25, c: '217, 70, 239', a: 0.04 },
  ];

  let t = 0;

  function drawNebula() {
    blobs.forEach((b, i) => {
      const pulse = Math.sin(t * 0.4 + i * 1.2) * 0.015 + b.a;
      const grd = ctx.createRadialGradient(b.x * W, b.y * H, 0, b.x * W, b.y * H, b.r * Math.min(W, H));
      grd.addColorStop(0, `rgba(${b.c},${pulse})`);
      grd.addColorStop(1, `rgba(${b.c},0)`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    });
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${p.hue},80%,75%)`;
      ctx.fill();
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    });
  }

  function tick() {
    t += 0.016;
    ctx.clearRect(0, 0, W, H);

    // Sky gradient base
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#05050d');
    sky.addColorStop(0.6, '#0a0a1a');
    sky.addColorStop(1, '#08080f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    drawNebula();
    drawParticles();

    animId = requestAnimationFrame(tick);
  }

  const ro = new ResizeObserver(() => {
    resize();
    createParticles();
  });
  ro.observe(canvas);

  resize();
  createParticles();
  tick();

  // Pause when hidden (perf)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animId);
    else tick();
  });
}

/* ============================================================
   HERO VIDEO — graceful load
   ============================================================ */
(function initHeroVideo() {
  const video = document.querySelector('.hero-video');
  if (!video) return;
  video.addEventListener('canplaythrough', () => {
    video.classList.add('loaded');
  }, { once: true });
})();

/* ============================================================
   HERO PARALLAX
   ============================================================ */
function initHeroParallax() {
  const content = document.querySelector('.hero-content');
  const grid    = document.querySelector('.hero-grid');
  if (!content) return;

  // Skip on low-motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > window.innerHeight) return;
    content.style.transform = `translateY(${y * 0.18}px)`;
    if (grid) grid.style.transform = `translateY(${y * 0.08}px)`;
  }, { passive: true });
}

/* ============================================================
   HERO REVEAL — stagger on load
   ============================================================ */
function initHeroReveal() {
  const content = document.querySelector('.hero-content');
  if (!content) return;
  // Small delay to let fonts load
  setTimeout(() => content.classList.add('revealed'), 180);
}

/* ============================================================
   GALLERY — driven by data array
   ============================================================ */

// ── Add or remove entries to update the gallery ───────────
// Put the full-size JPEG in /images/work/, then run tools/make-avif.sh to
// generate the responsive AVIF derivatives in /images/work/avif/, then add
// an entry here.
//
//   name    file stem, shared by the JPEG and every AVIF derivative
//   w, h    native pixel dimensions of the JPEG (sets the aspect ratio box)
//   medium  what it is, in the artist's words — shown in the lightbox
//   edition e.g. 'Edition of 25' or 'Open edition'
//   price   display string, e.g. 'From $65'
//   shop    DEEP link to this piece's own listing, not the shop root.
//           Without it the lightbox shows no purchase link at all.
const GALLERY_ITEMS = [
  // TODO(schuy): replace each `shop` with that piece's own Etsy listing URL,
  // and fill in medium / edition / price. The shop-root URLs below are the
  // old placeholders — they still work, they just land people on the
  // storefront instead of the piece they clicked.
  { name: 'saturn',     title: 'Saturn',     year: '2025', w: 1080, h: 1350, shop: 'https://schuyxyz.etsy.com' },
  { name: 'shattered',  title: 'Shattered',  year: '2025', w: 1080, h: 1350, shop: 'https://schuyxyz.etsy.com' },
  { name: 'boogie',     title: 'Boogie',     year: '2025', w: 1080, h: 1350 },
  { name: 'partner',    title: 'Partner',    year: '2025', w: 1080, h: 1350 },
  { name: 'viber',      title: 'Viber',      year: '2024', w: 1120, h: 1400 },
  { name: 'skullmance', title: 'Skullmance', year: '2024', w: 1120, h: 1400, shop: 'https://schuyxyz.etsy.com' },
  { name: 'return',     title: 'Return',     year: '2025', w: 1120, h: 1400 },
  { name: 'focus',      title: 'Focus',      year: '2023', w: 1120, h: 1400 },
  { name: 'fixed',      title: 'Fixed',      year: '2024', w: 1120, h: 1400 },
];

/* ── Responsive image helpers ─────────────────────────────
   Each piece ships as three AVIFs (480 / 800 / native width) plus the
   original JPEG as the <picture> fallback. AVIF has been baseline across
   Safari, Chrome and Firefox since 2022, so the JPEG is a true last resort
   rather than a tier anyone routinely downloads. */
const jpegSrc  = item => `images/work/${item.name}.jpg`;
const avifSrc  = (item, w) => `images/work/avif/${item.name}-${w}.avif`;
const avifSet  = item => [480, 800, item.w]
  .map(w => `${avifSrc(item, w)} ${w}w`)
  .join(', ');

// Even grid of 4:5 tiles. These track the columns in styles.css
// (3 cols → 2 cols at 1024; content box tops out at 1200px).
const SIZES_TILE = '(max-width: 1024px) 46vw, (min-width: 1280px) 384px, 31vw';

const altText = item =>
  `${item.title} (${item.year}) — digital artwork by Schuyler Hample (Schuy)`;

function initGallery() {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  GALLERY_ITEMS.forEach((item, i) => {
    const el = document.createElement('figure');
    el.className = 'gallery-item reveal reveal-delay-' + ((i % 3) + 1);
    el.setAttribute('role', 'listitem');

    el.innerHTML = `
      <button type="button" class="gallery-frame" aria-label="View ${item.title}, ${item.year}">
        <picture>
          <source type="image/avif" srcset="${avifSet(item)}" sizes="${SIZES_TILE}">
          <img src="${jpegSrc(item)}" alt="${altText(item)}" loading="lazy" decoding="async" width="${item.w}" height="${item.h}">
        </picture>
      </button>
    `;

    // The first row is above the fold on most screens — don't lazy-queue it.
    if (i < 3) el.querySelector('img').loading = 'eager';
    if (i === 0) el.querySelector('img').setAttribute('fetchpriority', 'high');

    el.querySelector('.gallery-frame').addEventListener('click', () => openLightbox(i));

    grid.appendChild(el);
  });
}

/* ============================================================
   FORMS — drops signup + commission inquiry

   Both post to Web3forms (https://api.web3forms.com/submit), which needs an
   access_key hidden input. Web3forms allows cross-origin fetch, so the happy
   path never leaves the page; the plain form action is still set as a
   fallback for the case where fetch fails outright.

   Neither form works until its access_key is filled in. Rather than accept
   submissions into the void, a keyless form disables itself and — for the
   contact form — leaves the mailto link as the live path.

   NOTE ON THE DROPS FORM: Web3forms emails each signup rather than building
   a list, so there is no broadcast to send when a drop lands. To actually
   mail the list later, either export the addresses out of your inbox or
   point data-endpoint at a real ESP (Buttondown / Kit / Beehiiv) — the
   submit path below works unchanged against any of them.
   ============================================================ */
function initForms() {
  initDropsForm();
  initContactForm();
}

/* Is this form actually wired up? */
function formAccessKey(form) {
  return form.querySelector('input[name="access_key"]')?.value.trim() || '';
}

/* Shared submit path. Returns a promise that resolves true on success. */
function submitForm(form, endpoint, statusEl, messages) {
  const data = new FormData(form);

  // Honeypot: a ticked hidden checkbox means a bot. Report success and drop
  // it, so the bot has nothing to learn from the response.
  if (data.get('botcheck')) {
    setStatus(statusEl, messages.success, 'ok');
    form.reset();
    return Promise.resolve(true);
  }
  data.delete('botcheck');

  setStatus(statusEl, messages.pending, 'pending');
  form.classList.add('is-submitting');

  return fetch(endpoint, {
    method: 'POST',
    body: data,
    headers: { 'Accept': 'application/json' },
  })
    .then(res => res.json().catch(() => ({ success: res.ok })))
    .then(body => {
      // Web3forms answers 200 with {success:false, message} on a bad key, so
      // the status code alone isn't enough to call it a win.
      if (!body.success) throw new Error(body.message || 'Submission rejected');
      setStatus(statusEl, messages.success, 'ok');
      form.reset();
      return true;
    })
    .catch(err => {
      setStatus(statusEl, messages.error, 'error');
      console.warn('[forms] submission failed:', err.message);
      return false;
    })
    .finally(() => form.classList.remove('is-submitting'));
}

function setStatus(el, text, state) {
  if (!el) return;
  el.textContent = text;
  el.dataset.state = state || '';
}

function initDropsForm() {
  const form = document.getElementById('drops-form');
  if (!form) return;

  const status   = document.getElementById('drops-status');
  const input    = document.getElementById('drops-email');
  const endpoint = form.dataset.endpoint;

  if (!endpoint || !formAccessKey(form)) {
    form.classList.add('is-unconfigured');
    input.disabled = true;
    form.querySelector('button[type="submit"]').disabled = true;
    setStatus(status, 'Signup opens soon.', 'note');
    return;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!input.value.trim() || !input.checkValidity()) {
      setStatus(status, 'That email doesn’t look right.', 'error');
      input.focus();
      return;
    }
    submitForm(form, endpoint, status, {
      pending: 'Adding you…',
      success: 'You’re on the list.',
      error:   'That didn’t go through — try again in a moment.',
    }).then(ok => { if (ok) trackEvent('newsletter_signup', { location: 'drops_band' }); });
  });
}

function initContactForm() {
  const form   = document.getElementById('contact-form');
  const mailto = document.getElementById('about-mailto');
  if (!form) return;

  const endpoint = form.dataset.endpoint;

  // Not wired up → leave the form hidden, keep the mailto as the live path.
  if (!endpoint || !formAccessKey(form)) return;

  // Configured — show the form and demote the mailto to a quieter secondary
  // link rather than removing it outright.
  form.hidden = false;
  if (mailto) mailto.classList.add('is-secondary');

  const status = document.getElementById('contact-status');

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) {
      setStatus(status, 'Please fill in your name, email, and a few details.', 'error');
      form.querySelector(':invalid')?.focus();
      return;
    }
    submitForm(form, endpoint, status, {
      pending: 'Sending…',
      success: 'Got it — I’ll be in touch shortly.',
      error:   'That didn’t send. Email schuyler.hample@gmail.com directly?',
    }).then(ok => {
      if (ok) trackEvent('contact_submit', {
        project_type: form.querySelector('#contact-type')?.value,
      });
    });
  });
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
let currentLightboxIndex = 0;

function openLightbox(index) {
  currentLightboxIndex = index;
  const lb   = document.getElementById('lightbox');
  const img  = document.getElementById('lightbox-img');
  const avif = document.getElementById('lightbox-avif');
  const cap  = document.getElementById('lightbox-caption');
  const item = GALLERY_ITEMS[index];

  // The viewer shows one piece at a time at up to native width, so it gets
  // the two larger tiers only — no point offering a 480px candidate here.
  avif.srcset = `${avifSrc(item, 800)} 800w, ${avifSrc(item, item.w)} ${item.w}w`;
  avif.sizes  = '(max-width: 900px) 92vw, 900px';
  img.src = jpegSrc(item);
  img.alt = altText(item);
  img.width  = item.w;
  img.height = item.h;

  // Details line: only render the parts this piece actually has, so a piece
  // with no metadata reads as a clean title/year rather than empty labels.
  const details = [item.medium, item.edition, item.price].filter(Boolean);
  const detailLine = details.length
    ? `<span class="lightbox-details">${details.join(' &middot; ')}</span>`
    : '';
  const shopLink = item.shop
    ? `<a href="${item.shop}" class="lightbox-shop-link" target="_blank" rel="noopener noreferrer" data-track="shop" data-piece="${item.name}">Available as print &rarr;</a>`
    : '';
  cap.innerHTML = `<strong>${item.title}</strong><span>${item.year}</span>${detailLine}${shopLink}`;

  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Focus the close button
  setTimeout(() => document.getElementById('lightbox-close')?.focus(), 50);
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  // Hand focus back to the piece the viewer ended on, not the page top.
  document.querySelectorAll('.gallery-frame')[currentLightboxIndex]?.focus({ preventScroll: true });
}

function lightboxNav(dir) {
  currentLightboxIndex = (currentLightboxIndex + dir + GALLERY_ITEMS.length) % GALLERY_ITEMS.length;
  openLightbox(currentLightboxIndex);
}

function initLightbox() {
  const lb    = document.getElementById('lightbox');
  const close = document.getElementById('lightbox-close');
  const prev  = document.getElementById('lightbox-prev');
  const next  = document.getElementById('lightbox-next');

  if (!lb) return;

  close?.addEventListener('click', closeLightbox);
  prev?.addEventListener('click', () => lightboxNav(-1));
  next?.addEventListener('click', () => lightboxNav(1));

  // Close on backdrop click
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   lightboxNav(-1);
    if (e.key === 'ArrowRight')  lightboxNav(1);
  });
}

/* ============================================================
   SCROLL REVEAL — IntersectionObserver
   ============================================================ */
function initScrollReveal() {
  if ('IntersectionObserver' in window === false) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ============================================================
   CURSOR GLOW — desktop only
   ============================================================ */
function initCursorGlow() {
  // Skip on touch devices
  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const glow = document.getElementById('cursor-glow');
  if (!glow) return;

  let mx = 0, my = 0, cx = 0, cy = 0, raf;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  }, { passive: true });

  function loop() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    glow.style.left = cx + 'px';
    glow.style.top  = cy + 'px';
    raf = requestAnimationFrame(loop);
  }
  loop();
}

/* ============================================================
   ANALYTICS — event wiring
   ============================================================ */
function initAnalyticsEvents() {
  // Delegated from the document rather than bound per element: the lightbox's
  // "Available as print" link is built when a piece is opened, so a bind-at-
  // startup pass missed the single most purchase-intent click on the site.
  const EVENTS = {
    shop:    el => ['shop_click',    { link_url: el.href, piece: el.dataset.piece || null }],
    gumroad: el => ['gumroad_click', { link_url: el.href }],
    social:  el => ['social_click',  { platform: el.dataset.platform || 'unknown', link_url: el.href }],
    contact: el => ['contact_click', { method: 'mailto', link_url: el.href }],
    studio:  el => ['studio_click',  { link_url: el.href }],
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-track]');
    if (!el) return;
    const build = EVENTS[el.dataset.track];
    if (!build) return;
    const [name, params] = build(el);
    trackEvent(name, params);
  });
}

/* ============================================================
   FOOTER YEAR
   ============================================================ */
function updateFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ============================================================
   SONAR GRID — dot field behind the drops signup
   Rings expand from wherever the visitor clicks inside the card; an ambient
   ping keeps it alive, and one ring is already mid-flight at first paint so
   the effect reads before anyone interacts. Paused while off-screen;
   reduced-motion visitors get the still dot field only.
   ============================================================ */
function initSonarGrid() {
  const canvas = document.querySelector('.sonar-grid');
  if (!canvas) return;
  const card = canvas.parentElement;
  const ctx  = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SPACING   = 22;    // px between dots
  const SPEED     = 240;   // ring radius growth, px/s
  const RING_W    = 70;    // how thick the bright band of a ring is
  const PING_EVERY = 2.6;  // seconds between ambient pings
  // Cerulean → violet → magenta across the field, matching the brand rule
  const STOPS = [[61,141,223], [107,58,255], [217,70,239]];

  let w = 0, h = 0, dpr = 1, dots = [];
  let rings = [], running = false, last = 0, sinceAmbient = 0;

  const mix = t => {
    const seg = Math.min(STOPS.length - 2, Math.floor(t * (STOPS.length - 1)));
    const f = t * (STOPS.length - 1) - seg;
    return STOPS[seg].map((c, k) => Math.round(c + (STOPS[seg + 1][k] - c) * f));
  };

  function layout() {
    const r = card.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    for (let y = SPACING / 2; y < h; y += SPACING)
      for (let x = SPACING / 2; x < w; x += SPACING)
        dots.push({ x, y, rgb: mix(x / w) });
  }

  function ping(x, y, r = 0) { rings.push({ x, y, r, max: Math.hypot(w, h) }); }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      let glow = 0;
      for (const ring of rings) {
        const dist = Math.abs(Math.hypot(d.x - ring.x, d.y - ring.y) - ring.r);
        if (dist < RING_W) {
          const fade = 1 - ring.r / ring.max;
          glow = Math.max(glow, (1 - dist / RING_W) * fade);
        }
      }
      const [r, g, b] = d.rgb;
      ctx.fillStyle = `rgba(${r},${g},${b},${0.1 + glow * 0.6})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1 + glow * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    sinceAmbient += dt;
    if (sinceAmbient > PING_EVERY) {
      sinceAmbient = 0;
      ping(w * (0.1 + Math.random() * 0.4), h * (0.2 + Math.random() * 0.6));
    }
    rings.forEach(r => { r.r += SPEED * dt; });
    rings = rings.filter(r => r.r < r.max);
    draw();
    requestAnimationFrame(frame);
  }

  layout();
  if (still) { draw(); return; }

  ping(w * 0.22, h * 0.45, 140);   // already mid-flight at first paint
  draw();

  card.addEventListener('pointerdown', e => {
    const r = card.getBoundingClientRect();
    ping(e.clientX - r.left, e.clientY - r.top);
  });

  new IntersectionObserver(([entry]) => {
    running = entry.isIntersecting;
    if (running) { last = 0; requestAnimationFrame(frame); }
  }).observe(card);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { layout(); draw(); }, 150);
  });
}

