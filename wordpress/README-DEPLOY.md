# RTT CRO Landing Pages — WordPress Deployment Guide

## Overview

These files convert the 5 static CRO landing pages into WordPress page templates that use WooCommerce's native add-to-cart functionality. The pages are **lightweight** — they skip Elementor entirely and load only WooCommerce + tracking scripts.

## Files

| File | Purpose | Goes where |
|------|---------|------------|
| `rtt-landing-template.php` | The page template (renders the full landing page) | Child theme root |
| `rtt-lp-data.php` | Static product data (items, reviews, images) | Child theme root |
| `rtt-lp-functions.php` | Functions: meta box, Elementor removal, cart fragments | Include in `functions.php` |

---

## Step-by-Step Deployment

### 1. Upload Files to Child Theme

Upload these 3 PHP files to the **child theme directory** (e.g., `/wp-content/themes/hello-elementor-child/`):

```
wp-content/themes/hello-elementor-child/
├── rtt-landing-template.php
├── rtt-lp-data.php
├── rtt-lp-functions.php   ← (or paste contents into functions.php)
└── functions.php           ← (existing file — add one line)
```

### 2. Include Functions

Open the child theme's `functions.php` and add this line at the bottom:

```php
require_once get_stylesheet_directory() . '/rtt-lp-functions.php';
```

This registers the template, adds the meta box, enqueues WC scripts, and removes Elementor on landing pages.

### 3. Create Landing Pages in WP Admin

For **each of the 5 products**, create a new Page:

1. Go to **Pages → Add New**
2. Set the **Title** (e.g., "Large Women's Chemo Care Package - LP")
3. In the right sidebar under **Page Attributes**, select template: **RTT CRO Landing Page**
4. In the **RTT Landing Page — Product ID** meta box (right sidebar), enter the WooCommerce product ID
5. Set the **Permalink/slug** (see table below)
6. **Publish**

### Product ID Reference

| Product | WC Product ID | Suggested Slug |
|---------|:-------------:|----------------|
| Women's Large Chemo | **248** | `/lp/womens-large-chemo-basket/` |
| Women's Medium Chemo | **235** | `/lp/womens-medium-chemo-basket/` |
| Women's Small Chemo | **10338** | `/lp/womens-small-chemo-basket/` |
| Radiation Care Package | **250** | `/lp/radiation-basket/` |
| Men's Medium Chemo | **232** | `/lp/mens-medium-chemo-basket/` |

> **Tip:** Create a parent page called "lp" (or set up a rewrite rule) so all landing pages live under `/lp/`.

### 4. Verify Product IDs

The product IDs above come from the existing WooCommerce store. **Double-check** each one:

1. Go to **Products** in WP Admin
2. Search for the product name
3. Hover over it — the ID shows in the URL (`post=248`)
4. Make sure the ID in the meta box matches

### 5. Test Each Page

For each landing page:

- [ ] Page loads without Elementor CSS/JS (check browser DevTools → Network tab)
- [ ] Product title and price are pulled live from WooCommerce
- [ ] All images load correctly
- [ ] "Add to Cart" button works via AJAX (no page reload)
- [ ] Mini-cart notification appears after adding to cart
- [ ] Cart count in header updates
- [ ] "View Cart" and "Checkout" links in notification work
- [ ] Quantity +/- buttons work
- [ ] Gallery thumbnail clicking works
- [ ] All navigation links work
- [ ] Footer links work
- [ ] Page is mobile-responsive (test on phone or Chrome DevTools mobile view)
- [ ] GA4/GTM/FB Pixel fire (check with Tag Assistant or FB Pixel Helper extension)

### 6. Check Tracking

The template uses `wp_head()` and `wp_footer()`, so any tracking pixels installed via:
- **Google Site Kit** or **MonsterInsights** (GA4)
- **PixelYourSite** or **Facebook for WooCommerce** (FB Pixel)
- **Google Ads** conversion tracking
- **GTM** (Google Tag Manager)

...will all fire automatically. No extra configuration needed.

---

## A/B Testing Setup

### Option A: Simple URL Split (Recommended)

