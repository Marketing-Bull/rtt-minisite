#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');

const PRODUCT = {
  id: 235,
  sku: '794775969357',
  name: "Medium Women's Chemo Care Package",
  siteUrl: 'https://www.rockthetreatment.com/womens-medium-chemo-basket/',
  etsyListingId: '1064269310',
  etsyUrl: 'https://www.etsy.com/listing/1064269310/chemo-care-package-comfort-gift-basket',
};

const STAMPED = {
  endpoint: 'https://stamped.io/api/widget/reviews',
  apiKey: 'pubkey-oEk5VCMkA2ud4KZvV9J9X2u7b7Hx2S',
  storeId: '96752',
  storeUrl: 'www.rockthetreatment.com',
  pageSize: 16,
};

const CDP_URL = process.env.RTT_CDP_URL || 'http://127.0.0.1:18800';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'research', 'reviews-medium-women');
const PLAYWRIGHT_CORE =
  process.env.RTT_PLAYWRIGHT_CORE ||
  '/home/ababen/.openclaw/tools/node-v24.15.0/lib/node_modules/openclaw/node_modules/playwright-core';

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizedMessage(value) {
  return clean(value)
    .toLocaleLowerCase('en-US')
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function googleRelevance(message) {
  const text = clean(message).toLocaleLowerCase('en-US');
  const explicitMediumWomen =
    /\bmedium\s+(?:women|woman|women['’]?s)\b|\bwomen['’]?s\s+medium\b/.test(text);
  if (explicitMediumWomen) return 'exact_size_explicit';

  const conflictingSize =
    /\b(?:large|small)\s+(?:women|woman|women['’]?s)\b|\bwomen['’]?s\s+(?:large|small)\b/.test(
      text,
    );
  if (conflictingSize) return 'conflicting_size_explicit';

  const explicitWomenChemoPackage =
    /\b(?:women['’]?s|woman['’]?s)\s+(?:chemo|cancer)(?:\s+care)?\s+(?:package|basket|box|kit)\b/.test(text);
  if (explicitWomenChemoPackage) return 'women_chemo_package_unspecified_size';

  const womenRecipient = /\b(?:woman|women|she|her|hers|sister|mother|mom|daughter|aunt|wife|female)\b/.test(text);
  const treatment = /\b(?:chemo|chemotherapy|cancer|treatment)\b/.test(text);
  const package = /\b(?:package|basket|box|kit|gift)\b/.test(text);
  if (womenRecipient && treatment && package) return 'possible_women_package';
  if (treatment && package) return 'company_product_unspecified';
  return 'company_level';
}

function standardStampedReview(review) {
  return {
    source: 'stamped',
    sourceScope: 'exact_product',
    sourceId: String(review.id),
    productId: String(review.productId || PRODUCT.id),
    productName: clean(review.productName || PRODUCT.name),
    rating: Number(review.reviewRating),
    author: clean(review.author),
    authorMeta: '',
    date: clean(review.reviewDate),
    title: clean(review.reviewTitle),
    message: clean(review.reviewMessage),
    verified: Boolean(review.reviewVerifiedType),
    location: clean(review.location || review.countryIso),
    replyAuthor: review.reviewReply ? 'Rock the Treatment' : '',
    replyDate: clean(review.reviewReplyDate),
    replyMessage: clean(review.reviewReply),
    relevance: 'exact_product',
    sourceUrl: PRODUCT.siteUrl,
  };
}

async function fetchStampedReviews() {
  const reviews = [];
  const seen = new Set();

  for (let page = 1; page <= 25; page += 1) {
    const query = new URLSearchParams({
      productId: String(PRODUCT.id),
      productSku: PRODUCT.sku,
      page: String(page),
      sortReviews: 'recent',
      storeUrl: STAMPED.storeUrl,
      take: String(STAMPED.pageSize),
      minRating: '1',
      apiKey: STAMPED.apiKey,
      sId: STAMPED.storeId,
    });
    const response = await fetch(`${STAMPED.endpoint}?${query}`);
    if (!response.ok) {
      throw new Error(`Stamped page ${page} returned HTTP ${response.status}`);
    }
    const payload = await response.json();
    const pageReviews = Array.isArray(payload.data) ? payload.data : [];
    for (const review of pageReviews) {
      if (!seen.has(review.id)) {
        seen.add(review.id);
        reviews.push(standardStampedReview(review));
      }
    }
    if (pageReviews.length < STAMPED.pageSize) break;
  }

  return reviews;
}

async function connectToReviewPages() {
  const { chromium } = require(PLAYWRIGHT_CORE);
  const browser = await chromium.connectOverCDP(CDP_URL);
  const pages = browser.contexts().flatMap((context) => context.pages());
  const googlePage = pages.find(
    (page) =>
      page.url().includes('google.com/search') &&
      page.url().toLocaleLowerCase('en-US').includes('rock+the+treatment+reviews'),
  );
  const etsyPage = pages.find((page) => page.url().includes(`/listing/${PRODUCT.etsyListingId}/`));
  const yelpPage = pages.find((page) => page.url().includes('/biz/rock-the-treatment-deer-park-2'));

  if (!googlePage) {
    throw new Error('Google review page is not open in the connected browser');
  }
  if (!etsyPage) {
    throw new Error('Etsy product listing is not open in the connected browser');
  }
  if (!yelpPage) {
    throw new Error('Yelp company review page is not open in the connected browser');
  }

  return { browser, googlePage, etsyPage, yelpPage };
}

async function loadAllGoogleReviews(page) {
  await page.bringToFront();
  await page.waitForSelector('.bwb7ce');
  await page.evaluate(async () => {
    const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const before = document.querySelectorAll('.bwb7ce').length;
      const button = [...document.querySelectorAll('div[role="button"]')].find(
        (element) => element.innerText.trim() === 'More user reviews',
      );
      if (!button) break;
      button.click();
      let changed = false;
      for (let poll = 0; poll < 20; poll += 1) {
        await sleep(250);
        if (document.querySelectorAll('.bwb7ce').length > before) {
          changed = true;
          break;
        }
      }
      if (!changed) break;
    }

    for (const moreLink of document.querySelectorAll('a.MtCSLb')) {
      if (moreLink.innerText.trim().toLocaleLowerCase('en-US') === 'more') {
        moreLink.click();
      }
    }
    await sleep(750);
  });
}

async function extractGoogleReviews(page) {
  await loadAllGoogleReviews(page);
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('.bwb7ce')].map((card) => {
      const messageNode = card.querySelector('.OA1nbd');
      const messageClone = messageNode?.cloneNode(true);
      for (const link of messageClone?.querySelectorAll('a') || []) link.remove();
      const ratingLabel = card.querySelector('.dHX2k')?.getAttribute('aria-label') || '';
      const rating = Number(ratingLabel.match(/Rated\s+([\d.]+)/i)?.[1] || 0);
      const authorLink = card.querySelector('.yC3ZMb');
      return {
        sourceId: card.getAttribute('data-id') || '',
        author: card.querySelector('.Vpc5Fe')?.textContent || '',
        authorMeta: card.querySelector('.p7f0Nd .GSM50')?.textContent || '',
        authorUrl: authorLink?.href || '',
        rating,
        date: card.querySelector('.y3Ibjb')?.textContent || '',
        message: messageClone?.textContent || '',
        replyAuthor: card.querySelector('.PdaDLc .PhaUTe')?.textContent || '',
        replyDate: card.querySelector('.PdaDLc .GSM50')?.textContent || '',
        replyMessage: card.querySelector('.PdaDLc .KmCjbd')?.textContent || '',
      };
    }),
  );

  return rows.map((row) => ({
    source: 'google',
    sourceScope: 'company',
    sourceId: clean(row.sourceId),
    productId: '',
    productName: '',
    rating: Number(row.rating),
    author: clean(row.author),
    authorMeta: clean(row.authorMeta),
    authorUrl: clean(row.authorUrl),
    date: clean(row.date),
    title: '',
    message: clean(row.message),
    verified: false,
    location: '',
    replyAuthor: clean(row.replyAuthor),
    replyDate: clean(row.replyDate),
    replyMessage: clean(row.replyMessage),
    relevance: googleRelevance(row.message),
    sourceUrl: page.url(),
  }));
}

