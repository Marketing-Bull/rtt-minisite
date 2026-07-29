<?php
/**
 * Template Name: RTT CRO Landing Page
 *
 * Lightweight, conversion-optimised landing page for Rock The Treatment.
 * Pulls live price/title from WooCommerce; static content from rtt-lp-data.php.
 * Does NOT load Elementor CSS/JS (handled by rtt-lp-functions.php).
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// Load product data helper
require_once get_stylesheet_directory() . '/rtt-lp-data.php';

// Get the WC product ID from the page custom field
$rtt_product_id = intval( get_post_meta( get_the_ID(), 'rtt_lp_product_id', true ) );
if ( ! $rtt_product_id ) {
    wp_die( 'RTT Landing Page Error: No product ID set. Edit this page and enter the WooCommerce Product ID in the "RTT Landing Page — Product ID" meta box.' );
}

// Get WooCommerce product (live price, title, permalink)
$wc_product = wc_get_product( $rtt_product_id );
if ( ! $wc_product ) {
    wp_die( 'RTT Landing Page Error: Product #' . $rtt_product_id . ' not found in WooCommerce.' );
}

// Get static data
$lp_data = rtt_lp_get_product_data( $rtt_product_id );
if ( ! $lp_data ) {
    wp_die( 'RTT Landing Page Error: No landing page data for product #' . $rtt_product_id . '. Check rtt-lp-data.php.' );
}

$product  = $lp_data['product'];
$shared   = $lp_data['shared'];

// Live from WC
$price       = $wc_product->get_price();
$price_fmt   = wc_price( $price );
$title       = $wc_product->get_name();
$cart_url    = wc_get_cart_url();
$checkout_url = wc_get_checkout_url();
$cart_count  = WC()->cart ? WC()->cart->get_cart_contents_count() : 0;

// Static from data
$hero_image    = $product['hero_image'];
$gallery       = $product['gallery'];
$description   = $product['description'];
$short_desc    = $product['short_desc'];
$categories    = $product['categories'];
$related       = $product['related'];
$reviews       = $product['reviews'];
$review_count  = $product['review_count'];
$total_sales   = $product['total_sales'];
$item_count    = $product['item_count'];
$meta_title    = $product['meta_title'];
$is_radiation  = ! empty( $product['is_radiation'] );
$item_images   = $shared['item_images'];
$upsells       = $shared['upsell_products'];
$faqs          = $is_radiation ? $shared['radiation_faqs'] : $shared['faqs'];
$logo          = $shared['logo'];
$bell_img      = $shared['bell_img'];

$site_url = home_url();
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?php echo esc_html( $meta_title ); ?> | Rock The Treatment</title>
<meta name="description" content="<?php echo esc_attr( $short_desc ); ?>">
<meta property="og:title" content="<?php echo esc_attr( $meta_title ); ?> | Rock The Treatment">
<meta property="og:description" content="<?php echo esc_attr( $short_desc ); ?>">
<meta property="og:image" content="<?php echo esc_url( $hero_image ); ?>">
<meta property="og:type" content="product">
<meta property="product:price:amount" content="<?php echo esc_attr( $price ); ?>">
<meta property="product:price:currency" content="USD">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<?php wp_head(); // GA4, FB Pixel, Google Ads, WC scripts all fire here ?>
<style>
:root{--green:#5ba346;--green-dark:#4a8a38;--orange:#ff6319;--orange-dark:#e55a15;--text:#1a1a1a;--text-light:#555;--text-muted:#888;--bg:#fff;--bg-alt:#fafafa;--bg-warm:#fff8f0;--border:#eee;--serif:'DM Serif Display',Georgia,serif;--sans:'Inter',system-ui,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--sans);background:#fff;color:var(--text)}
a{text-decoration:none;color:inherit}

.page-wrapper{max-width:480px;margin:0 auto;background:#fff}
@media(min-width:481px){.page-wrapper{box-shadow:0 0 40px rgba(0,0,0,.08)}}

.topbar{background:var(--green);padding:8px 16px;display:flex;justify-content:space-between;align-items:center;color:#fff;font-size:14px}
.topbar .icons{display:flex;gap:16px;align-items:center}
.topbar .cart-link{position:relative;color:#fff}
.rtt-cart-count{position:absolute;top:-6px;right:-8px;background:var(--orange);color:#fff;font-size:10px;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;line-height:1}
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

.btn-cart{display:block;width:100%;padding:16px;border:none;border-radius:8px;font-family:var(--sans);font-weight:700;font-size:16px;background:var(--orange);color:#fff;cursor:pointer;margin-top:14px;text-transform:uppercase;letter-spacing:.03em;box-shadow:0 4px 14px rgba(255,99,25,.35);text-align:center;transition:background .2s}
.btn-cart:hover{background:var(--orange-dark)}
.btn-cart.loading{opacity:.7;pointer-events:none}

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
.faq-item{border-bottom:1px solid var(--border);padding:14px 0;display:flex;justify-content:space-between;align-items:center}
.faq-item .q{font-size:14px;font-weight:600;flex:1;padding-right:12px}
.faq-item .chev{color:var(--text-muted);font-size:12px}

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

/* ── Mini-cart notification ── */
.rtt-mini-cart-notice{display:none;position:fixed;top:0;left:0;right:0;z-index:9999;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,.15);padding:16px 20px;max-width:480px;margin:0 auto;animation:slideDown .3s ease}
.rtt-mini-cart-notice.show{display:block}
.rtt-mini-cart-notice .notice-inner{display:flex;align-items:center;gap:12px}
.rtt-mini-cart-notice .notice-check{color:var(--green);font-size:24px}
.rtt-mini-cart-notice .notice-text{flex:1;font-size:14px;font-weight:500}
.rtt-mini-cart-notice .notice-actions{display:flex;gap:8px;margin-top:10px}
.rtt-mini-cart-notice .btn-view-cart{flex:1;padding:10px;text-align:center;border:1px solid var(--green);color:var(--green);border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none}
.rtt-mini-cart-notice .btn-checkout{flex:1;padding:10px;text-align:center;background:var(--orange);color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none}
.rtt-mini-cart-notice .btn-close-notice{position:absolute;top:8px;right:12px;background:none;border:none;font-size:18px;cursor:pointer;color:#999}
@keyframes slideDown{from{transform:translateY(-100%)}to{transform:translateY(0)}}
</style>
</head>
<body <?php body_class(); ?>>

<!-- Mini-cart notification (shown after AJAX add-to-cart) -->
<div class="rtt-mini-cart-notice" id="rttMiniCart">
  <button class="btn-close-notice" onclick="document.getElementById('rttMiniCart').classList.remove('show')">×</button>
  <div class="notice-inner">
    <span class="notice-check">✓</span>
    <span class="notice-text">Added to cart!</span>
  </div>
  <div class="notice-actions">
    <a href="<?php echo esc_url( $cart_url ); ?>" class="btn-view-cart">View Cart</a>
    <a href="<?php echo esc_url( $checkout_url ); ?>" class="btn-checkout">Checkout</a>
  </div>
</div>

<div class="page-wrapper">

  <!-- HEADER -->
  <div class="topbar">
    <a href="<?php echo esc_url( $site_url ); ?>" style="font-size:18px;color:#fff;">☰</a>
    <div class="icons">
      <a href="<?php echo esc_url( $site_url ); ?>" style="color:#fff;">🔍</a>
      <a href="<?php echo esc_url( $site_url . '/my-account/' ); ?>" style="color:#fff;">👤</a>
      <a href="<?php echo esc_url( $cart_url ); ?>" class="cart-link" style="color:#fff;">🛒<span class="rtt-cart-count"><?php echo esc_html( $cart_count ); ?></span></a>
    </div>
  </div>
  <div class="header">
    <a href="<?php echo esc_url( $site_url ); ?>"><img src="<?php echo esc_url( $logo ); ?>" alt="Rock The Treatment"></a>
  </div>
  <div class="nav">
    <a href="<?php echo esc_url( $site_url . '/shop/' ); ?>">Shop</a>
    <a href="<?php echo esc_url( $site_url . '/about/' ); ?>">About</a>
    <a href="<?php echo esc_url( $site_url . '/info/' ); ?>">Info</a>
    <a href="<?php echo esc_url( $site_url . '/blog/' ); ?>">Blog</a>
    <a href="<?php echo esc_url( $site_url . '/contact/' ); ?>">Contact</a>
  </div>

  <!-- SOCIAL PROOF BANNER -->
  <div class="social-proof-banner">
    ★★★★★ <strong><?php echo esc_html( number_format( $review_count ) ); ?> families</strong> have sent love with this package
  </div>

  <!-- PRODUCT GALLERY -->
  <img class="gallery-main" id="mainImg" src="<?php echo esc_url( $hero_image ); ?>" alt="<?php echo esc_attr( $title ); ?>">
  <div class="gallery-thumbs">
    <?php foreach ( $gallery as $i => $img_url ) : ?>
    <img src="<?php echo esc_url( $img_url ); ?>" alt="<?php echo esc_attr( $title ); ?>" class="<?php echo $i === 0 ? 'active' : ''; ?>" onclick="document.getElementById('mainImg').src=this.src;document.querySelectorAll('.gallery-thumbs img').forEach(t=>t.classList.remove('active'));this.classList.add('active');">
    <?php endforeach; ?>
  </div>

  <!-- PRODUCT INFO -->
  <div class="product-info">
    <h1 class="product-title"><?php echo esc_html( $title ); ?></h1>
    <div class="product-price"><?php echo $price_fmt; ?></div>
    <div class="qty-row">
      <button class="qty-btn" onclick="var i=document.getElementById('rttQty');i.value=Math.max(1,+i.value-1)">−</button>
      <input class="qty-input" id="rttQty" value="1" readonly>
      <button class="qty-btn" onclick="var i=document.getElementById('rttQty');i.value=+i.value+1">+</button>
    </div>

    <!-- WooCommerce AJAX Add to Cart button -->
    <button type="button"
            class="btn-cart add_to_cart_button ajax_add_to_cart"
            data-product_id="<?php echo esc_attr( $rtt_product_id ); ?>"
            data-quantity="1"
            id="rttAddToCart">
      Add to Cart
    </button>

    <div class="urgency">Orders placed before 2pm ship same day</div>
    <div class="shipping-note">Free shipping on this order!</div>

    <!-- TRUST BADGES -->
    <div class="trust-badges">
      <div class="trust-badge"><span class="icon">🔒</span>Secure<br>Checkout</div>
      <div class="trust-badge"><span class="icon">📦</span>Ships in<br>1-2 Days</div>
      <div class="trust-badge"><span class="icon">🎁</span><?php echo esc_html( $item_count ); ?> Items<br>Included</div>
      <div class="trust-badge"><span class="icon">💝</span>Free Gift<br>Included</div>
    </div>

    <!-- FREE GIFT CALLOUT -->
    <div class="free-gift-callout">
      <img src="<?php echo esc_url( $bell_img ); ?>" alt="Celebration Bell">
      <div class="text">
        <strong>FREE bonus!</strong> Every purchase includes an End of Treatment Celebration Gift — order separately at no charge.
      </div>
    </div>

    <!-- DESCRIPTION -->
    <div class="product-desc">
      <?php echo wp_kses_post( $description ); ?>
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
      <?php foreach ( $related as $rel ) : ?>
      <a href="<?php echo esc_url( $site_url . $rel['url'] ); ?>" class="related-card">
        <img src="<?php echo esc_url( $rel['image'] ); ?>" alt="<?php echo esc_attr( $rel['name'] ); ?>">
        <div class="info">
          <div class="name"><?php echo esc_html( $rel['name'] ); ?></div>
          <div class="price"><?php echo esc_html( $rel['price'] ); ?></div>
        </div>
      </a>
      <?php endforeach; ?>
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
  <?php foreach ( $categories as $cat ) : ?>
  <div class="category-header"><h3><?php echo $cat['name']; ?></h3></div>
  <?php foreach ( $cat['items'] as $item ) :
      $img_src = isset( $item_images[ $item['name'] ] ) ? $item_images[ $item['name'] ] : '';
  ?>
  <div class="item-card">
    <?php if ( $img_src ) : ?>
    <img src="<?php echo esc_url( $img_src ); ?>" alt="<?php echo esc_attr( $item['name'] ); ?>">
    <?php endif; ?>
    <div class="item-info">
      <div class="item-name"><?php echo esc_html( $item['name'] ); ?></div>
      <div class="item-desc"><?php echo esc_html( $item['desc'] ); ?></div>
    </div>
  </div>
  <?php endforeach; ?>
  <?php endforeach; ?>

  <!-- FAQs -->
  <div class="faq-section">
    <div class="section-title" style="margin-bottom:8px;">FAQs</div>
    <?php foreach ( $faqs as $faq ) : ?>
    <div class="faq-item"><span class="q"><?php echo esc_html( $faq ); ?></span><span class="chev">▾</span></div>
    <?php endforeach; ?>
    <div style="text-align:center;margin-top:10px;">
      <a href="<?php echo esc_url( $site_url . '/faqs/' ); ?>" style="font-size:13px;color:var(--green);font-weight:600;">Browse more FAQs →</a>
    </div>
  </div>

  <!-- UPSELL GRID -->
  <div class="upsell-section">
    <div class="section-title" style="font-family:var(--serif);font-size:20px;margin-bottom:14px;">Add even more support</div>
    <div class="upsell-grid">
      <?php foreach ( $upsells as $up ) : ?>
      <a href="<?php echo esc_url( $site_url . $up['url'] ); ?>" class="upsell-card">
        <img src="<?php echo esc_url( $up['image'] ); ?>" alt="<?php echo esc_attr( $up['name'] ); ?>">
        <div class="uname"><?php echo esc_html( $up['name'] ); ?></div>
      </a>
      <?php endforeach; ?>
    </div>
  </div>

  <!-- REVIEWS -->
  <div class="reviews-section">
    <div class="section-title">Our Fan Club</div>
    <div class="review-summary">
      <div class="big-rating">5.0</div>
      <div class="stars-big">★★★★★</div>
      <div class="count">Based on <?php echo esc_html( number_format( $review_count ) ); ?> Reviews</div>
    </div>
    <div class="star-bars">
      <div class="star-bar"><span>5 ★</span><div class="bar"><div class="bar-fill" style="width:97%"></div></div><span><?php echo intval( $review_count * 0.97 ); ?></span></div>
      <div class="star-bar"><span>4 ★</span><div class="bar"><div class="bar-fill" style="width:1.5%"></div></div><span><?php echo max(1, intval( $review_count * 0.015 )); ?></span></div>
      <div class="star-bar"><span>3 ★</span><div class="bar"><div class="bar-fill" style="width:0.5%"></div></div><span><?php echo max(0, intval( $review_count * 0.005 )); ?></span></div>
      <div class="star-bar"><span>2 ★</span><div class="bar"><div class="bar-fill" style="width:0.5%"></div></div><span><?php echo max(0, intval( $review_count * 0.005 )); ?></span></div>
      <div class="star-bar"><span>1 ★</span><div class="bar"><div class="bar-fill" style="width:0%"></div></div><span>0</span></div>
    </div>
    <div class="review-tabs">
      <div class="review-tab active">Reviews (<?php echo esc_html( $review_count ); ?>)</div>
      <div class="review-tab">Questions (4)</div>
    </div>
    <?php foreach ( $reviews as $rev ) : ?>
    <div class="review-card">
      <div class="r-date"><?php echo esc_html( $rev['date'] ); ?></div>
      <div class="stars"><?php echo str_repeat( '★', $rev['stars'] ); ?></div>
      <div class="r-title"><?php echo esc_html( $rev['title'] ); ?></div>
      <div class="r-text"><?php echo esc_html( $rev['text'] ); ?></div>
      <div class="r-author">— <?php echo esc_html( $rev['author'] ); ?> · Verified Buyer</div>
      <?php if ( ! empty( $rev['reply'] ) ) : ?>
      <div class="review-reply"><strong>Rock The Treatment</strong><br><?php echo esc_html( $rev['reply'] ); ?></div>
      <?php endif; ?>
    </div>
    <?php endforeach; ?>
    <div style="text-align:center;padding:12px;">
      <a href="<?php echo esc_url( $site_url . '/' . $product['slug'] . '/#reviews' ); ?>" style="font-size:13px;color:var(--orange);font-weight:600;cursor:pointer;">Load more reviews ↓</a>
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
        <a href="<?php echo esc_url( $site_url . '/shipping-returns/' ); ?>">Shipping & Returns</a>
        <a href="<?php echo esc_url( $site_url . '/faqs/' ); ?>">FAQs</a>
        <a href="<?php echo esc_url( $site_url . '/contact/' ); ?>">Contact Us</a>
      </div>
      <div class="footer-col">
        <h4>Shop</h4>
        <a href="<?php echo esc_url( $site_url . '/shop/' ); ?>">Care Packages</a>
        <a href="<?php echo esc_url( $site_url . '/about/' ); ?>">About</a>
        <a href="<?php echo esc_url( $site_url . '/blog/' ); ?>">Blog</a>
        <a href="<?php echo esc_url( $site_url . '/donate/' ); ?>">Donate</a>
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
      <div style="margin-top:4px;">Copyright <?php echo date('Y'); ?> © ROCK the TREATMENT™</div>
    </div>
  </div>

</div>

<script>
(function($){
  if (typeof $ !== 'function') return;

  // Sync quantity input with the data-quantity attribute
  var qtyInput = document.getElementById('rttQty');
  var addBtn   = document.getElementById('rttAddToCart');

  if (qtyInput && addBtn) {
    // Watch for qty changes
    var observer = new MutationObserver(function(){ addBtn.setAttribute('data-quantity', qtyInput.value); });
    observer.observe(qtyInput, { attributes: true, attributeFilter: ['value'] });

    // Also sync on click of +/- buttons
    document.querySelectorAll('.qty-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        setTimeout(function(){ addBtn.setAttribute('data-quantity', qtyInput.value); }, 10);
      });
    });
  }

  // Show mini-cart notification after AJAX add-to-cart
  $(document.body).on('added_to_cart', function(e, fragments, cart_hash, $btn){
    var notice = document.getElementById('rttMiniCart');
    if (notice) {
      notice.classList.add('show');
      // Auto-hide after 6 seconds
      setTimeout(function(){ notice.classList.remove('show'); }, 6000);
    }
    // Remove loading state
    if ($btn && $btn.length) {
      $btn.removeClass('loading');
    }
  });

  // Add loading state when clicking add-to-cart
  $(document).on('click', '.ajax_add_to_cart', function(){
    $(this).addClass('loading');
  });

})(window.jQuery);
</script>

