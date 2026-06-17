// Browser extraction script — paste into browser evaluate
// Returns structured product data as JSON
const extractProductData = `(() => {
  var data = { categories: [], faqs: [], upsells: [], reviews: [], relatedProducts: [] };
  
  // Get all h3 headings
  var allH3 = document.querySelectorAll('h3');
  var currentCategory = null;
  var seenItems = new Set();
  
  allH3.forEach(function(h3) {
    var text = h3.textContent.trim();
    
    // Category headers
    if (text.match(/^For (Dry Mouth|Nausea|Engaging|Recovery|Comfort|Skin|Focus|Relief)/i) || text === 'Just For Fun') {
      currentCategory = { name: text, items: [] };
      data.categories.push(currentCategory);
      return;
    }
    
    // Skip non-item headings
    if (!currentCategory) return;
    if (text.match(/^(NURTURING|Nourish|FAQs|Add even|Our Fan|You may|THOUGHTFULLY|CONVENIENT|UNMATCHED|CARING|Rockthetreatment|Free Gift)/i)) return;
    if (text.length < 4 || text.length > 100) return;
    if (seenItems.has(text)) return;
    seenItems.add(text);
    
    // Find the description (next sibling text)
    var parent = h3.closest('.elementor-widget-container, .elementor-column, div');
    var desc = '';
    var sibling = h3.nextElementSibling;
    while (sibling && !sibling.matches('h3, h2')) {
      if (sibling.textContent.trim().length > 20) {
        desc = sibling.textContent.trim();
        break;
      }
      sibling = sibling.nextElementSibling;
    }
    if (!desc && parent) {
      var ps = parent.querySelectorAll('p');
      ps.forEach(function(p) {
        if (!desc && p.textContent.trim().length > 30) desc = p.textContent.trim();
      });
    }
    
    // Find associated image
    var img = '';
    var section = h3.closest('.elementor-section, .elementor-column, .e-con');
    if (section) {
      var imgEl = section.querySelector('img');
      if (imgEl) img = imgEl.getAttribute('nitro-lazy-src') || imgEl.src || '';
    }
    
    currentCategory.items.push({ name: text, description: desc.substring(0, 400), image: img });
  });
  
  // FAQs
  document.querySelectorAll('h4').forEach(function(h4) {
    var text = h4.textContent.trim();
    if (text.match(/^(What|Are there|How|Can I|Do you|Is there)/)) {
      data.faqs.push(text);
    }
  });
  
  // Review count from Stamped
  var stampedCount = document.querySelector('[data-count], .stamped-badge-caption, .summary-overview');
  if (stampedCount) data.reviewCountText = stampedCount.textContent.trim();
  var ratingEl = document.querySelector('.stamped-summary-text, .summary-overview');
  if (ratingEl) data.ratingText = ratingEl.textContent.trim();
  
  // First 3 reviews
  document.querySelectorAll('.stamped-review, [data-review-id]').forEach(function(rev, i) {
    if (i >= 3) return;
    var title = rev.querySelector('.stamped-review-header-title, h3');
    var body = rev.querySelector('.stamped-review-content-body, p');
    var author = rev.querySelector('.stamped-review-header-byline strong, .author');
    var stars = rev.querySelectorAll('.stamped-fa-star, .fa-star').length;
    data.reviews.push({
      title: title ? title.textContent.trim() : '',
      body: body ? body.textContent.trim().substring(0, 300) : '',
      author: author ? author.textContent.trim() : '',
      stars: stars || 5
    });
  });
  
  return JSON.stringify(data);
})()`;

console.log(extractProductData);
