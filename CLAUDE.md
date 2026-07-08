# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Portfolio site for Schuy (Schuyler Hample), digital artist & designer — a static HTML/CSS/JS site with **zero dependencies and no build step**, deployed to GitHub Pages at https://schuy.xyz (via `CNAME`; `.nojekyll` must stay in the root). Deploys happen automatically when `main` is pushed — there is no CI, no linter, and no test suite.

## Running locally

```
python3 -m http.server 4444
```

Then open http://localhost:4444. A server is required (not `file://`) because `js/hero3d.js` is an ES module and fetches `images/work/hero.glb`. This matches the launch config in `.claude/launch.json`.

## Cache busting (important)

`index.html` and `privacy.html` reference `css/styles.css` and the JS files with a `?v=YYYYMMDD-N` query string (e.g. `?v=20260625-1`). **When you edit `styles.css`, `main.js`, or `hero3d.js`, bump the version string on every reference to the edited file in both HTML pages** — otherwise GitHub Pages visitors keep the cached old asset. `cookie-consent.js` is currently referenced without a version.

## Architecture

Two pages (`index.html` — single-page portfolio; `privacy.html` — privacy policy sharing the same nav/footer/styles), one stylesheet, three scripts:

- **`js/main.js`** (classic script) — nav/drawer, hero canvas fallback animation, gallery, lightbox, scroll reveal, cursor glow, GA event wiring. The gallery is data-driven: the `GALLERY_ITEMS` array (`{ src, title, year }`) at the top of the gallery section renders `.gallery-grid` and powers the lightbox. To add artwork, drop the image in `images/work/` and add an entry — no HTML changes needed.
- **`js/hero3d.js`** (ES module) — three.js hero figure. three.js v0.160.0 is loaded from unpkg via the import map at the bottom of `index.html` (no npm). It loads `images/work/hero.glb` (Draco-capable) and falls back to a neon icosahedron placeholder if the GLB is missing. Behavior is tuned by the constants at the top of the file (framing: `FILL`/`FOCUS`/`OFFSET_X`; head-follow and blink parameters). Head-follow and blinking depend on bone names baked into the GLB (`head`, `neckUpper`/`neckLower`, `lEyelidUpper*`/`rEyelidUpper*`, etc.). Desktop mice get drag-orbit + cursor head-follow; touch devices get auto-rotate with all pointer events disabled so swipes scroll the page.
- **`js/cookie-consent.js`** — consent-gated GA4. Analytics loads **only** after the visitor clicks Accept (choice persisted in `localStorage` under `schuy_cookie_consent`). The GA measurement ID lives in this file (`GA_ID`), not in the HTML. Don't add a plain gtag snippet to `<head>` — that would bypass consent.

## Conventions

- **Analytics events** fire via `data-track` attributes (`shop`, `gumroad`, `social` — social links also carry `data-platform`), wired up in `main.js` → `initAnalyticsEvents()`. New outbound CTAs should use these attributes rather than inline handlers. `trackEvent()` no-ops when `gtag` is undefined, so the site never errors without consent.
- **Reduced motion**: every animation (parallax, cursor glow, head-follow, blinking, CSS animations) checks `prefers-reduced-motion: reduce` and disables itself. Keep this pattern for anything new.
- **Brand palette** is defined as CSS custom properties in `:root` at the top of `css/styles.css` (near-black bg, royal blue, violet, neon magenta, chrome silver). The three.js light colors in `hero3d.js` mirror these hex values — keep them in sync if the palette changes.
- **Breakpoints**: the primary mobile breakpoint is `max-width: 860px` (used in both CSS and `hero3d.js`); additional tweaks at 1024/768/480px.
- Both pages share nav/footer markup by copy-paste — a change to the nav, footer, or cookie banner in `index.html` usually needs mirroring in `privacy.html`.
- Shop/store URLs appear in multiple places: the Etsy link (`schuyxyz.etsy.com`) twice in `index.html` (hero CTA + shop band), the Gumroad link (`schuy.gumroad.com`) on both goods cards. Update all occurrences together.
