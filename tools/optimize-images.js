#!/usr/bin/env node
/*
 * Offline image optimizer.
 *
 * Generates AVIF + WebP variants for every raster image under
 * public/assets/uploads, and converts the one animated GIF (the Warmies upsell
 * thumbnail) into a small animated WebP plus a still JPG fallback, then deletes
 * the multi-megabyte original.
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
const MAX_W = 1200;     // cap for static raster variants (mobile-first)
const GIF_MAX_W = 360;  // cap for the animated thumbnail
const AVIF_Q = 50;
const WEBP_Q = 80;
const GIF_WEBP_Q = 70;

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
