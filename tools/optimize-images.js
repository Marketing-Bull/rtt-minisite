#!/usr/bin/env node
/*
 * Offline image optimizer.
 *
 * Generates AVIF + WebP variants for every raster image under
 * public/assets/uploads, and converts the one animated GIF (the Warmies upsell
 * thumbnail) into a small animated WebP plus a still JPG fallback, then deletes
 * the multi-megabyte original.
 *
 * Two tiers are emitted for the images shown full-bleed (hero + gallery) and
 * for the animations: the light `name.avif`/`name.webp` pair the markup ships
 * for a fast first paint, and a sharper `name-hq.avif`/`name-hq.webp` pair the
 * page swaps in after `load`. See the progressive-upgrade block in generate.js.
 *
 * This is a BUILD-TIME tool only — it depends on `sharp`. The runtime page
 * generator (generate.js) stays dependency-free; it just references whichever
 * variant files exist on disk. Re-runnable / idempotent: it skips outputs that
 * are already newer than their source.
 *
 *   npm run optimize     (== node tools/optimize-images.js)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', 'public', 'assets', 'uploads');
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'product-data.json'), 'utf8'));
const MAX_W = 1200;     // cap for static raster variants (mobile-first)
const GIF_MAX_W = 360;  // cap for the animated thumbnail
const AVIF_Q = 50;
const WEBP_Q = 80;
const GIF_WEBP_Q = 70;

// Second, heavier tier for the images the page shows at full width. The light
// tier above is tuned for first paint (it is what the LCP preload points at);
// at 1200px / AVIF q50 it is visibly soft on a 3x phone, where the hero alone
// occupies ~1260 device pixels. generate.js ships the light tier in the markup
// and swaps these in after `load`, so the extra bytes never touch LCP.
const HQ_MAX_W = 2000;
const HQ_AVIF_Q = 72;
const HQ_WEBP_Q = 88;
// The animations get no HQ tier. The one we have is 119 frames, so every extra
// pixel of width is paid 119 times: 360px costs 558KB, 480px costs 1.2MB. It is
// only ever rendered in an upsell card ~121 CSS px wide, which even on a 3x
// screen wants ~363px — so the light tier is already the right size, and a
// sharper one would be megabytes spent on a thumbnail.

// Which images earn the HQ tier: the hero and every gallery image, i.e. the
// ones rendered full-bleed. Card and item thumbnails stay single-tier — their
// light variant is already larger than they are ever displayed.
function largeDisplayImages() {
  const set = new Set();
  const add = u => {
    if (!u) return;
    const m = String(u).match(/\/wp-content\/uploads(\/.*)$/) || String(u).match(/\/assets\/uploads(\/.*)$/);
    set.add(path.join(ROOT, (m ? m[1] : u).replace(/^\//, '')));
  };
  for (const product of DATA.products || []) {
    add(product.heroImage);
    // Same precedence generate.js uses, so we don't encode a tier for a gallery
    // the page never renders.
    (((product.mobileUi || {}).galleryImages) || product.galleryImages || []).forEach(add);
  }
  return set;
}
const HQ_SET = largeDisplayImages();

sharp.cache(false);
sharp.concurrency(1);

const relRoot = p => path.relative(path.join(__dirname, '..'), p);
const RASTER = new Set(['.jpg', '.jpeg', '.png']);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function upToDate(src, dest) {
  return fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs;
}

function hasSiblingRaster(file) {
  const base = file.slice(0, -path.extname(file).length);
  return ['.jpg', '.jpeg', '.png', '.gif'].some(e => fs.existsSync(base + e));
}

let made = 0, skipped = 0, removed = 0;

async function staticVariants(src) {
  const ext = path.extname(src).toLowerCase();
  const base = src.slice(0, -ext.length);
  const avif = base + '.avif';
  const webp = base + '.webp';
  const pipe = () => sharp(src).resize({ width: MAX_W, withoutEnlargement: true });

  if (!upToDate(src, avif)) {
    await pipe().avif({ quality: AVIF_Q, effort: 4 }).toFile(avif);
    console.log(`  + ${relRoot(avif)}`); made++;
  } else skipped++;

  // Don't emit a .webp next to an original .webp (it IS the webp fallback).
  if (ext !== '.webp') {
    if (!upToDate(src, webp)) {
      await pipe().webp({ quality: WEBP_Q, effort: 4 }).toFile(webp);
      console.log(`  + ${relRoot(webp)}`); made++;
    } else skipped++;
  }

  if (!HQ_SET.has(src)) return;

  // HQ tier. No JPEG/PNG counterpart: the untouched original already IS the
  // high-quality fallback for browsers with neither AVIF nor WebP.
  const hqAvif = base + '-hq.avif';
  const hqWebp = base + '-hq.webp';
  const hqPipe = () => sharp(src).resize({ width: HQ_MAX_W, withoutEnlargement: true });

  if (!upToDate(src, hqAvif)) {
    await hqPipe().avif({ quality: HQ_AVIF_Q, effort: 4 }).toFile(hqAvif);
    console.log(`  + ${relRoot(hqAvif)} (hq)`); made++;
  } else skipped++;

  if (ext !== '.webp') {
    if (!upToDate(src, hqWebp)) {
      await hqPipe().webp({ quality: HQ_WEBP_Q, effort: 4 }).toFile(hqWebp);
      console.log(`  + ${relRoot(hqWebp)} (hq)`); made++;
    } else skipped++;
  }
}

async function gifVariants(src) {
  const base = src.slice(0, -path.extname(src).length);
  const webp = base + '.webp';
  const still = base + '-still.jpg';

  // Animated WebP (resized) — primary, preserves the animation.
  await sharp(src, { animated: true })
    .resize({ width: GIF_MAX_W, withoutEnlargement: true })
    .webp({ quality: GIF_WEBP_Q, effort: 4 })
    .toFile(webp);
  console.log(`  + ${relRoot(webp)} (animated)`); made++;

  // Still first-frame JPG — fallback for the <picture>'s <img>.
  await sharp(src) // first page only
    .resize({ width: GIF_MAX_W, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(still);
  console.log(`  + ${relRoot(still)} (still fallback)`); made++;

  // Drop the heavy original.
  fs.unlinkSync(src);
  console.log(`  - ${relRoot(src)} (removed original)`); removed++;
}

(async () => {
  if (!fs.existsSync(ROOT)) {
    console.error(`No image dir at ${ROOT} — run tools/fetch-images.js first.`);
    process.exit(1);
  }
  console.log('Optimizing images under', relRoot(ROOT), '\n');

  for (const file of walk(ROOT)) {
    const ext = path.extname(file).toLowerCase();
    const name = path.basename(file);

    if (name.endsWith('-still.jpg')) continue;          // generated poster
    if (/-hq\.[a-z0-9]+$/i.test(name)) continue;        // generated HQ variant
    if (RASTER.has(ext)) {
      await staticVariants(file);
    } else if (ext === '.gif') {
      if (fs.existsSync(file)) await gifVariants(file);
    } else if (ext === '.webp') {
      // Original .webp (no raster sibling, not animated) → just add an .avif.
      if (hasSiblingRaster(file)) continue;             // generated from a raster
      const meta = await sharp(file).metadata();
      if ((meta.pages || 1) > 1) continue;              // animated (gif-derived) → leave alone
      await staticVariants(file);
    }
    // .avif and anything else: ignore
  }

  console.log(`\nDone. ${made} written, ${skipped} up-to-date, ${removed} original(s) removed.`);
})().catch(e => { console.error(e); process.exit(1); });
