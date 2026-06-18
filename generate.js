#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'product-data.json'), 'utf8'));

// Cloudflare Pages serves this directory at https://m.rockthetreatment.com
const outDir = path.join(__dirname, 'public');
fs.mkdirSync(outDir, { recursive: true });

// These mobile pages mirror the www product pages. By default we keep them out
// of the search index (canonical still points at www) so they don't compete with
// the main store in organic results. Flip to `true` if marketing wants m. indexed.
const ALLOW_INDEXING = false;

const { wwwBase, mBase, imageBase, logo, bellImg, itemImages, upsellProducts, faqs, radiationFaqs, products } = data;

function img(relPath) {
  return imageBase + relPath;
}

function itemImg(name) {
  if (itemImages[name]) return img(itemImages[name]);
  // placeholder gradient
  const encoded = Buffer.from(`<svg width="70" height="70" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f5f0eb"/><stop offset="100%" stop-color="#e8ddd4"/></linearGradient></defs><rect width="70" height="70" fill="url(#g)"/><text x="35" y="42" text-anchor="middle" font-size="12" fill="#999" font-family="sans-serif">${escHtml(name.substring(0,10))}</text></svg>`).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---- Responsive image helpers (AVIF/WebP via <picture>) -------------------
// Variants are produced offline by tools/optimize-images.js. generate.js only
// references variant files that actually exist on disk, so a missing source
// (or a not-yet-optimized asset) degrades gracefully to a plain <img>.
const LOCAL_PREFIX = '/assets/uploads/';

function diskPath(url) {
  return path.join(outDir, url.replace(/^\//, ''));
}

// For a local asset URL, return {ext, avif, webp, fallback}; null for non-local
// srcs (data: URIs, external URLs). Only includes variant URLs whose files exist.
function variants(url) {
  if (!url || !url.startsWith(LOCAL_PREFIX)) return null;
  const ext = path.extname(url).toLowerCase();
  const base = url.slice(0, -ext.length);
  const avifU = base + '.avif';
  const webpU = base + '.webp';
  // The animated GIF is converted to an animated .webp + a still .jpg fallback.
  const fallbackU = ext === '.gif' ? base + '-still.jpg' : url;
  const has = u => fs.existsSync(diskPath(u));
  return {
    ext,
    avif: has(avifU) ? avifU : '',
    // Don't duplicate a webp <source> when the fallback itself is a .webp.
    webp: (ext !== '.webp' && has(webpU)) ? webpU : '',
    fallback: has(fallbackU) ? fallbackU : url,
  };
}

function imgTag(src, o = {}) {
  const a = [];
  if (o.id) a.push(`id="${o.id}"`);
  if (o.cls) a.push(`class="${o.cls}"`);
  a.push(`src="${src}"`);
  a.push(`alt="${escHtml(o.alt || '')}"`);
  if (o.width) a.push(`width="${o.width}"`);
  if (o.height) a.push(`height="${o.height}"`);
  if (o.priority) a.push('fetchpriority="high"');
  if (o.lazy !== false) a.push('loading="lazy"');
  a.push('decoding="async"');
  if (o.onerror) a.push(`onerror="${o.onerror}"`);
  if (o.extra) a.push(o.extra);
  return `<img ${a.join(' ')}>`;
}

// <picture> with AVIF/WebP sources + original (or GIF still) <img> fallback.
// Pass avifId/webpId to tag the <source>s so JS can swap them (swipe gallery).
function picture(url, o = {}) {
  const v = variants(url);
  if (!v) return imgTag(url, o);
  const sources = [];
  if (v.avif) sources.push(`<source ${o.avifId ? `id="${o.avifId}" ` : ''}type="image/avif" srcset="${v.avif}">`);
  if (v.webp) sources.push(`<source ${o.webpId ? `id="${o.webpId}" ` : ''}type="image/webp" srcset="${v.webp}">`);
  if (!sources.length) return imgTag(v.fallback, o);
  return `<picture>${sources.join('')}${imgTag(v.fallback, o)}</picture>`;
}

function slugToFile(url) {
  // convert /womens-large-chemo-basket/ -> womens-large-chemo-basket
  const s = url.replace(/^\//, '').replace(/\/$/, '');
  // check if it's one of our products
  const match = products.find(p => p.slug === s);
  if (match) return `./${s}.html`;
  return `https://www.rockthetreatment.com${url}`;
}

function stars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function generatePage(product) {
  const isRadiation = product.slug.includes('radiation');
  const faqList = isRadiation ? radiationFaqs : faqs;
  const totalItems = product.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const cartUrl = `${wwwBase}/?add-to-cart=${product.id}`;
  const freeShipping = parseFloat(product.price.replace('$','')) >= 100;
  const heroUrl = img(product.heroImage);
  // Preload the smallest hero variant the browser can use (AVIF if present).
  const heroV = variants(heroUrl);
  const heroPreloadHref = heroV && heroV.avif ? heroV.avif : heroUrl;
  const heroPreloadType = heroV && heroV.avif ? ' type="image/avif"' : '';
  // Per-gallery-image variant URLs, consumed by the swipe-gallery JS below.
  const galleryVariants = product.galleryImages.map(gi => {
    const u = img(gi);
    const v = variants(u);
    return { a: v ? v.avif : '', w: v ? v.webp : '', f: v ? v.fallback : u };
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#5ba346">
<meta name="robots" content="${ALLOW_INDEXING ? 'index, follow' : 'noindex, follow'}">
<title>${escHtml(product.metaTitle)} | Rock The Treatment</title>
<meta name="description" content="${escHtml(product.shortDesc)}">
<link rel="canonical" href="${wwwBase}/${product.slug}/">
<meta property="og:title" content="${escHtml(product.metaTitle)} | Rock The Treatment">
<meta property="og:description" content="${escHtml(product.shortDesc)}">
<meta property="og:image" content="${mBase}${heroUrl}">
<meta property="og:url" content="${mBase}/${product.slug}">
<meta property="og:type" content="product">
<meta property="product:price:amount" content="${product.price.replace('$','')}">
<meta property="product:price:currency" content="USD">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="image" href="${heroPreloadHref}"${heroPreloadType} fetchpriority="high">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--green:#5ba346;--green-dark:#4a8a38;--orange:#ff6319;--orange-dark:#e55a15;--text:#1a1a1a;--text-light:#555;--text-muted:#888;--bg:#fff;--bg-alt:#fafafa;--bg-warm:#fff8f0;--border:#eee;--serif:'DM Serif Display',Georgia,serif;--sans:'Inter',system-ui,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--sans);background:#fff;color:var(--text)}
a{text-decoration:none;color:inherit}
picture{display:contents}

.page-wrapper{max-width:480px;margin:0 auto;background:#fff}
@media(min-width:481px){.page-wrapper{box-shadow:0 0 40px rgba(0,0,0,.08)}}

.topbar{background:var(--green);padding:8px 16px;display:flex;justify-content:space-between;align-items:center;color:#fff;font-size:14px}
.topbar .icons{display:flex;gap:16px}
.header{text-align:center;padding:12px 16px;border-bottom:1px solid var(--border)}
.header img{height:36px}
.nav{display:flex;justify-content:center;gap:18px;padding:10px 16px;border-bottom:1px solid var(--border);font-size:13px;font-weight:500;color:#333}
.nav a{color:#333}

.social-proof-banner{background:var(--bg-warm);padding:10px 16px;text-align:center;font-size:12px;font-weight:500;color:var(--text-light);border-bottom:1px solid #ffe0b2}
.social-proof-banner strong{color:var(--text)}

.gallery-main{width:100%;display:block}
.gallery-thumbs{display:flex;gap:6px;padding:8px 12px;overflow-x:auto}
.gallery-thumbs img{width:60px;height:60px;object-fit:cover;border-radius:6px;border:2px solid transparent;cursor:pointer;flex-shrink:0}
.gallery-thumbs img.active{border-color:var(--green)}

.product-info{padding:16px 20px}
.product-title{font-family:var(--serif);font-size:28px;font-weight:400;line-height:1.2;color:var(--text)}
.product-price{font-size:26px;font-weight:700;color:var(--text);font-variant-numeric:tabular-nums;margin-top:8px}
.qty-row{display:flex;align-items:center;gap:8px;margin-top:12px}
.qty-btn{width:36px;height:36px;border:1px solid #ddd;background:#fff;border-radius:6px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.qty-input{width:44px;height:36px;border:1px solid #ddd;text-align:center;font-size:15px;border-radius:6px;font-family:var(--sans)}

.btn-cart{display:block;width:100%;padding:16px;border:none;border-radius:8px;font-family:var(--sans);font-weight:700;font-size:16px;background:var(--orange);color:#fff;cursor:pointer;margin-top:14px;text-transform:uppercase;letter-spacing:.03em;box-shadow:0 4px 14px rgba(255,99,25,.35);text-align:center}
.btn-cart:hover{background:var(--orange-dark)}

.urgency{font-size:12px;font-weight:500;color:var(--green);text-align:center;margin-top:8px}
.urgency::before{content:'🔥 '}
.shipping-note{font-size:11px;color:var(--text-muted);margin-top:6px;text-align:center}
.shipping-note::before{content:'📦 '}

.trust-badges{display:flex;justify-content:center;gap:14px;padding:14px 0;margin-top:12px;border-top:1px solid #f0f0f0}
.trust-badge{font-size:10px;font-weight:600;color:#666;text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px}
.trust-badge .icon{font-size:20px}

.free-gift-callout{background:var(--bg-warm);border:1px solid #ffe0b2;border-radius:8px;padding:12px 14px;margin-top:14px;display:flex;align-items:center;gap:12px}
.free-gift-callout img{width:50px;height:50px;border-radius:6px;object-fit:cover}
.free-gift-callout .text{font-size:12px;line-height:1.4;color:#333}
.free-gift-callout .text strong{color:var(--orange)}

.product-desc{font-size:14px;line-height:1.65;color:var(--text-light);margin-top:14px;padding-top:14px;border-top:1px solid var(--border)}
.product-desc strong{color:var(--text)}

.gift-note{margin-top:14px;padding:12px;background:var(--bg-alt);border-radius:8px;border:1px solid var(--border)}
.gift-note label{font-size:13px;font-weight:600;display:block;margin-bottom:6px}
.gift-note textarea{width:100%;height:60px;border:1px solid #ddd;border-radius:6px;padding:8px;font-family:var(--sans);font-size:13px;resize:none}

.related-section{padding:20px 16px;border-top:4px solid var(--border)}
.section-title{font-family:var(--serif);font-size:20px;margin-bottom:14px}
.related-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.related-card{border:1px solid var(--border);border-radius:10px;overflow:hidden}
.related-card img{width:100%;aspect-ratio:1/1;object-fit:cover}
.related-card .info{padding:10px}
.related-card .name{font-size:13px;font-weight:500;line-height:1.3;margin-bottom:6px}
.related-card .price{font-size:15px;font-weight:700}

.value-props{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:4px solid var(--border)}
.value-prop{padding:20px 14px;text-align:center;border-bottom:1px solid var(--border);border-right:1px solid var(--border)}
.value-prop:nth-child(2n){border-right:none}
.value-prop .vp-icon{font-size:28px;margin-bottom:6px}
.value-prop .vp-title{font-family:var(--serif);font-size:14px;margin-bottom:4px}
.value-prop .vp-desc{font-size:11px;color:var(--text-muted);line-height:1.4}

.green-banner{background:var(--green);padding:28px 20px;text-align:center;color:#fff}
.green-banner h3{font-family:var(--serif);font-size:22px;font-weight:400;line-height:1.2}
.green-banner p{font-size:14px;opacity:.9;margin-top:8px}

.breakdown-section{padding:0}
.category-header{background:var(--bg-alt);padding:16px 20px;border-top:3px solid var(--green);border-bottom:1px solid var(--border)}
.category-header h3{font-family:var(--serif);font-size:18px;color:var(--text)}
.item-card{display:flex;gap:12px;padding:14px 16px;border-bottom:1px solid #f5f5f5}
.item-card img{width:70px;height:70px;object-fit:cover;border-radius:8px;flex-shrink:0}
.item-card .item-info{flex:1}
.item-card .item-name{font-size:14px;font-weight:600;margin-bottom:4px;color:var(--text)}
.item-card .item-desc{font-size:12px;line-height:1.5;color:var(--text-light);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}

.faq-section{padding:20px 16px;border-top:4px solid var(--border)}
.faq-item{border-bottom:1px solid var(--border);padding:14px 0;cursor:pointer;user-select:none}
.faq-item .faq-header{display:flex;justify-content:space-between;align-items:center}
.faq-item .q{font-size:14px;font-weight:600;flex:1;padding-right:12px}
.faq-item .chev{color:var(--text-muted);font-size:12px;transition:transform .25s ease}
.faq-item.open .chev{transform:rotate(180deg)}
.faq-item .faq-answer{max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease;font-size:13px;line-height:1.6;color:var(--text-light)}
.faq-item.open .faq-answer{max-height:300px;padding-top:10px}

.gallery-main{width:100%;display:block;touch-action:pan-y;position:relative;overflow:hidden}
.gallery-swipe-hint{position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.5);color:#fff;font-size:10px;padding:3px 8px;border-radius:10px;pointer-events:none;opacity:1;transition:opacity .5s}
.gallery-wrap{position:relative;overflow:hidden;touch-action:pan-y}

.upsell-section{padding:20px 16px;border-top:4px solid var(--border);background:var(--bg-alt)}
.upsell-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.upsell-card{background:#fff;border-radius:8px;overflow:hidden;border:1px solid var(--border);text-align:center}
.upsell-card img{width:100%;aspect-ratio:1/1;object-fit:cover}
.upsell-card .uname{font-size:11px;font-weight:500;padding:6px 6px 8px;line-height:1.3}

.reviews-section{padding:20px 16px;border-top:4px solid var(--border)}
.review-summary{text-align:center;margin-bottom:16px}
.review-summary .big-rating{font-size:48px;font-weight:700}
.review-summary .stars-big{font-size:20px;color:#f59e0b}
.review-summary .count{font-size:13px;color:var(--text-muted);margin-top:4px}
.star-bars{margin:12px 0 16px}
.star-bar{display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:12px;color:var(--text-muted)}
.star-bar .bar{flex:1;height:6px;background:#eee;border-radius:3px;overflow:hidden}
.star-bar .bar-fill{height:100%;background:#f59e0b;border-radius:3px}
.review-tabs{display:flex;gap:0;margin-bottom:12px}
.review-tab{flex:1;padding:10px;text-align:center;font-size:13px;font-weight:600;border-bottom:2px solid var(--border);color:var(--text-muted);cursor:pointer}
.review-tab.active{border-bottom-color:var(--orange);color:var(--text)}
.review-card{background:var(--bg-alt);border-radius:8px;padding:14px;margin-bottom:10px}
.review-card .stars{color:#f59e0b;font-size:13px;margin-bottom:4px}
.review-card .r-title{font-size:14px;font-weight:600;margin-bottom:4px}
.review-card .r-text{font-size:13px;line-height:1.5;color:var(--text-light)}
.review-card .r-author{font-size:12px;font-weight:600;color:var(--text-muted);margin-top:6px}
.review-card .r-date{font-size:11px;color:#bbb}
.review-reply{background:#fff;border-left:3px solid var(--green);padding:10px 12px;margin:8px 0 0 12px;border-radius:0 6px 6px 0;font-size:12px;line-height:1.5;color:var(--text-light)}
.review-reply strong{color:var(--green);font-size:11px}

.footer{background:#222;padding:24px 20px;color:#aaa}
.footer-brand{font-family:var(--serif);font-size:18px;color:#fff;margin-bottom:8px}
.footer-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:14px}
.footer-col h4{font-size:12px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
.footer-col a{display:block;font-size:12px;color:#888;text-decoration:none;margin-bottom:4px}
.footer-subscribe{margin-top:16px;padding-top:16px;border-top:1px solid #333}
.footer-subscribe h4{font-size:12px;font-weight:700;color:#fff;margin-bottom:8px}
.footer-subscribe .sub-row{display:flex;gap:6px}
.footer-subscribe input{flex:1;padding:8px 10px;border:1px solid #444;background:#333;color:#fff;border-radius:4px;font-size:12px;font-family:var(--sans)}
.footer-subscribe button{padding:8px 14px;background:var(--orange);color:#fff;border:none;border-radius:4px;font-size:12px;font-weight:600;cursor:pointer}
.footer-bottom{margin-top:16px;padding-top:12px;border-top:1px solid #333;font-size:11px;color:#666;text-align:center}
.footer-socials{display:flex;justify-content:center;gap:14px;margin:10px 0;font-size:16px}
</style>
</head>
<body>

<div class="page-wrapper">

  <!-- HEADER -->
  <div class="topbar">
    <a href="https://www.rockthetreatment.com" style="font-size:18px;color:#fff;">☰</a>
    <div class="icons">
      <a href="https://www.rockthetreatment.com" style="color:#fff;">🔍</a>
      <a href="https://www.rockthetreatment.com/my-account/" style="color:#fff;">👤</a>
      <a href="https://www.rockthetreatment.com/cart/" style="color:#fff;">🛒</a>
    </div>
  </div>
  <div class="header">
    <a href="https://www.rockthetreatment.com">${picture(logo, { alt: 'Rock The Treatment', lazy: false })}</a>
  </div>
  <div class="nav">
    <a href="https://www.rockthetreatment.com/shop/">Shop</a>
    <a href="https://www.rockthetreatment.com/about/">About</a>
    <a href="https://www.rockthetreatment.com/info/">Info</a>
    <a href="https://www.rockthetreatment.com/blog/">Blog</a>
    <a href="https://www.rockthetreatment.com/contact/">Contact</a>
  </div>

  <!-- SOCIAL PROOF BANNER -->
  <div class="social-proof-banner">
    ★★★★★ <strong>${product.reviewCount.toLocaleString()} families</strong> have sent love with this package
  </div>

  <!-- PRODUCT GALLERY (swipeable) -->
  <div class="gallery-wrap" id="galleryWrap">
    ${picture(heroUrl, { id: 'mainImg', cls: 'gallery-main', alt: product.title, priority: true, lazy: false, avifId: 'mainSrcAvif', webpId: 'mainSrcWebp' })}
    <span class="gallery-swipe-hint" id="swipeHint">← swipe →</span>
  </div>
  <div class="gallery-thumbs" id="galleryThumbs">
${product.galleryImages.map((gi, i) => '    ' + picture(img(gi), { alt: product.title, cls: i === 0 ? 'active' : '', lazy: false, extra: `data-index="${i}"` })).join('\n')}
  </div>

  <!-- PRODUCT INFO -->
  <div class="product-info">
    <h1 class="product-title">${escHtml(product.title)}</h1>
    <div class="product-price">${product.price}</div>
    <div class="qty-row">
      <button class="qty-btn" onclick="var i=document.getElementById('qty');i.value=Math.max(1,+i.value-1)">−</button>
      <input class="qty-input" id="qty" value="1" readonly>
      <button class="qty-btn" onclick="var i=document.getElementById('qty');i.value=+i.value+1">+</button>
    </div>
    <a href="${cartUrl}" class="btn-cart">Add to Cart</a>
    <div class="urgency">Orders placed before 2pm ship same day</div>
    <div class="shipping-note">${freeShipping ? 'Free shipping on this order!' : 'Free shipping on orders over $100'}</div>

    <!-- TRUST BADGES -->
    <div class="trust-badges">
      <div class="trust-badge"><span class="icon">🔒</span>Secure<br>Checkout</div>
      <div class="trust-badge"><span class="icon">📦</span>Ships in<br>1-2 Days</div>
      <div class="trust-badge"><span class="icon">🎁</span>${product.itemCount} Items<br>Included</div>
      <div class="trust-badge"><span class="icon">💝</span>Free Gift<br>Included</div>
    </div>

    <!-- FREE GIFT CALLOUT -->
    <div class="free-gift-callout">
      ${picture(bellImg, { alt: 'Celebration Bell', width: 50, height: 50 })}
      <div class="text">
        <strong>FREE bonus!</strong> Every purchase includes an End of Treatment Celebration Gift — order separately at no charge.
      </div>
    </div>

    <!-- DESCRIPTION -->
    <div class="product-desc">
      ${product.description}
    </div>

    <!-- GIFT NOTE -->
    <div class="gift-note">
      <label>🖊 Add a gift note:</label>
      <textarea placeholder="Write a personal message for the recipient..."></textarea>
    </div>
  </div>

  <!-- RELATED PRODUCTS -->
  <div class="related-section">
    <div class="section-title">You may also like…</div>
    <div class="related-grid">
${product.relatedProducts.map(rp => {
  const rpSlug = rp.url.replace(/^\//, '').replace(/\/$/, '');
  const rpMatch = products.find(p => p.slug === rpSlug);
  const rpHref = rpMatch ? `./${rpSlug}.html` : `https://www.rockthetreatment.com${rp.url}`;
  return `      <a href="${rpHref}" class="related-card">
        ${picture(img(rp.image), { alt: rp.name, onerror: "this.closest('.related-card,.upsell-card')?.remove()" })}
        <div class="info">
          <div class="name">${escHtml(rp.name)}</div>
          <div class="price">${rp.price}</div>
        </div>
      </a>`;
}).join('\n')}
    </div>
  </div>

  <!-- VALUE PROPS -->
  <div class="value-props">
    <div class="value-prop"><div class="vp-icon">💜</div><div class="vp-title">Thoughtfully Curated</div><div class="vp-desc">Every item hand-picked for comfort during treatment</div></div>
    <div class="value-prop"><div class="vp-icon">📦</div><div class="vp-title">Convenient & Discreet</div><div class="vp-desc">Ready to gift — beautifully packed and shipped fast</div></div>
    <div class="value-prop"><div class="vp-icon">⭐</div><div class="vp-title">Unmatched Service</div><div class="vp-desc">Personal attention to every order and customer</div></div>
    <div class="value-prop"><div class="vp-icon">🤝</div><div class="vp-title">Caring Contributions</div><div class="vp-desc">A portion of proceeds supports cancer patients in need</div></div>
  </div>

  <!-- GREEN BANNER -->
  <div class="green-banner">
    <h3>Nurturing Strength.<br>Uplifting Spirits.</h3>
    <p>Nourish the Body. Focus the Mind.</p>
  </div>

  <!-- PRODUCT BREAKDOWN -->
${product.categories.map(cat => `  <div class="category-header"><h3>${escHtml(cat.name)}</h3></div>
${cat.items.map(item => `  <div class="item-card">
    ${picture(itemImg(item.name), { alt: item.name, width: 70, height: 70 })}
    <div class="item-info">
      <div class="item-name">${escHtml(item.name)}</div>
      <div class="item-desc">${escHtml(item.desc)}</div>
    </div>
  </div>`).join('\n')}`).join('\n')}

  <!-- FAQs -->
  <div class="faq-section">
    <div class="section-title" style="margin-bottom:8px;">FAQs</div>
${faqList.map((q, i) => {
  const answers = {
    "What gifts to avoid?": "Avoid flowers (infection risk), strong perfumes/scents (nausea triggers), and sugary foods. Our care packages are specifically curated to include only safe, doctor-recommended items.",
    "What are the most common side effects of chemo?": "Common side effects include nausea, dry mouth, fatigue, skin sensitivity, hair loss, and cognitive fog (\"chemo brain\"). Our packages include items that address each of these.",
    "What items help with the side effects of chemo?": "Lip balm and lotion for dry skin, peppermint for nausea, protein snacks for energy, puzzles for mental stimulation, cozy socks for cold extremities, and eye pillows for headaches.",
    "Are there any restrictions on gifts chemo patients can receive?": "Avoid strong scents, raw foods, and items that could harbor bacteria. All items in our packages are safe, sealed, and designed specifically for chemo patients.",
    "What about dietary restriction substitutions?": "We offer substitutions for oral cancer, sugar-free, vegan, dairy-free, nut-free, gluten-free, kosher, and organic preferences. Note your needs during checkout.",
    "What gifts to avoid for radiation patients?": "Avoid anything with strong chemicals near treatment areas. Our radiation packages include gentle, soothing products specifically chosen for radiation therapy patients.",
    "What are the most common side effects of radiation?": "Skin irritation, fatigue, nausea, and localized soreness are common. Our packages include premium skincare and comfort items designed for these specific effects.",
    "What items help with the side effects of radiation?": "Gentle skin lotions and serums for irritation, peppermint for nausea, protein snacks for energy, and relaxation items for comfort during recovery.",
    "Are there any restrictions on gifts radiation patients can receive?": "Avoid harsh skincare products near treatment areas. All items in our radiation package are gentle, soothing, and safe for use during therapy.",
  };
  const answer = answers[q] || "Contact us for more details — we're happy to help with any questions about our care packages.";
  return `    <div class="faq-item" onclick="this.classList.toggle('open')">
      <div class="faq-header"><span class="q">${escHtml(q)}</span><span class="chev">▾</span></div>
      <div class="faq-answer">${escHtml(answer)}</div>
    </div>`;
}).join('\n')}
    <div style="text-align:center;margin-top:10px;">
      <a href="https://www.rockthetreatment.com/faqs/" style="font-size:13px;color:var(--green);font-weight:600;">Browse more FAQs →</a>
    </div>
  </div>

  <!-- UPSELL GRID -->
  <div class="upsell-section">
    <div class="section-title" style="font-family:var(--serif);font-size:20px;margin-bottom:14px;">Add even more support</div>
    <div class="upsell-grid">
${upsellProducts.map(up => `      <a href="https://www.rockthetreatment.com${up.url}" class="upsell-card">
        ${picture(img(up.image), { alt: up.name, onerror: "this.closest('.related-card,.upsell-card')?.remove()" })}
        <div class="uname">${escHtml(up.name)}</div>
      </a>`).join('\n')}
    </div>
  </div>

  <!-- REVIEWS -->
  <div class="reviews-section">
    <div class="section-title">Our Fan Club</div>
    <div class="review-summary">
      <div class="big-rating">5.0</div>
      <div class="stars-big">★★★★★</div>
      <div class="count">Based on ${product.reviewCount} Reviews</div>
    </div>
    <div class="star-bars">
      <div class="star-bar"><span>5 ★</span><div class="bar"><div class="bar-fill" style="width:97%"></div></div><span>${product.reviewCount - 5}</span></div>
      <div class="star-bar"><span>4 ★</span><div class="bar"><div class="bar-fill" style="width:1.5%"></div></div><span>3</span></div>
      <div class="star-bar"><span>3 ★</span><div class="bar"><div class="bar-fill" style="width:0.5%"></div></div><span>1</span></div>
      <div class="star-bar"><span>2 ★</span><div class="bar"><div class="bar-fill" style="width:0.5%"></div></div><span>1</span></div>
      <div class="star-bar"><span>1 ★</span><div class="bar"><div class="bar-fill" style="width:0%"></div></div><span>0</span></div>
    </div>
    <div class="review-tabs">
      <div class="review-tab active">Reviews (${product.reviewCount})</div>
      <div class="review-tab">Questions (4)</div>
    </div>
${product.reviews.map(r => `    <div class="review-card">
      <div class="r-date">${escHtml(r.date)}</div>
      <div class="stars">${stars(r.stars)}</div>
      <div class="r-title">${escHtml(r.title)}</div>
      <div class="r-text">${escHtml(r.text)}</div>
      <div class="r-author">— ${escHtml(r.author)} · Verified Buyer</div>
${r.reply ? `      <div class="review-reply"><strong>Rock The Treatment</strong><br>${escHtml(r.reply)}</div>` : ''}
    </div>`).join('\n')}
    <div style="text-align:center;padding:12px;">
      <a href="https://www.rockthetreatment.com/${product.slug}/#reviews" style="font-size:13px;color:var(--orange);font-weight:600;cursor:pointer;">Load more reviews ↓</a>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-brand">Rock The Treatment</div>
    <div style="font-size:12px;">516-690-7009 · info@rockthetreatment.com</div>
    <div style="font-size:11px;margin-top:4px;">325 Marcus Blvd Suite A, Deer Park, NY 11729</div>
    <div class="footer-socials">
      <a href="https://www.facebook.com/rockthetreatment" style="color:#aaa;">📘</a>
      <a href="https://www.instagram.com/rockthetreatment" style="color:#aaa;">📷</a>
      <a href="https://twitter.com/rocktreatment" style="color:#aaa;">🐦</a>
      <a href="https://www.tiktok.com/@rockthetreatment" style="color:#aaa;">🎵</a>
      <a href="https://www.pinterest.com/rockthetreatment" style="color:#aaa;">📌</a>
      <a href="https://www.youtube.com/@rockthetreatment" style="color:#aaa;">▶️</a>
    </div>
    <div class="footer-grid">
      <div class="footer-col">
        <h4>Support</h4>
        <a href="https://www.rockthetreatment.com/shipping-returns/">Shipping & Returns</a>
        <a href="https://www.rockthetreatment.com/faqs/">FAQs</a>
        <a href="https://www.rockthetreatment.com/contact/">Contact Us</a>
      </div>
      <div class="footer-col">
        <h4>Shop</h4>
        <a href="https://www.rockthetreatment.com/shop/">Care Packages</a>
        <a href="https://www.rockthetreatment.com/about/">About</a>
        <a href="https://www.rockthetreatment.com/blog/">Blog</a>
        <a href="https://www.rockthetreatment.com/donate/">Donate</a>
      </div>
    </div>
    <div class="footer-subscribe">
      <h4>Subscribe</h4>
      <div class="sub-row">
        <input placeholder="Your email">
        <button>Send</button>
      </div>
      <div style="font-size:10px;color:#666;margin-top:6px;">Don't worry, we don't like spam either</div>
    </div>
    <div class="footer-bottom">
      <div>Terms · Privacy Policy · Sitemap</div>
      <div style="margin-top:4px;">Copyright 2025 © ROCK the TREATMENT™</div>
    </div>
  </div>

</div>

<script>
(function(){
  // Gallery swipe + thumb click
  var wrap = document.getElementById('galleryWrap');
  var mainImg = document.getElementById('mainImg');
  var mainAvif = document.getElementById('mainSrcAvif');
  var mainWebp = document.getElementById('mainSrcWebp');
  var thumbs = document.querySelectorAll('#galleryThumbs img');
  var hint = document.getElementById('swipeHint');
  // Per-image AVIF/WebP/fallback URLs so format negotiation survives src swaps.
  var GALLERY = ${JSON.stringify(galleryVariants)};
  var currentIdx = 0;
  var startX = 0, diffX = 0, swiping = false;

  function showImg(idx) {
    if (idx < 0) idx = GALLERY.length - 1;
    if (idx >= GALLERY.length) idx = 0;
    currentIdx = idx;
    var g = GALLERY[idx] || {};
    // Update the <source> srcsets AND the <img> src so the <picture> re-selects.
    if (mainAvif) mainAvif.srcset = g.a || '';
    if (mainWebp) mainWebp.srcset = g.w || '';
    mainImg.src = g.f || mainImg.src;
    thumbs.forEach(function(t,i){ t.classList.toggle('active', i === idx); });
    if (hint) { hint.style.opacity = '0'; setTimeout(function(){ if(hint.parentNode) hint.parentNode.removeChild(hint); }, 500); }
  }

  // Thumb clicks
  thumbs.forEach(function(t, i){
    t.addEventListener('click', function(){ showImg(i); });
  });

  // Touch swipe
  wrap.addEventListener('touchstart', function(e){
    startX = e.touches[0].clientX;
    swiping = true;
  }, {passive: true});

  wrap.addEventListener('touchmove', function(e){
    if (!swiping) return;
    diffX = e.touches[0].clientX - startX;
  }, {passive: true});

  wrap.addEventListener('touchend', function(){
    if (!swiping) return;
    swiping = false;
    if (Math.abs(diffX) > 40) {
      if (diffX < 0) showImg(currentIdx + 1);
      else showImg(currentIdx - 1);
    }
    diffX = 0;
  });

  // Mouse drag (desktop)
  wrap.addEventListener('mousedown', function(e){
    startX = e.clientX;
    swiping = true;
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e){
    if (!swiping) return;
    diffX = e.clientX - startX;
  });
  document.addEventListener('mouseup', function(){
    if (!swiping) return;
    swiping = false;
    if (Math.abs(diffX) > 40) {
      if (diffX < 0) showImg(currentIdx + 1);
      else showImg(currentIdx - 1);
    }
    diffX = 0;
  });

  // Keyboard arrows
  document.addEventListener('keydown', function(e){
    if (e.key === 'ArrowLeft') showImg(currentIdx - 1);
    if (e.key === 'ArrowRight') showImg(currentIdx + 1);
  });

  // Quantity sync with cart URL
  var qtyInput = document.getElementById('qty');
  var cartBtn = document.querySelector('.btn-cart');
  if (qtyInput && cartBtn) {
    var baseUrl = cartBtn.href;
    document.querySelectorAll('.qty-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        setTimeout(function(){
          cartBtn.href = baseUrl + '&quantity=' + qtyInput.value;
        }, 10);
      });
    });
  }
})();
</script>

</body>
</html>`;
}

function generateIndex() {
  const cards = products.map(p => `    <a class="card" href="./${p.slug}.html">
      ${picture(img(p.heroImage), { alt: p.title })}
      <div class="info"><div class="name">${escHtml(p.title)}</div><div class="price">${p.price}</div></div>
    </a>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#5ba346">
<meta name="robots" content="${ALLOW_INDEXING ? 'index, follow' : 'noindex, follow'}">
<title>Care Packages | Rock The Treatment</title>
<meta name="description" content="Thoughtfully curated chemo and radiation care packages — the mobile-friendly Rock The Treatment store.">
<link rel="canonical" href="${wwwBase}/shop/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--green:#5ba346;--orange:#ff6319;--text:#1a1a1a;--border:#eee;--serif:'DM Serif Display',Georgia,serif;--sans:'Inter',system-ui,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--sans);background:#fff;color:var(--text)}
a{text-decoration:none;color:inherit}
picture{display:contents}
.wrap{max-width:480px;margin:0 auto}
.header{text-align:center;padding:16px;border-bottom:1px solid var(--border)}
.header img{height:38px}
.intro{padding:20px 16px 8px;text-align:center}
.intro h1{font-family:var(--serif);font-size:24px;font-weight:400}
.intro p{font-size:13px;color:#666;margin-top:6px}
.grid{padding:12px 16px 28px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{border:1px solid var(--border);border-radius:10px;overflow:hidden}
.card img{width:100%;aspect-ratio:1/1;object-fit:cover}
.card .info{padding:10px}
.card .name{font-size:13px;font-weight:500;line-height:1.3;margin-bottom:6px}
.card .price{font-size:15px;font-weight:700}
.foot{text-align:center;padding:0 16px 28px;font-size:12px;color:#888}
.foot a{color:var(--green);font-weight:600}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><a href="${wwwBase}">${picture(logo, { alt: 'Rock The Treatment', priority: true, lazy: false })}</a></div>
  <div class="intro">
    <h1>Care Packages</h1>
    <p>Thoughtfully curated comfort for chemo &amp; radiation</p>
  </div>
  <div class="grid">
${cards}
  </div>
  <div class="foot">Looking for something else? <a href="${wwwBase}/shop/">Visit the full store →</a></div>
</div>
</body>
</html>`;
}

// Generate all product pages
for (const product of products) {
  const html = generatePage(product);
  const filePath = path.join(outDir, `${product.slug}.html`);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ Generated: ${product.slug}.html (${(html.length / 1024).toFixed(1)} KB)`);
}

// Generate the hub / index
const indexHtml = generateIndex();
fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml, 'utf8');
console.log(`✅ Generated: index.html (${(indexHtml.length / 1024).toFixed(1)} KB)`);

console.log(`\n🎉 Done! ${products.length} product pages + index generated in ${outDir}`);
