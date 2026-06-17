# rtt-minisite

A standalone, mobile-optimized **product minisite** for Rock The Treatment, built to
serve at **`m.rockthetreatment.com`** via **Cloudflare Pages**.

It renders the five best-selling care packages as lightweight, self-contained static
pages (~40 KB each, inline CSS + vanilla JS — no Elementor, no frameworks) so that
paid / mobile traffic gets a fast experience. **Cart and checkout intentionally hand
off to the live WooCommerce store** on `www.rockthetreatment.com` — this minisite is a
marketing front-end, not a second store.

| Product | Slug | WC ID | Price |
|---|---|:---:|---|
| Large Women's Chemo | `womens-large-chemo-basket` | 248 | $159.99 |
| Medium Women's Chemo | `womens-medium-chemo-basket` | 235 | $119.99 |
| Small Women's Chemo | `womens-small-chemo-basket` | 10338 | $69.99 |
| Radiation Care Package | `radiation-basket` | 250 | $134.99 |
| Medium Men's Chemo | `mens-medium-chemo-basket` | 232 | $119.99 |

## How it works

`generate.js` (Node, **zero dependencies**) reads `product-data.json` and writes the
five product pages plus an `index.html` hub into `public/`, which is what Cloudflare
Pages serves.

```
npm run build      # == node generate.js  -> writes public/*.html
```

`public/` is committed, so the site works even if the Pages build step is skipped.
Re-run the build whenever `product-data.json` or `generate.js` changes, and commit the
regenerated `public/`.

### Repo layout

```
generate.js          # static-site generator (template lives here)
product-data.json    # product content (titles, prices, items, reviews, image paths)
public/              # ← Cloudflare Pages output directory (built + committed)
  index.html         #   mobile hub linking to the 5 product pages
  *-basket.html      #   the 5 product pages
  _headers           #   caching + security headers
  assets/uploads/    #   self-hosted product images (downloaded by tools/fetch-images.js)
design/              # reference design mockups (v4 full, v5 production) — not deployed
tools/               # fetch-images.js (downloads images) + reference scrapers
wordpress/           # reference WordPress child-theme implementation of the same design
```

### Notable behavior baked into the generator

- **Images are self-hosted** under `public/assets/uploads/...`. Run
  `node tools/fetch-images.js` to (re)download them from the store. This avoids the main
  site's hotlink/referer protection, which returns **403** for cross-origin image requests
  from `*.pages.dev` and any non-`rockthetreatment.com` referer.
- **SEO:** each page sets `<link rel="canonical">` to its `www` product page and, by
  default, `<meta name="robots" content="noindex, follow">` so the mobile mirror doesn't
  compete with the main store in organic search. Flip `ALLOW_INDEXING = true` at the top
  of `generate.js` to make the pages indexable.
- **Mobile performance:** hero image is preloaded with `fetchpriority="high"`;
  below-the-fold images use `loading="lazy"` + `decoding="async"`; fonts are preconnected.
- **Add-to-cart** links to `https://www.rockthetreatment.com/?add-to-cart=<id>&quantity=<n>`.

## Deploy to Cloudflare Pages

### Option A — Git integration (recommended)

1. Cloudflare dashboard → account **Rock The Treatment** → **Workers & Pages** →
   **Create** → **Pages** → **Connect to Git**.
2. Select the `Marketing-Bull/rtt-minisite` repo and the production branch.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** `node generate.js` (or leave blank — `public/` is committed)
   - **Build output directory:** `public`
   - **Root directory:** `/`
4. **Save and Deploy** → you get a `*.pages.dev` preview URL.
5. **Custom domain:** project → **Custom domains** → **Set up a custom domain** →
   `m.rockthetreatment.com`. Because the `rockthetreatment.com` zone is in the same
   Cloudflare account, the `m` CNAME and TLS cert are created automatically.

### Option B — Wrangler (needs an API token)

```
npm i -g wrangler
node generate.js
CLOUDFLARE_API_TOKEN=*** wrangler pages deploy public \
  --project-name=rtt-minisite --branch=main
```
Token scope: *Account → Cloudflare Pages: Edit* and *Zone → DNS: Edit* on the
rockthetreatment.com zone (for the custom domain).

## Verify locally

```
node generate.js
npx serve public         # or: python3 -m http.server 8000 --directory public
```

Open a product page in a mobile viewport and check:

- All 5 pages + the hub render; layout is mobile-first (≤480px).
- Images load (Network tab: canonical `www` URLs return 200; logo + bell load).
- Gallery thumb-click / swipe / arrow keys change the main image; FAQ accordion toggles;
  quantity stepper updates and appends `&quantity=` to the Add-to-Cart link.
- View source: `rel=canonical` → `www/<slug>/`, `robots noindex,follow`, theme-color,
  hero `rel=preload`, below-the-fold `loading="lazy"`.

## Roadmap

- ✅ **Self-hosted images** — 53 images (~12 MB) under `public/assets/uploads/`, fetched via
  `node tools/fetch-images.js`. Removes the hotlink dependency on the main store.
- **Optimize images** — convert to WebP/AVIF and shrink the ~7 MB animated Warmies upsell GIF
  (`assets/uploads/2025/04/Rock-the-Treatment-Warmies-...gif`) to cut the mobile payload.
- 5 source images are missing upstream (redirect to the homepage); 4 are unused and one is the
  "Large Men's" related card, which now self-hides via an `onerror` fallback.
