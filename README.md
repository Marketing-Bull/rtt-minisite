# RTT Minisite

Mobile-first product landing pages for
[Rock The Treatment](https://www.rockthetreatment.com/). The minisite is a fast
marketing front end: product discovery happens here, while cart and checkout hand
off to the live WooCommerce store.

The **Medium Women's Chemo Care Package** is the current CRO pilot. Its page uses
the unified conversion template, verified exact-product review data, optimized
local images, and quantity-aware WooCommerce cart links.

## Current products

Product facts live in `product-data.json`. Do not hard-code prices, product IDs,
ratings, or review counts in the generator.

| Product | Page | WooCommerce ID | Price |
| --- | --- | ---: | ---: |
| Large Women's Chemo Care Package | `womens-large-chemo-basket.html` | 248 | $169.99 |
| Medium Women's Chemo Care Package | `womens-medium-chemo-basket.html` | 235 | $129.99 |
| Small Women's Chemo Care Package | `womens-small-chemo-basket.html` | 10338 | $74.99 |
| Radiation Care Package | `radiation-basket.html` | 250 | $134.99 |
| Medium Men's Chemo Care Package | `mens-medium-chemo-basket.html` | 232 | $119.99 |

## Quick start

Requires Node.js 22 or newer.

```bash
npm ci
npm run build
npm run preview
```

Wrangler serves the site at `http://localhost:8787` by default.

| Command | Purpose |
| --- | --- |
| `npm run build` | Generate the hub and five product pages in `public/` |
| `npm run preview` | Run the Cloudflare Worker locally |
| `npm run optimize` | Generate AVIF/WebP image variants with Sharp |
| `npm run deploy` | Deploy the static-assets Worker with Wrangler |

## Source and build workflow

`generate.js` reads `product-data.json` and writes the generated HTML to
`public/`. Both source and generated output are committed so previews and
deployments use the same reviewed artifact.

For every content or template change:

```bash
npm run build
git diff --check
git status --short
```

Commit changes to `generate.js` and/or `product-data.json` together with the
regenerated files under `public/`.

## Repository layout

```text
generate.js                    Static-site generator and shared templates
product-data.json              Product facts, page copy, reviews, and image paths
public/                        Generated site and self-hosted image assets
research/reviews-medium-women/ Review evidence and source-preserving exports
tools/                         Image, product, and review collection utilities
design/                        Reference mockups; not deployed
wordpress/                     Legacy/reference WordPress implementation
wrangler.jsonc                 Cloudflare static-assets Worker configuration
```

## Product and review integrity

- Cart links use
  `https://www.rockthetreatment.com/?add-to-cart=<id>&quantity=<n>`.
- The free gift note is entered at checkout.
- Shipping is free over $200; shipping for lower totals is calculated at
  checkout.
- Current fulfillment guidance is 1–2 business days from New York, followed by
  carrier transit time.
- Unopened packages in original packaging may be returned within 180 days with
  proof of purchase. Return shipping is customer-paid and original shipping is
  nonrefundable.
- Do not publish scarcity, comparison-value, same-day shipping, medical, or
  treatment claims without current supporting evidence.
- Exact-product reviews must remain distinct from company-level reviews.

The Medium Women's review archive currently contains:

- 145 exact-product Stamped.io reviews
- 2 exact-listing Etsy reviews
- 233 company-level Google reviews
- 4 company-level Yelp reviews

See `research/reviews-medium-women/README.md` for scope rules, source URLs, and
deduplication counts. `tools/gather-review-sources.js` rebuilds the archive from
the Stamped feed and browser-open Google, Etsy, and Yelp review pages.

## Images and performance

Images are self-hosted under `public/assets/uploads/` to avoid the live store's
cross-origin hotlink restrictions. Product images are served through `<picture>`
with AVIF and WebP variants plus the original fallback.

```bash
node tools/fetch-images.js
npm run optimize
npm run build
```

The generator only references optimized variants that exist, so a missing
variant falls back to the original image.

## Verification checklist

Before merging:

- Build completes without modifying unexpected pages.
- All local image references resolve.
- Gallery thumbnails, keyboard controls, and FAQ accordions work.
- Quantity changes update every purchase CTA with the correct product ID.
- Mobile sticky purchase UI does not cover content.
- Canonical URLs point to the corresponding live WooCommerce product page.
- Generated pages retain `noindex, follow` unless indexing is intentionally
  enabled in `generate.js`.
- Review labels accurately distinguish exact-product and company-level proof.

## Deployment

The repository is configured as a Cloudflare static-assets Worker:

- Worker name: `rtt-minisite`
- Asset directory: `public`
- Configuration: `wrangler.jsonc`
- Production command: `npm run deploy`

Cloudflare's Git integration creates preview builds for pull requests. Merge
only after the Cloudflare check passes.
