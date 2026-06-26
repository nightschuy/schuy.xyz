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

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      const open = drawer.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
    });

    // Close on link click
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        drawer.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
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
// Put image files in /images/work/ and add an entry here.
const GALLERY_ITEMS = [
  { src: 'images/work/saturn.jpg',     title: 'Saturn',       year: '2025' },
  { src: 'images/work/shattered.jpg',  title: 'Shattered',    year: '2025' },
  { src: 'images/work/boogie.jpg',     title: 'Boogie',       year: '2025' },
  { src: 'images/work/partner.jpg',    title: 'Partner',      year: '2025' },
  { src: 'images/work/viber.jpg',      title: 'Viber',       year: '2024' },
  { src: 'images/work/skullmance.jpg', title: 'Skullmance',   year: '2024' },
  { src: 'images/work/return.jpg',     title: 'Return',       year: '2025' },
  { src: 'images/work/focus.jpg',      title: 'Focus',        year: '2023' },
  { src: 'images/work/fixed.jpg',      title: 'Fixed',        year: '2024' },
];

function initGallery() {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  GALLERY_ITEMS.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'gallery-item reveal reveal-delay-' + ((i % 4) + 1);
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `View ${item.title}, ${item.year}`);
    el.dataset.index = i;

    el.innerHTML = `
      <img src="${item.src}" alt="${item.title} (${item.year}) — digital artwork by Schuyler Hample (Schuy)" loading="lazy" width="800" height="1000">
      <div class="gallery-overlay">
        <div class="gallery-expand" aria-hidden="true">
          <svg viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
        </div>
        <p class="gallery-title">${item.title}</p>
        <p class="gallery-year">${item.year}</p>
      </div>
    `;

    el.addEventListener('click', () => openLightbox(i));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
    });

    grid.appendChild(el);
  });
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
let currentLightboxIndex = 0;

function openLightbox(index) {
  currentLightboxIndex = index;
  const lb  = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');
  const item = GALLERY_ITEMS[index];

  img.src = item.src;
  img.alt = `${item.title} (${item.year}) — digital artwork by Schuyler Hample (Schuy)`;
  cap.innerHTML = `<strong>${item.title}</strong><span>${item.year}</span>`;

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
  // Shop CTAs → 'shop_click'
  document.querySelectorAll('[data-track="shop"]').forEach(el => {
    el.addEventListener('click', () => trackEvent('shop_click', { link_url: el.href }));
  });

  // Gumroad links → 'gumroad_click'
  document.querySelectorAll('[data-track="gumroad"]').forEach(el => {
    el.addEventListener('click', () => trackEvent('gumroad_click', { link_url: el.href }));
  });

  // Social links → 'social_click'
  document.querySelectorAll('[data-track="social"]').forEach(el => {
    el.addEventListener('click', () => trackEvent('social_click', {
      platform: el.dataset.platform || 'unknown',
      link_url: el.href,
    }));
  });
}

/* ============================================================
   FOOTER YEAR
   ============================================================ */
function updateFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}