1. Keep the original product pages as-is (e.g., `/womens-large-chemo-basket/`)
2. Landing pages live at `/lp/womens-large-chemo-basket/`
3. In Google Ads / Meta Ads, create two ad sets:
   - Ad Set A → sends traffic to original URL
   - Ad Set B → sends traffic to `/lp/` URL
4. Compare conversion rates in GA4

### Option B: Google Optimize / VWO / Convert

1. Set up a redirect test in your A/B testing tool
2. Original URL = Control
3. `/lp/` URL = Variant
4. Tool handles traffic splitting automatically

### Option C: Server-Side Split via PHP

Add this to the child theme's `functions.php` to randomly redirect 50% of traffic:

```php
add_action( 'template_redirect', function() {
    // Map original slugs to LP slugs
    $ab_map = array(
        'womens-large-chemo-basket'  => '/lp/womens-large-chemo-basket/',
        'womens-medium-chemo-basket' => '/lp/womens-medium-chemo-basket/',
        'womens-small-chemo-basket'  => '/lp/womens-small-chemo-basket/',
        'radiation-basket'           => '/lp/radiation-basket/',
        'mens-medium-chemo-basket'   => '/lp/mens-medium-chemo-basket/',
    );

    if ( is_product() ) {
        global $post;
        $slug = $post->post_name;
        if ( isset( $ab_map[ $slug ] ) ) {
            // 50/50 split using cookie for consistency
            if ( ! isset( $_COOKIE['rtt_ab_variant'] ) ) {
                $variant = rand(0, 1) ? 'lp' : 'original';
                setcookie( 'rtt_ab_variant', $variant, time() + 86400 * 30, '/' );
            } else {
                $variant = $_COOKIE['rtt_ab_variant'];
            }
            if ( $variant === 'lp' ) {
                wp_redirect( home_url( $ab_map[ $slug ] ), 302 );
                exit;
            }
        }
    }
});
```

---

## Troubleshooting

### "No product ID set" error
→ Edit the page in WP Admin and enter the WC product ID in the sidebar meta box.

### "Product not found" error
→ The product ID doesn't match any WooCommerce product. Double-check the ID.

### "No landing page data" error
→ The product ID exists in WooCommerce but isn't in `rtt-lp-data.php`. Add it.

### Elementor CSS still loading
→ Make sure `rtt-lp-functions.php` is included in `functions.php`. Clear any caching plugins (WP Super Cache, W3 Total Cache, LiteSpeed, NitroPack, etc.).

### Add to Cart button doesn't work (page reloads)
→ Check that WooCommerce AJAX add-to-cart is enabled: **WooCommerce → Settings → Products → General → Enable AJAX add to cart buttons on archives** (should be checked). Also verify jQuery is loading.

### Images not loading
→ The images use the NitroPack CDN URLs. If NitroPack is removed, update the image URLs in `rtt-lp-data.php` to use the standard WordPress upload URLs (e.g., `https://www.rockthetreatment.com/wp-content/uploads/...`).

### Cart count not updating
→ Make sure `wc-cart-fragments` script is loading. Check browser console for JS errors.

---

## Architecture Notes

- **Price & title** come live from WooCommerce (`wc_get_product()`) — if you update the price in WC, the landing page updates automatically
- **Static content** (item breakdowns, reviews, descriptions) comes from `rtt-lp-data.php` — edit this file to update content
- **One template, 5 pages** — each page just sets a different product ID; the template renders everything dynamically
- **No Elementor overhead** — pages load ~200KB instead of ~2MB+ with Elementor
- **Tracking fires via `wp_head()`** — whatever tracking plugins are installed site-wide will work on these pages too

---

## File Sizes (Approximate)

| Resource | With Elementor | Landing Page |
|----------|:-------------:|:------------:|
| HTML | ~800KB | ~25KB |
| CSS | ~1.2MB (20+ files) | ~5KB (inline) |
| JS | ~1.5MB (15+ files) | ~80KB (jQuery + WC) |
| **Total** | **~3.5MB** | **~110KB** |

That's a **97% reduction** in page weight. 🚀
