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
  if (/^https?:\/\//.test(relPath)) return relPath;
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

function generateWomensCroPage(product) {
  const ui = product.mobileUi;
  const heroUrl = img(product.heroImage);
  const galleryImages = ui.galleryImages || product.galleryImages;
  const galleryVariants = galleryImages.map(gi => {
    const u = img(gi);
    const v = variants(u);
    return { a: v ? v.avif : '', w: v ? v.webp : '', f: v ? v.fallback : u };
  });
  const heroV = variants(heroUrl);
  const heroPreloadHref = heroV && heroV.avif ? heroV.avif : heroUrl;
  const heroPreloadType = heroV && heroV.avif ? ' type="image/avif"' : '';
  const cartUrl = `${wwwBase}/?add-to-cart=${product.id}&quantity=1`;
  const rating = product.rating || 5;
  const packagesSent = product.companyPackagesSent || product.totalSales;
  const featuredReview = product.reviews[ui.featuredReviewIndex || 0] || product.reviews[0];
  const featuredItems = ui.featuredItems || [];
  const celebrationImage = img(ui.celebrationImage || '/2023/06/bell.png');
  const requestedAddOns = [
    "Cozy Companion™ Blanket",
    "YOU ROCK! Worry Stone",
    "Anti-Nausea Wristband",
    "Reusable Folding Tote",
    "#ROCKtheTREATMENT Wristband",
    "Knit Beanie",
    "Warmies® Plush Animal"
  ];
  const relatedAddOns = requestedAddOns
    .map(name => upsellProducts.find(item => item.name === name))
    .filter(Boolean)
    .concat([{
      name: "Warmies® + YOU ROCK! Stone",
      image: "https://www.rockthetreatment.com/wp-content/uploads/2026/04/Hippo-and-Stone-Thumb-isolated-400x400.png",
      url: "/hippo-warmies-you-rock-worry-stone-package-combination/"
    }]);
  const faqItems = [
    {
      q: 'When will it ship?',
      a: 'Orders are processed and shipped from New York in 1–2 business days. Delivery time varies by the carrier and destination.'
    },
    {
      q: 'How much is shipping?',
      a: 'Shipping is calculated at checkout. Orders over $200 qualify for free shipping.'
    },
    {
      q: 'Can I include a personal gift note?',
      a: 'Yes. A personal gift note is free and can be entered during checkout on RockTheTreatment.com.'
    },
    {
      q: 'Can I request dietary substitutions?',
      a: 'Please email info@rockthetreatment.com before ordering so the RTT team can review your request.'
    },
    {
      q: 'What is the return policy?',
      a: 'Unopened packages in their original packaging may be returned within 180 days with proof of purchase. The customer pays return shipping, and original shipping charges are nonrefundable.'
    },
    {
      q: 'Is the Celebration Bell included?',
      a: 'No. The Celebration Bell is a separate end-of-treatment gift and must be ordered separately.'
    }
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#81d742">
<meta name="robots" content="${ALLOW_INDEXING ? 'index, follow' : 'noindex, follow'}">
<title>${escHtml(product.metaTitle)} | Rock The Treatment</title>
<meta name="description" content="${escHtml(product.shortDesc)}">
<link rel="canonical" href="${wwwBase}/${product.slug}/">
<meta property="og:title" content="${escHtml(product.title)}">
<meta property="og:description" content="${escHtml(product.shortDesc)}">
<meta property="og:image" content="${mBase}${heroUrl}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="image" href="${heroPreloadHref}"${heroPreloadType} fetchpriority="high">
<link href="https://fonts.googleapis.com/css2?family=Catamaran:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--green:#81d742;--green-dark:#376a28;--green-soft:#f0fbe8;--orange:#cf4609;--orange-dark:#ad3605;--blue:#0693e3;--purple:#cf2aba;--cream:#fffdf8;--sand:#fff4ec;--white:#fff;--ink:#201c19;--muted:#665d55;--subtle:#877d75;--line:#e8ddd1;--star:#e49a00;--display:'Catamaran',system-ui,sans-serif;--sans:'Catamaran',system-ui,sans-serif;--shadow:0 22px 55px rgba(66,43,24,.12)}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:#f4eee7;color:var(--ink);font-family:var(--sans);padding-bottom:88px}
body,button,input{font-family:var(--sans)}
a{color:inherit;text-decoration:none}
button{color:inherit}
picture{display:contents}
img{max-width:100%}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
:focus-visible{outline:3px solid var(--blue);outline-offset:3px}
.page{max-width:1120px;margin:0 auto;background:var(--white);min-height:100vh;box-shadow:var(--shadow)}
.announcement{background:var(--green);color:var(--ink);text-align:center;padding:9px 16px;font-size:11px;font-weight:800;letter-spacing:.065em;text-transform:uppercase}
.site-header{height:76px;padding:8px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #3d3b39;background:#292826}
.site-header .logo img{display:block;height:53px;width:auto;max-width:220px}
.header-link{font-size:13px;font-weight:700;color:var(--green-dark);padding:10px;border-radius:10px}
.site-header .header-link{color:#fff}
.header-link svg{display:block;width:23px;height:23px}
.rating-stars{color:var(--star);letter-spacing:.08em}
.hero{display:grid}
.gallery{background:linear-gradient(180deg,#f1f1f1,#fff);min-width:0}
.gallery-stage{position:relative;overflow:hidden;touch-action:pan-y}
.gallery-main{display:block;width:100%;aspect-ratio:1/1;object-fit:cover}
.swipe-hint{position:absolute;right:14px;bottom:12px;background:rgba(32,28,25,.76);color:#fff;padding:6px 10px;border-radius:999px;font-size:11px;pointer-events:none}
.gallery-rating{display:flex;align-items:center;justify-content:center;padding:12px 16px 2px}
.gallery-thumbs{display:flex;gap:9px;padding:11px 16px 17px;overflow:auto}
.thumb{flex:0 0 auto;border:2px solid transparent;border-radius:13px;background:#fff;padding:0;cursor:pointer;overflow:hidden}
.thumb[aria-current=true]{border-color:var(--blue)}
.thumb img{display:block;width:62px;height:62px;object-fit:contain;background:#f3f3f3;padding:4px}
.hero-copy{padding:24px 20px 28px}
.rating-link{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#443d37;border-radius:8px}
.rating-link span:last-child{color:var(--muted);font-weight:600}
.eyebrow{margin-top:18px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--green-dark)}
h1{font-family:var(--display);font-size:clamp(34px,7vw,48px);line-height:1.02;font-weight:800;letter-spacing:-.025em;margin:10px 0 0}
.supporting{font-family:var(--display);font-size:24px;font-weight:700;line-height:1.15;color:var(--green-dark);margin:13px 0 0}
.hero-desc{font-size:15px;line-height:1.65;color:var(--muted);margin:13px 0 0;max-width:58ch}
.price{font-size:32px;font-weight:800;margin-top:20px;font-variant-numeric:tabular-nums}
.hero-checks{display:grid;gap:9px;margin:16px 0 0;padding:0;list-style:none}
.hero-checks li{display:flex;gap:9px;font-size:13px;line-height:1.45;color:#4f4740}
.hero-checks li::before{content:'✓';font-weight:900;color:var(--green-dark)}
.purchase-row{display:grid;grid-template-columns:118px 1fr;gap:10px;margin-top:20px}
.quantity{height:54px;display:grid;grid-template-columns:40px 38px 40px;border:1px solid #cfc3b7;border-radius:14px;overflow:hidden;background:#fff}
.qty-btn{border:0;background:#fff;font-size:21px;cursor:pointer}
.qty-value{display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;font-variant-numeric:tabular-nums}
.btn-primary{min-height:54px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:var(--orange);color:#fff;font-size:15px;font-weight:800;padding:14px 18px;box-shadow:0 12px 24px rgba(233,87,22,.22)}
.btn-primary:hover{background:var(--orange-dark)}
.btn-secondary{display:flex;align-items:center;justify-content:center;min-height:48px;margin-top:10px;border:1px solid #bcae9f;border-radius:14px;color:var(--ink);font-size:13px;font-weight:800;background:#fff}
.microcopy{text-align:center;color:var(--subtle);font-size:11.5px;line-height:1.5;margin:10px 0 0}
.benefit-bar{display:grid;grid-template-columns:repeat(2,1fr);border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--cream)}
.benefit{padding:17px 15px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}
.benefit:nth-child(2n){border-right:0}
.benefit:nth-last-child(-n+2){border-bottom:0}
.benefit strong{display:block;font-family:var(--display);font-size:18px;font-weight:800}
.benefit span{display:block;margin-top:4px;font-size:11.5px;line-height:1.45;color:var(--muted)}
.section{padding:52px 20px}
.section-alt{background-color:var(--cream);background-image:radial-gradient(circle at 8% 12%,rgba(233,87,22,.08) 0 5px,transparent 6px),radial-gradient(circle at 88% 20%,rgba(41,169,224,.08) 0 7px,transparent 8px),radial-gradient(circle at 76% 82%,rgba(170,27,204,.07) 0 5px,transparent 6px),radial-gradient(circle at 17% 77%,rgba(79,145,63,.08) 0 8px,transparent 9px);background-size:170px 170px,220px 220px,190px 190px,240px 240px}
.section-kicker{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--green-dark)}
.section-title{font-family:var(--display);font-size:clamp(30px,6vw,42px);font-weight:800;line-height:1.05;margin:9px 0 0}
.section-copy{font-size:14px;line-height:1.65;color:var(--muted);margin:12px 0 0;max-width:64ch}
.featured-quote{padding:38px 20px;background:linear-gradient(135deg,#81d742,#96f24c);color:var(--ink)}
.featured-quote .section-kicker{color:var(--ink)}
.featured-quote blockquote{font-family:var(--display);font-size:clamp(28px,6vw,40px);font-weight:700;line-height:1.15;margin:10px 0 0;max-width:26ch}
.featured-quote p{font-size:14px;line-height:1.65;margin:14px 0 0;max-width:68ch;color:rgba(32,28,25,.82)}
.quote-credit{font-size:12px;font-weight:800;margin-top:15px}
.help-grid{display:grid;gap:12px;margin-top:22px}
.help-card{padding:20px;border:1px solid var(--line);border-radius:20px;background:#fff}
.help-label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--green-dark)}
.help-card h3{font-family:var(--display);font-size:21px;font-weight:800;line-height:1.12;margin:7px 0 0}
.help-card p{font-size:12.5px;line-height:1.55;color:var(--muted);margin:8px 0 0}
.featured-grid{display:flex;gap:12px;margin:22px -20px 0;padding:0 20px 8px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:thin}
.item-tile{flex:0 0 72%;scroll-snap-align:start;border:1px solid #ddd;border-radius:18px;background:#fff;overflow:hidden}
.item-tile img{display:block;width:100%;aspect-ratio:1.15/1;object-fit:contain;background:#f2f2f2;padding:12px}
.item-tile-body{padding:12px}
.item-tile h3{font-size:13px;line-height:1.35;margin:0}
.item-tile p{font-size:11.5px;line-height:1.5;color:var(--muted);margin:6px 0 0}
.contents{margin-top:22px;border:1px solid var(--line);border-radius:20px;background:#fff;overflow:hidden}
.contents summary{cursor:pointer;padding:18px 20px;font-weight:800;font-size:14px;display:flex;justify-content:space-between;align-items:center;list-style:none}
.contents summary::-webkit-details-marker{display:none}
.contents summary::after{content:'+';font-size:24px;font-weight:400;color:var(--green-dark)}
.contents[open] summary::after{content:'−'}
.contents-inner{border-top:1px solid var(--line);padding:4px 18px 20px}
.content-group{padding-top:19px}
.content-group h3{font-family:var(--display);font-size:21px;font-weight:800;margin:0 0 8px}
.content-item{display:grid;grid-template-columns:58px 1fr;gap:11px;padding:11px 0;border-top:1px solid #eee6dd}
.content-item img{width:58px;height:58px;object-fit:contain;background:#fbfaf7;padding:4px;border-radius:12px}
.content-item h4{font-size:12.5px;margin:2px 0 0}
.content-item p{font-size:11.5px;line-height:1.5;color:var(--muted);margin:4px 0 0}
.optional-note{display:flex;gap:13px;align-items:center;margin-top:18px;padding:13px;border:1px solid rgba(223,208,188,.65);background:rgba(255,248,235,.55);border-radius:17px;font-size:12px;line-height:1.5;color:#74695f}
.optional-note img{width:58px;height:58px;object-fit:contain;border-radius:12px;background:#fff}
.optional-note a{font-weight:800;text-decoration:underline;text-underline-offset:3px;color:var(--green-dark)}
.faq-list{margin-top:19px;border-top:1px solid var(--line)}
.faq-item{border-bottom:1px solid var(--line)}
.faq-button{width:100%;border:0;background:transparent;padding:17px 2px;display:flex;align-items:center;justify-content:space-between;gap:16px;text-align:left;font-size:14px;font-weight:700;cursor:pointer}
.faq-icon{font-size:20px;color:var(--green-dark)}
.faq-answer{padding:0 2px 18px;font-size:13px;line-height:1.65;color:var(--muted)}
.reviews-section{background-color:#fff8eb;background-image:radial-gradient(circle at 10% 18%,rgba(233,87,22,.12) 0 7px,transparent 8px),radial-gradient(circle at 88% 14%,rgba(41,169,224,.12) 0 9px,transparent 10px),radial-gradient(circle at 80% 84%,rgba(170,27,204,.1) 0 7px,transparent 8px),radial-gradient(circle at 18% 80%,rgba(79,145,63,.12) 0 10px,transparent 11px);background-size:180px 180px,230px 230px,200px 200px,250px 250px}
.reviews-grid{display:flex;gap:12px;margin:20px -20px 0;padding:0 20px 8px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:thin}
.review{flex:0 0 82%;scroll-snap-align:start;border:1px solid var(--line);border-radius:18px;padding:17px;background:rgba(255,255,255,.92)}
.review h3{font-size:14px;margin:7px 0 0}
.review p{font-size:12.5px;line-height:1.6;color:var(--muted);margin:7px 0 0}
.review-author{font-size:11.5px;font-weight:800;color:#5e554e;margin-top:10px}
.final-cta{text-align:center;padding:48px 20px;background:var(--sand)}
.final-cta .btn-primary{max-width:360px;margin:20px auto 0}
.final-cta .microcopy{max-width:420px;margin:10px auto 0}
.shop-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:20px}
.shop-rail{display:flex;gap:12px;margin:20px -20px 0;padding:0 20px 8px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:thin}
.shop-rail .shop-card{flex:0 0 43%;scroll-snap-align:start}
.shop-card{border:1px solid var(--line);border-radius:17px;background:#fff;overflow:hidden}
.shop-card img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover}
.shop-card-body{padding:11px}
.shop-card h3{font-size:12.5px;line-height:1.35;margin:0}
.shop-card p{font-size:13px;font-weight:800;margin:5px 0 0}
.split-heading{font-family:var(--display);font-size:24px;font-weight:800;margin:30px 0 0}
.footer{padding:28px 20px 110px;background:#262421;color:#d4cec8;font-size:12px;line-height:1.7}
.footer strong{color:#fff;font-family:var(--display);font-size:20px;font-weight:800}
.footer-links{display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:12px}
.footer-links a{text-decoration:underline;text-underline-offset:3px}
.sticky{position:fixed;left:0;right:0;bottom:0;z-index:20;background:rgba(255,255,255,.97);border-top:1px solid var(--line);box-shadow:0 -10px 28px rgba(41,30,20,.12);padding:10px 12px calc(10px + env(safe-area-inset-bottom))}
.sticky-inner{max-width:680px;margin:0 auto;display:flex;align-items:center;gap:12px}
.sticky-meta{flex:1;min-width:0}
.sticky-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:var(--subtle)}
.sticky-price{font-size:20px;font-weight:800;margin-top:2px}
.sticky .btn-primary{min-height:50px;flex:0 0 58%;font-size:14px}
@media(min-width:680px){
  .hero{grid-template-columns:minmax(0,1.03fr) minmax(0,.97fr);align-items:start}
  .hero-copy{padding:48px 42px}
  .benefit-bar{grid-template-columns:repeat(4,1fr)}
  .benefit{border-bottom:0}
  .benefit:nth-child(2n){border-right:1px solid var(--line)}
  .benefit:last-child{border-right:0}
  .section{padding:72px 54px}
  .featured-quote{padding:58px 54px}
  .help-grid{grid-template-columns:repeat(4,1fr)}
  .featured-grid{display:grid;grid-template-columns:repeat(3,1fr);margin:22px 0 0;padding:0;overflow:visible}
  .item-tile{min-width:0}
  .reviews-grid{display:grid;grid-template-columns:repeat(3,1fr);margin:20px 0 0;padding:0;overflow:visible}
  .review{min-width:0}
  .shop-grid{grid-template-columns:repeat(3,1fr)}
  .shop-rail{display:grid;grid-template-columns:repeat(4,1fr);margin:20px 0 0;padding:0;overflow:visible}
  .shop-rail .shop-card{min-width:0}
  .footer{padding:36px 54px 120px}
}
@media(max-width:380px){
  .purchase-row{grid-template-columns:108px 1fr}
  .quantity{grid-template-columns:36px 36px 36px}
  .hero-copy{padding-left:16px;padding-right:16px}
}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
}
</style>
</head>
<body>
<div class="page">
  <div class="announcement">${escHtml(ui.announcement)}</div>
  <header class="site-header">
    <a class="header-link" href="${wwwBase}/shop/" aria-label="Browse all care packages">Shop</a>
    <a class="logo" href="${wwwBase}" aria-label="Rock The Treatment home">${picture(logo, { alt: 'Rock The Treatment', lazy: false })}</a>
    <a class="header-link" href="${wwwBase}/cart/" aria-label="View cart"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l2.3 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6M10 20h.01M18 20h.01"/></svg></a>
  </header>

  <main>
    <section class="hero" aria-labelledby="product-title">
      <div class="gallery" aria-label="Product gallery">
        <div class="gallery-stage" id="galleryStage" tabindex="0" aria-label="Use left and right arrow keys to browse product images">
          ${picture(heroUrl, { id: 'mainImg', cls: 'gallery-main', alt: product.title, priority: true, lazy: false, avifId: 'mainSrcAvif', webpId: 'mainSrcWebp' })}
          <span class="swipe-hint" id="swipeHint" aria-hidden="true">Swipe to explore</span>
        </div>
        <div class="gallery-rating"><a class="rating-link" href="${wwwBase}/${product.slug}/#reviews" data-track="rating_click"><span class="rating-stars" aria-hidden="true">★★★★★</span><span>${rating.toFixed(1)} · ${product.reviewCount} verified reviews</span></a></div>
        <div class="gallery-thumbs" id="galleryThumbs" aria-label="Choose a product image">
${galleryImages.map((gi, i) => `          <button class="thumb" type="button" data-index="${i}" aria-label="Show image ${i + 1} of ${galleryImages.length}" aria-current="${i === 0 ? 'true' : 'false'}">${picture(img(gi), { alt: '', lazy: i > 1 })}</button>`).join('\n')}
        </div>
      </div>

      <div class="hero-copy">
        <div class="eyebrow">${escHtml(ui.eyebrow || 'A ready-to-send comfort gift')}</div>
        <h1 id="product-title">${escHtml(product.title)}</h1>
        <p class="supporting">${escHtml(ui.supportingHeadline)}</p>
        <p class="hero-desc">${product.description}</p>
        <div class="price">${escHtml(product.price)}</div>
        <ul class="hero-checks">
          <li>Personal care, cozy essentials, familiar snacks, and quiet activities</li>
          <li>Free personal gift note added at checkout</li>
          <li>Processed and shipped from New York in 1–2 business days</li>
          <li>Shipping calculated at checkout; free on orders over $200</li>
        </ul>
        <div class="purchase-row">
          <div class="quantity" aria-label="Quantity">
            <button class="qty-btn" id="qtyDec" type="button" aria-label="Decrease quantity">−</button>
            <output class="qty-value" id="qtyValue" aria-live="polite">1</output>
            <button class="qty-btn" id="qtyInc" type="button" aria-label="Increase quantity">+</button>
          </div>
          <a class="btn-primary js-cart-btn" href="${cartUrl}" data-track="add_to_cart">Send This Gift</a>
        </div>
        <a class="btn-secondary" href="#inside" data-track="see_inside">See What’s Inside</a>
        <p class="microcopy">Secure checkout on RockTheTreatment.com · Delivery time varies by carrier and destination</p>
      </div>
    </section>

    <section class="benefit-bar" aria-label="Why choose this gift">
      <div class="benefit"><strong>${packagesSent.toLocaleString()}+ sent</strong><span>Care packages shipped by Rock The Treatment company-wide.</span></div>
      <div class="benefit"><strong>Chosen with purpose</strong><span>Personal care, cozy essentials, familiar snacks, and quiet activities.</span></div>
      <div class="benefit"><strong>Ready to send</strong><span>Ship it directly and add a personal note at checkout.</span></div>
      <div class="benefit"><strong>Packed by hand</strong><span>Prepared with care by the Rock The Treatment team.</span></div>
    </section>

${featuredReview ? `    <section class="featured-quote" aria-label="Featured customer review">
      <div class="section-kicker">Verified buyer story</div>
      <blockquote>“${escHtml(featuredReview.text)}”</blockquote>
      <div class="quote-credit">— ${escHtml(featuredReview.author)} · Verified Buyer</div>
    </section>` : ''}

    <section class="section section-alt" aria-labelledby="helps-title">
      <div class="section-kicker">Why Rock The Treatment</div>
      <h2 class="section-title" id="helps-title">${escHtml(ui.brandStoryTitle || 'Thoughtful support, without the guesswork')}</h2>
      <p class="section-copy">${escHtml(ui.brandStoryCopy || 'Useful essentials and uplifting comforts come together in one gift-ready package.')}</p>
      <div class="help-grid">
${ui.benefitGroups.map(group => `        <article class="help-card">
          <div class="help-label">${escHtml(group.label)}</div>
          <h3>${escHtml(group.title)}</h3>
          <p>${escHtml(group.desc)}</p>
        </article>`).join('\n')}
      </div>
    </section>

    <section class="section" id="inside" aria-labelledby="inside-title">
      <div class="section-kicker">What’s inside</div>
      <h2 class="section-title" id="inside-title">Packed with purpose</h2>
      <p class="section-copy">Swipe through a few highlights, then open the complete item list for full details.</p>
      <div class="featured-grid">
${featuredItems.map(item => `        <article class="item-tile">
          ${picture(itemImg(item.name), { alt: item.name })}
          <div class="item-tile-body"><h3>${escHtml(item.name)}</h3><p>${escHtml(item.desc)}</p></div>
        </article>`).join('\n')}
      </div>

      <details class="contents" data-track-open="full_contents">
        <summary>View the complete item list <span class="sr-only">grouped by category</span></summary>
        <div class="contents-inner">
${product.categories.map(cat => `          <section class="content-group">
            <h3>${escHtml(cat.name)}</h3>
${cat.items.map(item => `            <article class="content-item">
              ${picture(itemImg(item.name), { alt: item.name, width: 58, height: 58 })}
              <div><h4>${escHtml(item.name)}</h4><p>${escHtml(item.desc)}</p></div>
            </article>`).join('\n')}
          </section>`).join('\n')}
        </div>
      </details>
      <div class="optional-note">
        ${picture(celebrationImage, { alt: '', width: 58, height: 58 })}
        <div>${escHtml(ui.celebrationLabel)} <a href="${ui.celebrationUrl}" data-track="celebration_bell">Order it separately</a>.</div>
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="faq-title">
      <div class="section-kicker">Good to know</div>
      <h2 class="section-title" id="faq-title">Questions before you send it</h2>
      <div class="faq-list">
${faqItems.map((faq, i) => `        <div class="faq-item">
          <h3 style="margin:0"><button class="faq-button" type="button" id="faq-button-${i}" aria-expanded="false" aria-controls="faq-answer-${i}"><span>${escHtml(faq.q)}</span><span class="faq-icon" aria-hidden="true">+</span></button></h3>
          <div class="faq-answer" id="faq-answer-${i}" role="region" aria-labelledby="faq-button-${i}" hidden>${escHtml(faq.a)}</div>
        </div>`).join('\n')}
      </div>
    </section>

    <section class="section reviews-section" id="reviews" aria-labelledby="reviews-title">
      <div class="section-kicker">${product.reviewCount} verified reviews</div>
      <h2 class="section-title" id="reviews-title">Our fan club</h2>
      <p class="section-copy">Real notes from people who sent care at the right time.</p>
      <div class="reviews-grid">
${product.reviews.map(review => `        <article class="review">
          <div class="rating-stars" aria-label="${review.stars} out of 5 stars">${stars(review.stars)}</div>
          <h3>${escHtml(review.title)}</h3>
          <p>${escHtml(review.text)}</p>
          <div class="review-author">— ${escHtml(review.author)} · Verified Buyer · ${escHtml(review.date)}</div>
        </article>`).join('\n')}
      </div>
      <p style="margin:18px 0 0"><a class="header-link" href="${wwwBase}/${product.slug}/#reviews">Read all reviews on RockTheTreatment.com →</a></p>
    </section>

    <section class="final-cta" aria-labelledby="final-title">
      <div class="section-kicker">Send care with confidence</div>
      <h2 class="section-title" id="final-title">${escHtml(ui.finalHeadline || ui.supportingHeadline)}</h2>
      <p class="section-copy" style="margin-left:auto;margin-right:auto">A gift-ready care package, hand-packed in New York and ready for your personal note.</p>
      <a class="btn-primary js-cart-btn" href="${cartUrl}" data-track="add_to_cart_final">Send This Gift · ${escHtml(product.price)}</a>
      <p class="microcopy">Free gift note at checkout · Shipping calculated at checkout · 180-day unopened return policy</p>
    </section>

    <section class="section section-alt" aria-labelledby="more-title">
      <div class="section-kicker">More ways to show up</div>
      <h2 class="section-title" id="more-title">Other sizes and optional gifts</h2>
      <h3 class="split-heading">Choose another size</h3>
      <div class="shop-grid">
${product.relatedProducts.map(rp => {
  const rpSlug = rp.url.replace(/^\//, '').replace(/\/$/, '');
  const rpMatch = products.find(p => p.slug === rpSlug);
  const href = rpMatch ? `./${rpSlug}.html` : `${wwwBase}${rp.url}`;
  const relatedPrice = rpMatch ? ((rpMatch.mobileUi && rpMatch.mobileUi.displayPrice) || rpMatch.price) : rp.price;
  return `        <a class="shop-card" href="${href}">
          ${picture(img(rp.image), { alt: rp.name })}
          <div class="shop-card-body"><h3>${escHtml(rp.name)}</h3><p>${escHtml(relatedPrice)}</p></div>
        </a>`;
}).join('\n')}
      </div>
      <h3 class="split-heading">Optional gifts</h3>
      <div class="shop-rail" aria-label="Optional gifts">
${relatedAddOns.map(item => `        <a class="shop-card" href="${wwwBase}${item.url}">
          ${picture(img(item.image), { alt: item.name })}
          <div class="shop-card-body"><h3>${escHtml(item.name)}</h3></div>
        </a>`).join('\n')}
      </div>
    </section>
  </main>

  <footer class="footer">
    <strong>Rock The Treatment</strong>
    <div>516-690-7009 · <a href="mailto:info@rockthetreatment.com">info@rockthetreatment.com</a></div>
    <div>325 Marcus Blvd Suite A, Deer Park, NY 11729</div>
    <nav class="footer-links" aria-label="Footer">
      <a href="${wwwBase}/shipping-return/">Shipping &amp; Returns</a>
      <a href="${wwwBase}/faqs/">FAQs</a>
      <a href="${wwwBase}/contact/">Contact</a>
      <a href="${wwwBase}/about-us/">About</a>
    </nav>
  </footer>
</div>

<aside class="sticky" aria-label="Purchase">
  <div class="sticky-inner">
    <div class="sticky-meta"><div class="sticky-label">${escHtml(ui.stickyLabel || product.title)} · Qty <span id="stickyQty">1</span></div><div class="sticky-price">${escHtml(product.price)}</div></div>
    <a class="btn-primary js-cart-btn" href="${cartUrl}" data-track="add_to_cart_sticky">Send This Gift</a>
  </div>
</aside>

<script>
(function(){
  var gallery = ${JSON.stringify(galleryVariants)};
  var stage = document.getElementById('galleryStage');
  var main = document.getElementById('mainImg');
  var avif = document.getElementById('mainSrcAvif');
  var webp = document.getElementById('mainSrcWebp');
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('.thumb'));
  var hint = document.getElementById('swipeHint');
  var current = 0;
  var startX = 0;
  var deltaX = 0;

  function track(eventName, detail) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({event:eventName, product_id:${product.id}, product_name:${JSON.stringify(product.title)}}, detail || {}));
  }
  function showImage(index) {
    if (!gallery.length) return;
    current = (index + gallery.length) % gallery.length;
    var image = gallery[current];
    if (avif) avif.srcset = image.a || '';
    if (webp) webp.srcset = image.w || '';
    main.src = image.f;
    thumbs.forEach(function(thumb, i){ thumb.setAttribute('aria-current', i === current ? 'true' : 'false'); });
    if (hint) hint.hidden = true;
    track('product_gallery_view', {image_index:current + 1});
  }
  thumbs.forEach(function(thumb, i){ thumb.addEventListener('click', function(){ showImage(i); }); });
  stage.addEventListener('keydown', function(event){
    if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showImage(current + 1); }
  });
  stage.addEventListener('touchstart', function(event){ startX = event.touches[0].clientX; deltaX = 0; }, {passive:true});
  stage.addEventListener('touchmove', function(event){ deltaX = event.touches[0].clientX - startX; }, {passive:true});
  stage.addEventListener('touchend', function(){ if (Math.abs(deltaX) > 42) showImage(current + (deltaX < 0 ? 1 : -1)); });

  var quantity = 1;
  var qtyValue = document.getElementById('qtyValue');
  var stickyQty = document.getElementById('stickyQty');
  var cartButtons = Array.prototype.slice.call(document.querySelectorAll('.js-cart-btn'));
  function syncQuantity() {
    qtyValue.textContent = quantity;
    stickyQty.textContent = quantity;
    cartButtons.forEach(function(button){ button.href = ${JSON.stringify(`${wwwBase}/?add-to-cart=${product.id}`)} + '&quantity=' + quantity; });
  }
  document.getElementById('qtyDec').addEventListener('click', function(){ quantity = Math.max(1, quantity - 1); syncQuantity(); });
  document.getElementById('qtyInc').addEventListener('click', function(){ quantity += 1; syncQuantity(); });
  cartButtons.forEach(function(button){ button.addEventListener('click', function(){ track(button.dataset.track || 'add_to_cart', {quantity:quantity, value:${Number(product.price.replace('$', ''))}}); }); });

  document.querySelectorAll('.faq-button').forEach(function(button){
    button.addEventListener('click', function(){
      var answer = document.getElementById(button.getAttribute('aria-controls'));
      var expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      button.querySelector('.faq-icon').textContent = expanded ? '+' : '−';
      answer.hidden = expanded;
      if (!expanded) track('faq_open', {question:button.textContent.trim().replace(/[+−]$/, '').trim()});
    });
  });
  document.querySelectorAll('details[data-track-open]').forEach(function(details){
    details.addEventListener('toggle', function(){ if (details.open) track(details.dataset.trackOpen); });
  });
  document.querySelectorAll('[data-track]').forEach(function(link){
    if (link.classList.contains('js-cart-btn')) return;
    link.addEventListener('click', function(){ track(link.dataset.track); });
  });
  track('view_item', {value:${Number(product.price.replace('$', ''))}});
})();
</script>
</body>
</html>`;
}

function generatePage(product) {
  if (product.mobileUi && product.mobileUi.croMaster) {
    return generateWomensCroPage(product);
  }
  const isRadiation = product.slug.includes('radiation');
  const ui = product.mobileUi || {};
  const faqList = isRadiation ? radiationFaqs : faqs;
  const totalItems = product.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const cartUrl = `${wwwBase}/?add-to-cart=${product.id}`;
  const freeShipping = parseFloat(product.price.replace('$','')) >= 200;
  const heroUrl = img(product.heroImage);
  const displayPrice = ui.displayPrice || product.price;
  const leadReview = product.reviews[0];
  const galleryImages = ui.galleryImages || product.galleryImages;
  const galleryReviewText = `${leadReview ? `${leadReview.stars.toFixed(1)} · ` : ''}${product.reviewCount} reviews`;
  const insideKicker = ui.insideKicker || 'Inside the package';
  const insideTitle = ui.insideTitle || "What she'll open";
  const insideCopy = ui.insideCopy || `${product.itemCount} comforting items selected to soothe, encourage, and make treatment days feel a little gentler.`;
  const announcementHtml = ui.announcement ? `  <div class="topbar announcement-bar">${escHtml(ui.announcement)}</div>\n` : '';
  const galleryReviewRowHtml = ui.showGalleryReviewRow ? `  <div class="gallery-review-row">
    <div class="gallery-review-stars">${stars(5)}</div>
    <div class="gallery-review-copy">${escHtml(galleryReviewText)}</div>
  </div>
` : '';
  const trustInBoxBadgeHtml = ui.removeInBoxBadge ? '' : `      <div class="trust-badge"><span class="icon">In the box</span>${product.itemCount} practical, comforting essentials</div>
`;
  const giftLinkHtml = ui.giftLinkUrl ? `        <br><a class="gift-link" href="${ui.giftLinkUrl}">${escHtml(ui.giftLinkLabel || 'Learn more')}</a>` : '';
  const reviewSummaryHtml = ui.hideReviewSummary ? '' : `    <div class="review-summary">
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
`;
  const insidePreviewItems = (ui.insidePreviewItems || []).map(name => ({
    name,
    src: itemImg(name),
    desc: ''
  }));
  const insidePreviewHtml = insidePreviewItems.length ? `  <div class="inside-preview-rail">
${insidePreviewItems.map(item => `    <div class="inside-preview-card">
      ${picture(item.src, { alt: item.name })}
      <div class="label">${escHtml(item.name)}</div>
    </div>`).join('\n')}
  </div>
` : '';
  // Preload the smallest hero variant the browser can use (AVIF if present).
  const heroV = variants(heroUrl);
  const heroPreloadHref = heroV && heroV.avif ? heroV.avif : heroUrl;
  const heroPreloadType = heroV && heroV.avif ? ' type="image/avif"' : '';
  // Per-gallery-image variant URLs, consumed by the swipe-gallery JS below.
  const galleryVariants = galleryImages.map(gi => {
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
:root{--green:#5ba346;--green-dark:#417c31;--orange:#ff6319;--orange-dark:#de5310;--text:#1f1a17;--text-light:#60564f;--text-muted:#8d8279;--bg:#fffdf9;--bg-alt:#f8f2eb;--bg-soft:#f4ece3;--bg-warm:#fff5e7;--border:#eadfce;--shadow:0 18px 40px rgba(67,39,18,.12);--serif:'DM Serif Display',Georgia,serif;--sans:'Inter',system-ui,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:linear-gradient(180deg,#f7efe6 0%,#f3f0eb 18%,#efe8de 100%);color:var(--text);padding:0 0 92px}
a{text-decoration:none;color:inherit}
picture{display:contents}

.page-wrapper{max-width:480px;margin:0 auto;background:var(--bg);min-height:100vh}
@media(min-width:481px){.page-wrapper{margin:18px auto 110px;border-radius:28px;overflow:hidden;box-shadow:var(--shadow)}}

.topbar{background:linear-gradient(135deg,var(--green-dark),var(--green));padding:10px 16px;display:flex;justify-content:space-between;align-items:center;color:#fff;font-size:13px;letter-spacing:.02em}
.topbar.announcement-bar{justify-content:center;padding:9px 16px;background:linear-gradient(135deg,#ff7a1a,#ff5a14);font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
.topbar .icons{display:flex;gap:16px}
.topbar .menu-btn{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0;line-height:1;display:flex;align-items:center}
.ham-menu{display:none;background:var(--green);flex-direction:column;border-top:1px solid rgba(255,255,255,.2)}
.ham-menu.open{display:flex}
.ham-menu a{color:#fff;text-decoration:none;padding:14px 20px;font-size:15px;font-weight:500;border-bottom:1px solid rgba(255,255,255,.15)}
.ham-menu a:last-child{border-bottom:none}
.header{text-align:center;padding:16px 16px 14px;border-bottom:1px solid rgba(234,223,206,.7);background:rgba(255,253,249,.92);backdrop-filter:blur(8px)}
.header img{height:34px}
.header.header-dark{background:linear-gradient(180deg,#545861,#2e3138);border-bottom:none;padding:16px 16px 14px}
.header.header-dark img{height:52px;filter:drop-shadow(0 8px 20px rgba(0,0,0,.28))}

.social-proof-banner{background:var(--bg-warm);padding:11px 16px;text-align:center;font-size:12px;font-weight:600;color:var(--text-light);border-bottom:1px solid #f1d9b5}
.social-proof-banner strong{color:var(--text)}

.gallery-main{width:100%;display:block}
.gallery-thumbs{display:flex;gap:8px;padding:10px 14px 0;overflow-x:auto;background:linear-gradient(180deg,var(--bg-soft),transparent)}
.gallery-thumbs img{width:64px;height:64px;object-fit:cover;border-radius:16px;border:2px solid transparent;cursor:pointer;flex-shrink:0;box-shadow:0 10px 18px rgba(80,57,37,.1)}
.gallery-thumbs img.active{border-color:var(--green)}
.gallery-review-row{display:flex;align-items:center;gap:8px;padding:12px 16px 0;background:linear-gradient(180deg,var(--bg-soft),transparent)}
.gallery-review-stars{font-size:14px;color:#f59e0b;letter-spacing:.08em}
.gallery-review-copy{font-size:14px;font-weight:600;color:var(--text)}

.product-info{padding:18px 20px 22px}
.eyebrow{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:var(--bg-soft);color:var(--green-dark);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.eyebrow::before{content:'';width:7px;height:7px;border-radius:50%;background:var(--orange)}
.product-title{font-family:var(--serif);font-size:34px;font-weight:400;line-height:1.05;color:var(--text);margin-top:14px;letter-spacing:-.02em}
.product-subtitle{font-size:14px;line-height:1.65;color:var(--text-light);margin-top:12px;max-width:34ch}
.hero-highlights{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.hero-highlights span{padding:8px 11px;border-radius:999px;background:#fff;border:1px solid var(--border);font-size:11px;font-weight:600;color:var(--text-light)}
.price-row{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-top:18px}
.product-price{font-size:30px;font-weight:700;color:var(--text);font-variant-numeric:tabular-nums}
.price-note{font-size:12px;color:var(--text-muted);text-align:right;line-height:1.4}
.qty-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;padding:12px 14px;border:1px solid var(--border);background:#fff;border-radius:18px}
.qty-label{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted)}
.qty-controls{display:flex;align-items:center;gap:8px}
.qty-btn{width:40px;height:40px;border:1px solid var(--border);background:var(--bg-alt);border-radius:12px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text)}
.qty-input{width:46px;height:40px;border:1px solid var(--border);text-align:center;font-size:15px;border-radius:12px;font-family:var(--sans);background:#fff}
.cta-stack{margin-top:14px;display:grid;gap:10px}

.btn-cart,.sticky-btn{display:flex;align-items:center;justify-content:center;width:100%;padding:16px;border:none;border-radius:16px;font-family:var(--sans);font-weight:800;font-size:15px;background:linear-gradient(135deg,var(--orange),#ff7f3a);color:#fff;cursor:pointer;text-transform:uppercase;letter-spacing:.08em;box-shadow:0 14px 28px rgba(255,99,25,.24);text-align:center}
.btn-cart:hover{background:var(--orange-dark)}
.btn-secondary{display:flex;align-items:center;justify-content:center;width:100%;padding:14px 16px;border-radius:16px;border:1px solid var(--border);background:#fff;color:var(--text);font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}

.urgency{font-size:12px;font-weight:700;color:var(--green-dark);text-align:center;margin-top:2px}
.shipping-note{font-size:11px;color:var(--text-muted);margin-top:2px;text-align:center}
.reassurance-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}
.reassurance-card{padding:10px 8px;border-radius:14px;background:var(--bg-alt);border:1px solid var(--border);text-align:center}
.reassurance-card strong{display:block;font-size:11px;color:var(--text);margin-bottom:3px}
.reassurance-card span{display:block;font-size:11px;line-height:1.35;color:var(--text-muted)}

.trust-badges{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:16px 0 0;margin-top:16px;border-top:1px solid rgba(234,223,206,.85)}
.trust-badge{font-size:12px;font-weight:600;color:var(--text-light);text-align:left;padding:12px;border-radius:16px;background:#fff;border:1px solid var(--border)}
.trust-badge .icon{display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--green-dark);margin-bottom:5px}

.free-gift-callout{background:linear-gradient(135deg,var(--bg-warm),#fff);border:1px solid #f2d9b4;border-radius:18px;padding:14px 15px;margin-top:16px;display:flex;align-items:center;gap:12px}
.free-gift-callout img{width:54px;height:54px;border-radius:14px;object-fit:cover;box-shadow:0 10px 20px rgba(88,64,35,.12)}
.free-gift-callout .text{font-size:12px;line-height:1.55;color:#5b5046}
.free-gift-callout .text strong{color:var(--orange)}
.free-gift-callout.soft{background:rgba(255,245,231,.24);border-color:rgba(242,217,180,.45)}
.free-gift-callout.soft .text{color:rgba(91,80,70,.78)}
.free-gift-callout .gift-link{display:inline-block;margin-top:6px;color:var(--green-dark);font-weight:700;text-decoration:underline;text-underline-offset:2px}

.product-desc{font-size:14px;line-height:1.7;color:var(--text-light);margin-top:16px;padding:16px;border:1px solid var(--border);border-radius:18px;background:#fff}
.product-desc strong{color:var(--text)}

.gift-note{margin-top:14px;padding:14px;background:var(--bg-alt);border-radius:18px;border:1px solid var(--border)}
.gift-note label{font-size:13px;font-weight:600;display:block;margin-bottom:6px}
.gift-note textarea{width:100%;height:72px;border:1px solid var(--border);border-radius:14px;padding:10px 12px;font-family:var(--sans);font-size:13px;resize:none;background:#fff}

.featured-review{margin:0 20px 22px;padding:20px;border-radius:24px;background:linear-gradient(135deg,#fff7ef,#f6ede4);border:1px solid #eed9c0}
.featured-review .section-kicker,.inside-intro .section-kicker,.related-section .section-kicker,.reviews-section .section-kicker,.faq-section .section-kicker,.upsell-section .section-kicker{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--green-dark)}
.featured-review blockquote{font-family:var(--serif);font-size:25px;line-height:1.15;color:var(--text);margin-top:10px}
.featured-review p{font-size:14px;line-height:1.65;color:var(--text-light);margin-top:10px}
.featured-review .review-credit{margin-top:12px;font-size:12px;font-weight:700;color:var(--text)}
.featured-review .review-credit span{color:var(--text-muted);font-weight:600}

.inside-intro,.related-section,.faq-section,.upsell-section,.reviews-section{padding:24px 16px 0;border-top:4px solid var(--border)}
.inside-intro{padding:26px 20px 4px}
.section-title{font-family:var(--serif);font-size:26px;line-height:1.05;margin-top:10px;margin-bottom:10px;color:var(--text)}
.section-copy{font-size:14px;line-height:1.65;color:var(--text-light);max-width:36ch}
.inside-preview-rail{display:flex;gap:12px;padding:10px 20px 2px;overflow-x:auto}
.inside-preview-card{flex:0 0 120px;padding:10px;border-radius:18px;border:1px solid var(--border);background:#fff;box-shadow:0 10px 22px rgba(64,46,28,.06)}
.inside-preview-card img{width:100%;height:100px;object-fit:cover;border-radius:14px}
.inside-preview-card .label{font-size:12px;font-weight:700;line-height:1.35;color:var(--text);margin-top:8px}
.related-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.related-card{border:1px solid var(--border);border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 10px 22px rgba(64,46,28,.06)}
.related-card img{width:100%;aspect-ratio:1/1;object-fit:cover}
.related-card .info{padding:10px}
.related-card .name{font-size:13px;font-weight:500;line-height:1.3;margin-bottom:6px}
.related-card .price{font-size:15px;font-weight:700}

.value-props{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 20px 4px}
.value-prop{padding:18px 14px;text-align:left;border:1px solid var(--border);border-radius:18px;background:#fff}
.value-prop:nth-child(2n){border-right:none}
.value-prop .vp-icon{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--green-dark);margin-bottom:8px}
.value-prop .vp-title{font-family:var(--serif);font-size:18px;line-height:1.1;margin-bottom:6px}
.value-prop .vp-desc{font-size:12px;color:var(--text-muted);line-height:1.5}

.green-banner{margin:24px 20px 0;padding:28px 20px;border-radius:28px;background:linear-gradient(135deg,var(--green-dark),var(--green));text-align:center;color:#fff;box-shadow:0 18px 36px rgba(62,120,46,.24)}
.green-banner h3{font-family:var(--serif);font-size:28px;font-weight:400;line-height:1.08}
.green-banner p{font-size:14px;opacity:.92;margin-top:10px}

.breakdown-section{padding:0}
.category-header{background:var(--bg-alt);padding:18px 20px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-top:18px}
.category-header h3{font-family:var(--serif);font-size:18px;color:var(--text)}
.item-card{display:flex;gap:12px;padding:14px 20px;border-bottom:1px solid #f2ece4}
.item-card img{width:74px;height:74px;object-fit:cover;border-radius:18px;flex-shrink:0}
.item-card .item-info{flex:1}
.item-card .item-name{font-size:14px;font-weight:700;margin-bottom:4px;color:var(--text)}
.item-card .item-desc{font-size:12px;line-height:1.55;color:var(--text-light);display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}

.faq-item{border-bottom:1px solid var(--border);padding:14px 0;cursor:pointer;user-select:none}
.faq-item .faq-header{display:flex;justify-content:space-between;align-items:center}
.faq-item .q{font-size:14px;font-weight:600;flex:1;padding-right:12px}
.faq-item .chev{color:var(--text-muted);font-size:12px;transition:transform .25s ease}
.faq-item.open .chev{transform:rotate(180deg)}
.faq-item .faq-answer{max-height:0;overflow:hidden;transition:max-height .3s ease,padding .3s ease;font-size:13px;line-height:1.6;color:var(--text-light)}
.faq-item.open .faq-answer{max-height:300px;padding-top:10px}

.gallery-main{width:100%;display:block;touch-action:pan-y;position:relative;overflow:hidden}
.gallery-swipe-hint{position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.5);color:#fff;font-size:10px;padding:3px 8px;border-radius:10px;pointer-events:none;opacity:1;transition:opacity .5s}
.gallery-wrap{position:relative;overflow:hidden;touch-action:pan-y;background:linear-gradient(180deg,var(--bg-soft),#fff);padding:0 14px}

.upsell-section{background:var(--bg-alt);padding-bottom:24px}
.upsell-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.upsell-card{background:#fff;border-radius:16px;overflow:hidden;border:1px solid var(--border);text-align:center}
.upsell-card img{width:100%;aspect-ratio:1/1;object-fit:cover}
.upsell-card .uname{font-size:11px;font-weight:500;padding:6px 6px 8px;line-height:1.3}

.reviews-section{padding-bottom:28px}
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
.review-card{background:var(--bg-alt);border-radius:18px;padding:14px;margin-bottom:10px;border:1px solid var(--border)}
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
.sticky-cart{position:fixed;left:0;right:0;bottom:0;z-index:20;padding:12px 14px calc(12px + env(safe-area-inset-bottom));background:rgba(255,253,249,.96);backdrop-filter:blur(14px);border-top:1px solid rgba(234,223,206,.95);box-shadow:0 -12px 24px rgba(44,30,14,.08)}
.sticky-cart .sticky-inner{max-width:480px;margin:0 auto;display:flex;align-items:center;gap:12px}
.sticky-cart .sticky-meta{min-width:0;flex:1}
.sticky-cart .sticky-label{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted)}
.sticky-cart .sticky-price{font-size:20px;font-weight:800;color:var(--text);margin-top:2px}
.sticky-btn{flex:0 0 58%;padding:15px 16px;font-size:14px}
@media(min-width:481px){.sticky-cart{left:50%;right:auto;transform:translateX(-50%);width:480px;border-radius:22px;bottom:18px;border:1px solid rgba(234,223,206,.95)}}
</style>
</head>
<body>

<div class="page-wrapper">

  <!-- HEADER -->
${announcementHtml}  <div class="topbar">
    <button class="menu-btn" id="menuBtn" aria-label="Menu" aria-expanded="false" aria-controls="hamMenu">☰</button>
    <div class="icons">
      <a href="https://www.rockthetreatment.com/cart/" style="color:#fff;">🛒</a>
    </div>
  </div>
  <div class="ham-menu" id="hamMenu" role="navigation" aria-label="Site navigation">
    <a href="https://www.rockthetreatment.com/shop/">Shop</a>
    <a href="https://www.rockthetreatment.com/about/">About</a>
    <a href="https://www.rockthetreatment.com/info/">Info</a>
    <a href="https://www.rockthetreatment.com/blog/">Blog</a>
    <a href="https://www.rockthetreatment.com/contact/">Contact</a>
  </div>
  <div class="header${ui.darkHeader ? ' header-dark' : ''}">
    <a href="https://www.rockthetreatment.com">${picture(logo, { alt: 'Rock The Treatment', lazy: false })}</a>
  </div>

  <!-- SOCIAL PROOF BANNER -->
  <div class="social-proof-banner">
    <strong>${product.totalSales.toLocaleString()} packages sent</strong> with a 5-star average from real customers
  </div>

  <!-- PRODUCT GALLERY (swipeable) -->
  <div class="gallery-wrap" id="galleryWrap">
    ${picture(heroUrl, { id: 'mainImg', cls: 'gallery-main', alt: product.title, priority: true, lazy: false, avifId: 'mainSrcAvif', webpId: 'mainSrcWebp' })}
    <span class="gallery-swipe-hint" id="swipeHint">← swipe →</span>
  </div>
  <div class="gallery-thumbs" id="galleryThumbs">
${galleryImages.map((gi, i) => '    ' + picture(img(gi), { alt: product.title, cls: i === 0 ? 'active' : '', lazy: false, extra: `data-index="${i}"` })).join('\n')}
  </div>
${galleryReviewRowHtml}

  <!-- PRODUCT INFO -->
  <div class="product-info">
    <div class="eyebrow">Ready-to-send comfort gift</div>
    <h1 class="product-title">${escHtml(product.title)}</h1>
    <p class="product-subtitle">${escHtml(product.shortDesc)}</p>
    <div class="hero-highlights">
      <span>Gift note included</span>
      <span>Hand-packed in New York</span>
      <span>Curated for comfort</span>
    </div>
    <div class="price-row">
      <div class="product-price">${displayPrice}</div>
      <div class="price-note">${freeShipping ? 'Free shipping included' : 'Free shipping over $200'}<br>Secure checkout on rockthetreatment.com</div>
    </div>
    <div class="qty-row">
      <div class="qty-label">Quantity</div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="var i=document.getElementById('qty');i.value=Math.max(1,+i.value-1)">−</button>
        <input class="qty-input" id="qty" value="1" readonly>
        <button class="qty-btn" onclick="var i=document.getElementById('qty');i.value=+i.value+1">+</button>
      </div>
    </div>
    <div class="cta-stack">
      <a href="${cartUrl}" class="btn-cart js-cart-btn">Send This Gift</a>
      <a href="#inside" class="btn-secondary">See What's Inside</a>
      <div class="urgency">Orders placed before 2pm ship same day</div>
      <div class="shipping-note">${freeShipping ? 'Free shipping on this order' : 'Free shipping on orders over $200'}</div>
    </div>
    <div class="reassurance-row">
      <div class="reassurance-card"><strong>Fast</strong><span>Ships in 1-2 business days</span></div>
      <div class="reassurance-card"><strong>Easy</strong><span>Gift-ready and simple to send</span></div>
      <div class="reassurance-card"><strong>Thoughtful</strong><span>Curated essentials, not filler</span></div>
    </div>

    <!-- TRUST BADGES -->
    <div class="trust-badges">
      <div class="trust-badge"><span class="icon">Checkout</span>Secure purchase on the main RTT store</div>
${trustInBoxBadgeHtml}
      <div class="trust-badge"><span class="icon">Support</span>A personal gift note can be added at checkout</div>
      <div class="trust-badge"><span class="icon">Service</span>Real humans ready to help if you need guidance</div>
    </div>

    <!-- FREE GIFT CALLOUT -->
    <div class="free-gift-callout${ui.softGiftCallout ? ' soft' : ''}">
      ${picture(bellImg, { alt: 'Celebration Bell', width: 50, height: 50 })}
      <div class="text">
        <strong>Complimentary extra:</strong> Every purchase includes access to RTT's end-of-treatment celebration gift at no charge.
${giftLinkHtml}
      </div>
    </div>

    <!-- DESCRIPTION -->
    <div class="product-desc">
      ${product.description}
    </div>

    <!-- GIFT NOTE -->
    <div class="gift-note">
      <label>Add a gift note</label>
      <textarea placeholder="Write a personal message for the recipient..."></textarea>
    </div>
  </div>

${leadReview ? `  <div class="featured-review">
    <div class="section-kicker">Why it lands</div>
    <blockquote>"${escHtml(leadReview.title)}"</blockquote>
    <p>${escHtml(leadReview.text)}</p>
    <div class="review-credit">${escHtml(leadReview.author)} <span>Verified buyer</span></div>
  </div>` : ''}

  <!-- VALUE PROPS -->
  <div class="value-props">
    <div class="value-prop"><div class="vp-icon">Curated</div><div class="vp-title">Built to feel useful</div><div class="vp-desc">Each item is chosen to bring comfort, distraction, and practical support.</div></div>
    <div class="value-prop"><div class="vp-icon">Gift-ready</div><div class="vp-title">Easy to send well</div><div class="vp-desc">No guesswork, no extra wrapping, just a thoughtful package that arrives ready to open.</div></div>
    <div class="value-prop"><div class="vp-icon">Trusted</div><div class="vp-title">Backed by real buyers</div><div class="vp-desc">Thousands of families have relied on RTT when they wanted to show up with care.</div></div>
    <div class="value-prop"><div class="vp-icon">Mission-led</div><div class="vp-title">Made by people who care</div><div class="vp-desc">Every order supports a brand built around comfort, encouragement, and community.</div></div>
  </div>

  <!-- GREEN BANNER -->
  <div class="green-banner">
    <h3>Nurturing Strength.<br>Uplifting Spirits.</h3>
    <p>Nourish the Body. Focus the Mind.</p>
  </div>

  <div class="inside-intro" id="inside">
    <div class="section-kicker">${escHtml(insideKicker)}</div>
    <div class="section-title">${escHtml(insideTitle)}</div>
    <div class="section-copy">${escHtml(insideCopy)}</div>
  </div>
${insidePreviewHtml}

  <!-- PRODUCT BREAKDOWN -->
${product.categories.map(cat => `  <div class="category-header"><h3>${escHtml(cat.name)}</h3></div>
${cat.items.map(item => `  <div class="item-card">
    ${picture(itemImg(item.name), { alt: item.name, width: 70, height: 70 })}
    <div class="item-info">
      <div class="item-name">${escHtml(item.name)}</div>
      <div class="item-desc">${escHtml(item.desc)}</div>
    </div>
  </div>`).join('\n')}`).join('\n')}

  <!-- RELATED PRODUCTS -->
  <div class="related-section">
    <div class="section-kicker">More options</div>
    <div class="section-title">Explore other care packages</div>
    <div class="section-copy">Prefer a different size or a different kind of support? Start here.</div>
    <div class="related-grid" style="margin-top:16px;">
${product.relatedProducts.map(rp => {
  const rpSlug = rp.url.replace(/^\//, '').replace(/\/$/, '');
  const rpMatch = products.find(p => p.slug === rpSlug);
  const rpHref = rpMatch ? `./${rpSlug}.html` : `https://www.rockthetreatment.com${rp.url}`;
  const relatedPrice = rpMatch ? ((rpMatch.mobileUi && rpMatch.mobileUi.displayPrice) || rpMatch.price) : rp.price;
  return `      <a href="${rpHref}" class="related-card">
        ${picture(img(rp.image), { alt: rp.name, onerror: "this.closest('.related-card,.upsell-card')?.remove()" })}
        <div class="info">
          <div class="name">${escHtml(rp.name)}</div>
          <div class="price">${relatedPrice}</div>
        </div>
      </a>`;
}).join('\n')}
    </div>
  </div>

  <!-- FAQs -->
  <div class="faq-section">
    <div class="section-kicker">Questions</div>
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
    <div class="section-kicker">Optional add-ons</div>
    <div class="section-title" style="font-size:24px;margin-bottom:14px;">Add even more support</div>
    <div class="upsell-grid">
${upsellProducts.map(up => `      <a href="https://www.rockthetreatment.com${up.url}" class="upsell-card">
        ${picture(img(up.image), { alt: up.name, onerror: "this.closest('.related-card,.upsell-card')?.remove()" })}
        <div class="uname">${escHtml(up.name)}</div>
      </a>`).join('\n')}
    </div>
  </div>

  <!-- REVIEWS -->
  <div class="reviews-section">
    <div class="section-kicker">Social proof</div>
    <div class="section-title">What customers say</div>
${reviewSummaryHtml}
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

<div class="sticky-cart">
  <div class="sticky-inner">
    <div class="sticky-meta">
      <div class="sticky-label">${escHtml(product.title)}</div>
      <div class="sticky-price">${displayPrice}</div>
    </div>
    <a href="${cartUrl}" class="sticky-btn js-cart-btn">Send This Gift</a>
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

  // Hamburger menu toggle
  var menuBtn = document.getElementById('menuBtn');
  var hamMenu = document.getElementById('hamMenu');
  if (menuBtn && hamMenu) {
    menuBtn.addEventListener('click', function(){
      var open = hamMenu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close when a nav link is tapped
    hamMenu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ hamMenu.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); });
    });
  }

  // Quantity sync with cart URL
  var qtyInput = document.getElementById('qty');
  var cartBtns = Array.prototype.slice.call(document.querySelectorAll('.js-cart-btn'));
  if (qtyInput && cartBtns.length) {
    var baseUrl = cartBtns[0].href;
    function syncCartLinks() {
      cartBtns.forEach(function(btn){
        btn.href = baseUrl + '&quantity=' + qtyInput.value;
      });
    }
    syncCartLinks();
    document.querySelectorAll('.qty-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        setTimeout(syncCartLinks, 10);
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
body{font-family:var(--sans);background:#f4f4f4;color:var(--text)}
a{text-decoration:none;color:inherit}
picture{display:contents}
.wrap{max-width:480px;margin:0 auto;background:#fff}
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
