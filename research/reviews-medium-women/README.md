# Medium Women's review source archive

Generated: 2026-07-28T15:44:51.351Z

## Counts

- Stamped.io exact product 235: 145
- Etsy exact listing 1064269310: 2
- Google company reviews: 233
- Yelp company reviews: 4
- Combined source records: 384
- Deduplicated review texts: 382
- Cross-source duplicate groups: 2
- Third-party product candidates: 76

## Scope rules

- Stamped.io records are exact-product reviews for product 235.
- Etsy records are exact-listing reviews for listing 1064269310, which currently represents the $129.99 women's package.
- Google and Yelp records are company-level reviews. They must not be labeled as verified reviews of the Medium Women's package unless the text explicitly identifies the product and size.
- `third-party-product-candidates.json` is a research shortlist, not a verified exact-product set. Its relevance labels are conservative text-based classifications.
- Facebook advertises 27 recommendations, but the complete text set requires login. It is recorded in `source-audit.json`, not mixed into the archive.

## Google relevance counts

- women_chemo_package_unspecified_size: 1
- possible_women_package: 74
- company_level: 108
- company_product_unspecified: 47
- conflicting_size_explicit: 2
- exact_size_explicit: 1

## Source URLs

- https://www.rockthetreatment.com/womens-medium-chemo-basket/
- https://www.etsy.com/listing/1064269310/chemo-care-package-comfort-gift-basket
- Google Business Profile query URL is preserved on every Google review record.

## Files

- `stamped-exact-product.json`: full exact-product feed, including owner replies.
- `etsy-exact-listing.json`: full exact-listing reviews, including seller replies.
- `google-company.json`: all Google Business Profile reviews, including owner replies.
- `yelp-company.json`: all Yelp company reviews, including the visible owner reply.
- `third-party-product-candidates.json`: women/package candidates for manual verification.
- `all-reviews.json` and `all-reviews.csv`: source-preserving combined archive.
- `deduplicated-reviews.json`: normalized-text deduplication with source provenance.
- `source-audit.json`: collected, blocked, and excluded source inventory.