async function extractEtsyReviews(page) {
  await page.bringToFront();
  await page.waitForSelector('.review-card');
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('.review-card')].map((card) => {
      const authorLink = card.querySelector('[aria-label^="Reviewer "]');
      const author = authorLink?.textContent || '';
      const dateLine =
        card.querySelector('.wt-hide-xs.wt-show-md p.wt-text-body-small')?.textContent || '';
      const replyBlock = card.querySelector('.wt-pl-xs-2');
      return {
        sourceId: card.getAttribute('data-review-region') || '',
        rating: card.querySelector('input[name="initial-rating"]')?.value || '',
        author,
        authorUrl: authorLink?.href || '',
        date: dateLine.replace(author, ''),
        message:
          card.querySelector(
            'p.wt-text-truncate--multi-line.wt-break-word.wt-text-body:not(.wt-text-gray)',
          )?.textContent || '',
        replyAuthor: replyBlock?.querySelector('p.wt-text-title-small')?.textContent || '',
        replyMessage:
          replyBlock?.querySelector(
            'p.wt-text-truncate--multi-line.wt-break-word.wt-text-body-small',
          )?.textContent || '',
      };
    }),
  );

  return rows.map((row) => ({
    source: 'etsy',
    sourceScope: 'exact_listing',
    sourceId: clean(row.sourceId),
    productId: PRODUCT.etsyListingId,
    productName: PRODUCT.name,
    rating: Number(row.rating),
    author: clean(row.author),
    authorMeta: '',
    authorUrl: clean(row.authorUrl),
    date: clean(row.date),
    title: '',
    message: clean(row.message),
    verified: true,
    location: '',
    replyAuthor: clean(row.replyAuthor),
    replyDate: '',
    replyMessage: clean(row.replyMessage),
    relevance: 'exact_listing',
    sourceUrl: PRODUCT.etsyUrl,
  }));
}