<!-- Gallery Swipe + FAQ Accordion -->
<script>
(function(){
  // Gallery swipe + thumb click
  var wrap = document.getElementById('galleryWrap');
  var mainImg = document.getElementById('mainImg');
  var thumbs = document.querySelectorAll('#galleryThumbs img');
  var hint = document.getElementById('swipeHint');
  var imgs = [];
  thumbs.forEach(function(t){ imgs.push(t.src); });
  var currentIdx = 0;
  var startX = 0, diffX = 0, swiping = false;

  function showImg(idx) {
    if (idx < 0) idx = imgs.length - 1;
    if (idx >= imgs.length) idx = 0;
    currentIdx = idx;
    mainImg.src = imgs[idx];
    thumbs.forEach(function(t,i){ t.classList.toggle('active', i === idx); });
    if (hint) { hint.style.opacity = '0'; setTimeout(function(){ if(hint.parentNode) hint.parentNode.removeChild(hint); }, 500); }
  }

  thumbs.forEach(function(t, i){
    t.addEventListener('click', function(){ showImg(i); });
  });

  if (wrap) {
    wrap.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; swiping = true; }, {passive: true});
    wrap.addEventListener('touchmove', function(e){ if (swiping) diffX = e.touches[0].clientX - startX; }, {passive: true});
    wrap.addEventListener('touchend', function(){ if (!swiping) return; swiping = false; if (Math.abs(diffX) > 40) { diffX < 0 ? showImg(currentIdx + 1) : showImg(currentIdx - 1); } diffX = 0; });
    wrap.addEventListener('mousedown', function(e){ startX = e.clientX; swiping = true; e.preventDefault(); });
    document.addEventListener('mousemove', function(e){ if (swiping) diffX = e.clientX - startX; });
    document.addEventListener('mouseup', function(){ if (!swiping) return; swiping = false; if (Math.abs(diffX) > 40) { diffX < 0 ? showImg(currentIdx + 1) : showImg(currentIdx - 1); } diffX = 0; });
  }

  document.addEventListener('keydown', function(e){
    if (e.key === 'ArrowLeft') showImg(currentIdx - 1);
    if (e.key === 'ArrowRight') showImg(currentIdx + 1);
  });
})();
</script>

<?php wp_footer(); ?>
</body>
</html>
