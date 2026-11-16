# Schuy.xyz

Portfolio site for **Schuy** — Digital Artist & Designer. Static HTML/CSS/JS, zero dependencies, hosts free on GitHub Pages.

---

## Quick start

Open `index.html` in a browser — no build step, no server required.

---

## File structure

```
/
├── index.html
├── gallery/index.html ← the gallery page (schuy.xyz/gallery/)
├── css/styles.css
├── js/main.js         ← shared: nav, forms, analytics, home effects
├── js/gallery.js      ← gallery page + the GALLERY_ITEMS list
├── images/
│   ├── work/          ← your artwork goes here
│   ├── hero.mp4       ← hero video loop (add this file)
│   ├── hero-poster.jpg← first frame still for the video (add this)
│   ├── og-image.png   ← Open Graph / Twitter card image (add this)
│   ├── favicon.svg    ← favicon (+ favicon-32.png, apple-touch-icon.png)
├── .nojekyll          ← required for GitHub Pages
└── README.md
```

---

## How to add your artwork

1. Put the full-size JPEG in `/images/work/`.
2. Run `tools/make-avif.sh` to generate the 480 / 800 / native AVIFs in `/images/work/avif/`.
3. Open `js/gallery.js` and add an entry to the `GALLERY_ITEMS` array:

```js
const GALLERY_ITEMS = [
  { name: 'your-file', title: 'Piece Title', year: '2026', w: 1080, h: 1350 },
  // ...
];
```

`name` is the file stem and also the piece's share link (`/gallery/#your-file`).
Titles and years are never shown — they're used for alt text only. Add the piece
to the structured data in `index.html` too. The gallery page renders it automatically.

---

## How to add the hero video

1. Encode your loop as H.264 MP4, 1920×1080, no audio, under ~8 MB.
2. Drop it at `/images/hero.mp4`.
3. Optionally export the first frame as `/images/hero-poster.jpg` (shown before the video loads).

The `<video>` tag is already in `index.html`. The video fades in over the canvas animation automatically once it can play.

---

## How to update the shop link

Search `index.html` for `https://schuyxyz.etsy.com` — there are **2 occurrences** (hero CTA, shop band). Replace both with your store URL.

Or find every instance at once:

```
grep -n "etsy.com" index.html
```

---

## How to update the Gumroad link

Both the design assets card and the VJ loops card link to `https://schuy.gumroad.com/`. Search `index.html` for that URL to update both.

---

## Google Analytics 4

1. Go to [analytics.google.com](https://analytics.google.com) → Admin → Data Streams → your web stream.
2. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`).
3. In `index.html`, find the two lines marked `<!-- TODO: replace G-XXXXXXXXXX -->` near the top of `<head>` and replace both instances of `G-XXXXXXXXXX` with your ID.

**Custom events already wired up:**

| Element | Event name | Fires on |
|---|---|---|
| Shop CTAs | `shop_click` | Any click on `data-track="shop"` links |
| Gumroad links | `gumroad_click` | Any click on `data-track="gumroad"` links |
| Social links | `social_click` | Any click on `data-track="social"` links |

Events only fire if `gtag` is defined — the site won't error if the ID hasn't been set.

---

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages → Source → Deploy from a branch**.
3. Select `main` (or `master`) / `/ (root)` → Save.
4. Your site will be live at `https://<username>.github.io/<repo>/` (or your custom domain).

The `.nojekyll` file in the root tells GitHub Pages not to process the folder with Jekyll, which is needed if you ever use underscore-prefixed folder names.

---

## Custom domain (schuy.xyz)

1. In GitHub Pages settings, enter `schuy.xyz` under **Custom domain**.
2. At your DNS registrar, add:
   - `A` records pointing to GitHub's IPs (185.199.108–111.153)
   - Or a `CNAME` for `www` → `<username>.github.io`
3. Check **Enforce HTTPS** once DNS propagates.

---

## Placeholder SVGs

The `/images/work/work-01.svg` through `work-08.svg` files are generated placeholders. Delete them once you've added your own artwork to the `GALLERY_ITEMS` array.