async function extractYelpReviews(page) {
  await page.bringToFront();
  await page.waitForSelector('li.y-css-114cps7 [role="region"][aria-label]');
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('li.y-css-114cps7')]
      .filter((card) => card.querySelector('[role="region"][aria-label]'))
      .map((card) => {
        const region = card.querySelector('[role="region"][aria-label]');
        const rawMessages = [...card.querySelectorAll('span.raw__09f24__PkHSg')].map(
          (element) => element.innerText,
        );
        const ratingLabel =
          card.querySelector('[aria-label$="star rating"]')?.getAttribute('aria-label') || '';
        const replyDates = [...card.querySelectorAll('p.y-css-okwvc1')]
          .map((element) => element.textContent)
          .filter((value) => /[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/.test(value));
        const authorLink = region.querySelector('a[href*="/user_details"]');
        return {
          sourceId: new URL(authorLink?.href || location.href).searchParams.get('userid') || '',
          author: region.getAttribute('aria-label') || '',
          authorUrl: authorLink?.href || '',
          authorMeta:
            region.querySelector('[data-testid="UserPassportInfoTextContainer"]')?.textContent || '',
          rating: Number(ratingLabel.match(/([\d.]+)\s+star/i)?.[1] || 0),
          date: card.querySelector('span.y-css-okwvc1')?.textContent || '',
          message: rawMessages[0] || '',
          replyAuthor: card.querySelector('p.y-css-1sdx3u1')?.textContent || '',
          replyDate: replyDates.at(-1) || '',
          replyMessage: rawMessages[1] || '',
        };
      }),
  );

  return rows.map((row) => ({
    source: 'yelp',
    sourceScope: 'company',
    sourceId: clean(row.sourceId),
    productId: '',
    productName: '',
    rating: Number(row.rating),
    author: clean(row.author),
    authorMeta: clean(row.authorMeta),
    authorUrl: clean(row.authorUrl),
    date: clean(row.date),
    title: '',
    message: clean(row.message),
    verified: false,
    location: clean(row.authorMeta),
    replyAuthor: clean(row.replyAuthor),
    replyDate: clean(row.replyDate),
    replyMessage: clean(row.replyMessage),
    relevance: googleRelevance(row.message),
    sourceUrl: page.url(),
  }));
}

function deduplicate(reviews) {
  const groups = new Map();
  for (const review of reviews) {
    const key = normalizedMessage(review.message) || `${review.source}:${review.sourceId}`;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        ...review,
        duplicateSources: [{ source: review.source, sourceId: review.sourceId }],
      });
      continue;
    }
    existing.duplicateSources.push({ source: review.source, sourceId: review.sourceId });
  }
  return [...groups.values()];
}

