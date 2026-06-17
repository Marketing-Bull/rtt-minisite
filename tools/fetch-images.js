#!/usr/bin/env node
/*
 * Downloads every product image referenced by product-data.json into
 * public/assets/uploads/<YYYY>/<MM>/<file>, preserving the original path so the
 * minisite can serve images locally (no dependency on the main store, which
 * blocks cross-origin hotlinking).
 *
 * Re-runnable. Node built-ins only. Must run from a context whose referer is
 * allowed by the source site — default Node requests send no Referer, which the
 * site permits (a *.pages.dev referer would be 403'd).
 *
 *   node tools/fetch-images.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'product-data.json'), 'utf8'));
const SOURCE_BASE = 'https://www.rockthetreatment.com/wp-content/uploads';
const outRoot = path.join(ROOT, 'public', 'assets', 'uploads');

// Reduce any image reference to its source-relative /YYYY/MM/file path.
function toRel(u) {
  if (!u) return null;
  let m = u.match(/\/wp-content\/uploads(\/.*)$/) || u.match(/\/assets\/uploads(\/.*)$/);
  if (m) return m[1];
  if (u.startsWith('/')) return u;                 // already a bare /YYYY/MM/... path
  m = u.match(/^https?:\/\/[^/]+(\/.*)$/);          // strip protocol+host
  return m ? m[1] : null;
}

const rels = new Set();
const add = (u) => { const r = toRel(u); if (r) rels.add(r); };
add(data.logo);
add(data.bellImg);
Object.values(data.itemImages || {}).forEach(add);
(data.upsellProducts || []).forEach((p) => add(p.image));
(data.products || []).forEach((p) => {
  add(p.heroImage);
  (p.galleryImages || []).forEach(add);
  (p.relatedProducts || []).forEach((r) => add(r.image));
});

const list = [...rels].sort();
console.log(`Found ${list.length} referenced images.`);

function download(rel) {
  return new Promise((resolve) => {
    const url = SOURCE_BASE + rel;
    https
      .get(url, { headers: { 'User-Agent': 'rtt-minisite-image-fetch' } }, (res) => {
        const ct = (res.headers['content-type'] || '').split(';')[0];
        if (res.statusCode !== 200 || !ct.startsWith('image/')) {
          res.resume(); // drain
          console.warn(`  SKIP (${res.statusCode} ${ct || 'no-type'}): ${rel}`);
          return resolve(false);
        }
        const dest = path.join(outRoot, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () =>
          file.close(() => {
            const kb = (fs.statSync(dest).size / 1024).toFixed(0);
            console.log(`  OK (${kb} KB): ${rel}`);
            resolve(true);
          })
        );
      })
      .on('error', (e) => {
        console.warn(`  ERROR (${e.message}): ${rel}`);
        resolve(false);
      });
  });
}

(async () => {
  let ok = 0;
  let skip = 0;
  for (const rel of list) {
    if (await download(rel)) ok++;
    else skip++;
  }
  console.log(`\nDone. Saved ${ok}, skipped ${skip}. Output: ${path.relative(ROOT, outRoot)}/`);
})();
