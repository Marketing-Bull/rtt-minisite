// Scrape RTT product page structured data
// Run via: node scrape-product.js <url>
// Outputs JSON with all product content

const url = process.argv[2];
if (!url) { console.error('Usage: node scrape-product.js <url>'); process.exit(1); }

const https = require('https');
const http = require('http');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const html = await fetch(url);
  
  // Extract structured data using regex patterns
  const result = {
    url,
    title: '',
    price: '',
    description: '',
    gallery_images: [],
    categories: [],
    items: [],
    faqs: [],
    value_props: [],
    reviews: [],
    review_count: 0,
    review_avg: '5.0',
    upsell_products: [],
    related_products: []
  };
  
  // Title
  const h1Match = html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>(.*?)<\/h1>/s);
  if (h1Match) result.title = h1Match[1].replace(/<[^>]+>/g, '').trim();
  
  // Price
  const priceMatch = html.match(/class="woocommerce-Price-amount[^"]*"[^>]*>.*?<bdi>(.*?)<\/bdi>/s);
  if (priceMatch) result.price = priceMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
  
  // Gallery images - extract from woocommerce gallery
  const galleryMatches = html.matchAll(/data-large_image="([^"]+)"/g);
  for (const m of galleryMatches) {
    if (!result.gallery_images.includes(m[1])) result.gallery_images.push(m[1]);
  }
  // Fallback: product images from og:image or gallery wrapper
  if (result.gallery_images.length === 0) {
    const imgMatches = html.matchAll(/woocommerce-product-gallery__image[^>]*>.*?<a[^>]*href="([^"]+)"/gs);
    for (const m of imgMatches) {
      if (!result.gallery_images.includes(m[1])) result.gallery_images.push(m[1]);
    }
  }
  
  // Short description
  const descMatch = html.match(/woocommerce-product-details__short-description[^>]*>(.*?)<\/div>/s);
  if (descMatch) result.description = descMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Product breakdown sections - find h3 category headers and items
  // Look for the item sections pattern: category heading -> individual items with images
  const sectionPattern = /<h3[^>]*>\s*(For [^<]+|Just For Fun)\s*<\/h3>/gi;
  let sectionMatch;
  const sectionPositions = [];
  while ((sectionMatch = sectionPattern.exec(html)) !== null) {
    sectionPositions.push({ name: sectionMatch[1].trim(), pos: sectionMatch.index });
  }
  
  // For each section, find item h3s and their descriptions
  for (let i = 0; i < sectionPositions.length; i++) {
    const start = sectionPositions[i].pos;
    const end = i + 1 < sectionPositions.length ? sectionPositions[i+1].pos : start + 10000;
    const sectionHtml = html.substring(start, end);
    
    const category = { name: sectionPositions[i].name, items: [] };
    
    // Find individual items (h3 followed by text)
    const itemPattern = /<h3[^>]*>\s*(?!For |Just For Fun|NURTURING|Nourish|FAQs|Add even|Our Fan|You may)([\w][\s\S]*?)<\/h3>\s*(?:<[^>]+>\s*)*([^<]{20,})/gi;
    let itemMatch;
    const tempHtml = sectionHtml.substring(100); // skip the category header
    while ((itemMatch = itemPattern.exec(tempHtml)) !== null) {
      const name = itemMatch[1].replace(/<[^>]+>/g, '').trim();
      const desc = itemMatch[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (name.length > 3 && name.length < 100 && !name.includes('Rockthetreatment')) {
        category.items.push({ name, description: desc.substring(0, 300) });
      }
    }
    
    if (category.items.length > 0) result.categories.push(category);
  }
  
  // FAQs
  const faqPattern = /<h4[^>]*>\s*<span[^>]*>\s*(What [^<]+|Are there[^<]+|How [^<]+)\s*<\/span>\s*<\/h4>/gi;
  let faqMatch;
  while ((faqMatch = faqPattern.exec(html)) !== null) {
    result.faqs.push(faqMatch[1].trim());
  }
  // Fallback FAQ pattern
  if (result.faqs.length === 0) {
    const faqPattern2 = /<h4[^>]*>\s*(What [^<]+\?|Are there[^<]+\?|How [^<]+\?)\s*<\/h4>/gi;
    let faqMatch2;
    while ((faqMatch2 = faqPattern2.exec(html)) !== null) {
      result.faqs.push(faqMatch2[1].trim());
    }
  }
  
  // All images on page (for matching to items)
  const allImgs = [];
  const imgPattern = /(?:src|nitro-lazy-src|data-src)="(https:\/\/cdn-aidbo\.nitrocdn\.com[^"]+\.(?:jpg|jpeg|png|gif|webp))"/gi;
  let imgMatch;
  while ((imgMatch = imgPattern.exec(html)) !== null) {
    if (!allImgs.includes(imgMatch[1])) allImgs.push(imgMatch[1]);
  }
  // Also direct images
  const imgPattern2 = /(?:src|data-src)="(https:\/\/www\.rockthetreatment\.com\/wp-content\/uploads[^"]+\.(?:jpg|jpeg|png|gif|webp))"/gi;
  while ((imgMatch = imgPattern2.exec(html)) !== null) {
    if (!allImgs.includes(imgMatch[1])) allImgs.push(imgMatch[1]);
  }
  result.all_images = allImgs;
  
  // Upsell products (Link Complete Box pattern)
  const upsellPattern = /<a[^>]*href="(https:\/\/www\.rockthetreatment\.com\/[^"]+\/)"[^>]*>[\s\S]*?<img[^>]*(?:src|nitro-lazy-src)="([^"]+)"[^>]*alt="([^"]*)"[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  while ((itemMatch = upsellPattern.exec(html)) !== null) {
    const name = itemMatch[4].replace(/<[^>]+>/g, '').trim();
    if (name && !result.upsell_products.find(u => u.name === name)) {
      result.upsell_products.push({
        url: itemMatch[1],
        image: itemMatch[2],
        alt: itemMatch[3],
        name
      });
    }
  }
  
  console.log(JSON.stringify(result, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