function csvCell(value) {
  const text = Array.isArray(value) || (value && typeof value === 'object')
    ? JSON.stringify(value)
    : String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows) {
  const headers = [
    'source',
    'sourceScope',
    'sourceId',
    'productId',
    'productName',
    'rating',
    'author',
    'authorMeta',
    'authorUrl',
    'date',
    'title',
    'message',
    'verified',
    'location',
    'replyAuthor',
    'replyDate',
    'replyMessage',
    'relevance',
    'sourceUrl',
  ];
  return [
    headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n');
}

async function writeJson(filename, value) {
  await fs.writeFile(
    path.join(OUTPUT_DIR, filename),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
  );
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const stamped = await fetchStampedReviews();
  const { browser, googlePage, etsyPage, yelpPage } = await connectToReviewPages();
  const google = await extractGoogleReviews(googlePage);
  const etsy = await extractEtsyReviews(etsyPage);
  const yelp = await extractYelpReviews(yelpPage);
  // Disconnect the automation client without terminating the shared OpenClaw browser.
  if (browser._connection?.close) await browser._connection.close();

  const combined = [...stamped, ...etsy, ...google, ...yelp];
  const deduplicated = deduplicate(combined);
  const thirdPartyProductCandidates = [...google, ...yelp].filter((review) =>
    [
      'exact_size_explicit',
      'women_chemo_package_unspecified_size',
      'possible_women_package',
    ].includes(review.relevance),
  );

  await writeJson('stamped-exact-product.json', stamped);
  await writeJson('etsy-exact-listing.json', etsy);
  await writeJson('google-company.json', google);
  await writeJson('yelp-company.json', yelp);
  await writeJson('third-party-product-candidates.json', thirdPartyProductCandidates);
  await writeJson('all-reviews.json', combined);
  await writeJson('deduplicated-reviews.json', deduplicated);
  await fs.writeFile(path.join(OUTPUT_DIR, 'all-reviews.csv'), `${toCsv(combined)}\n`, 'utf8');

  const duplicateGroups = deduplicated.filter((review) => review.duplicateSources.length > 1);
  const sourceCounts = {
    stamped: stamped.length,
    etsy: etsy.length,
    google: google.length,
    yelp: yelp.length,
  };
  const relevanceCounts = Object.groupBy(google, (review) => review.relevance);
  const sourceAudit = {
    generatedAt: new Date().toISOString(),
    sources: [
      {
        source: 'stamped',
        status: 'collected',
        scope: 'exact_product',
        count: stamped.length,
        note: 'The live Stamped API includes one review newer than the cached on-page widget.',
      },
      {
        source: 'etsy',
        status: 'collected',
        scope: 'exact_listing',
        count: etsy.length,
        note: 'The Etsy shop has more company-wide reviews, but only these two belong to the exact listing.',
      },
      {
        source: 'google',
        status: 'collected',
        scope: 'company',
        count: google.length,
        note: 'Company-level reviews; product relevance requires text verification.',
      },
      {
        source: 'yelp',
        status: 'collected',
        scope: 'company',
        count: yelp.length,
        note: 'Company-level reviews; none explicitly identify the Medium Women package.',
      },
      {
        source: 'facebook',
        status: 'blocked_login',
        scope: 'company',
        advertisedCount: 27,
        note: 'The public page exposes one truncated recommendation; the complete set requires Facebook login.',
      },
      {
        source: 'rockthetreatment_testimonials',
        status: 'not_independent',
        scope: 'editorial',
        note: 'Editorial testimonials are not counted as a separate review source without provenance.',
      },
    ],
  };
  await writeJson('source-audit.json', sourceAudit);
  const summary = `# Medium Women's review source archive

Generated: ${new Date().toISOString()}

## Counts

- Stamped.io exact product ${PRODUCT.id}: ${stamped.length}
- Etsy exact listing ${PRODUCT.etsyListingId}: ${etsy.length}
- Google company reviews: ${google.length}
- Yelp company reviews: ${yelp.length}
- Combined source records: ${combined.length}
- Deduplicated review texts: ${deduplicated.length}
- Cross-source duplicate groups: ${duplicateGroups.length}
- Third-party product candidates: ${thirdPartyProductCandidates.length}

## Scope rules

- Stamped.io records are exact-product reviews for product ${PRODUCT.id}.
- Etsy records are exact-listing reviews for listing ${PRODUCT.etsyListingId}, which currently represents the $129.99 women's package.
- Google and Yelp records are company-level reviews. They must not be labeled as verified reviews of the Medium Women's package unless the text explicitly identifies the product and size.
- \`third-party-product-candidates.json\` is a research shortlist, not a verified exact-product set. Its relevance labels are conservative text-based classifications.
- Facebook advertises 27 recommendations, but the complete text set requires login. It is recorded in \`source-audit.json\`, not mixed into the archive.

## Google relevance counts

${Object.entries(relevanceCounts)
  .map(([label, rows]) => `- ${label}: ${rows.length}`)
  .join('\n')}

## Source URLs

- ${PRODUCT.siteUrl}
- ${PRODUCT.etsyUrl}
- Google Business Profile query URL is preserved on every Google review record.

## Files

- \`stamped-exact-product.json\`: full exact-product feed, including owner replies.
- \`etsy-exact-listing.json\`: full exact-listing reviews, including seller replies.
- \`google-company.json\`: all Google Business Profile reviews, including owner replies.
- \`yelp-company.json\`: all Yelp company reviews, including the visible owner reply.
- \`third-party-product-candidates.json\`: women/package candidates for manual verification.
- \`all-reviews.json\` and \`all-reviews.csv\`: source-preserving combined archive.
- \`deduplicated-reviews.json\`: normalized-text deduplication with source provenance.
- \`source-audit.json\`: collected, blocked, and excluded source inventory.
`;
  await fs.writeFile(path.join(OUTPUT_DIR, 'README.md'), summary, 'utf8');

  console.log(JSON.stringify({
    outputDir: OUTPUT_DIR,
    sourceCounts,
    combined: combined.length,
    deduplicated: deduplicated.length,
    duplicateGroups: duplicateGroups.length,
    thirdPartyProductCandidates: thirdPartyProductCandidates.length,
    relevanceCounts: Object.fromEntries(
      Object.entries(relevanceCounts).map(([label, rows]) => [label, rows.length]),
    ),
  }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
