<?php
/**
 * RTT Landing Page — Functions (add to child theme's functions.php)
 *
 * Copy the contents of this file into your child theme's functions.php,
 * or require it: require_once get_stylesheet_directory() . '/rtt-lp-functions.php';
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/* ──────────────────────────────────────────────
 * 1. Register the page template from the child theme
 * ────────────────────────────────────────────── */
add_filter( 'theme_page_templates', 'rtt_lp_register_template' );
function rtt_lp_register_template( $templates ) {
    $templates['rtt-landing-template.php'] = 'RTT CRO Landing Page';
    return $templates;
}

/* ──────────────────────────────────────────────
 * 2. Point WordPress to our template file
 * ────────────────────────────────────────────── */
add_filter( 'template_include', 'rtt_lp_template_include' );
function rtt_lp_template_include( $template ) {
    if ( is_page() ) {
        $page_template = get_post_meta( get_the_ID(), '_wp_page_template', true );
        if ( 'rtt-landing-template.php' === $page_template ) {
            $file = get_stylesheet_directory() . '/rtt-landing-template.php';
            if ( file_exists( $file ) ) {
                return $file;
            }
        }
    }
    return $template;
}

/* ──────────────────────────────────────────────
 * 3. Dequeue Elementor CSS/JS on landing pages
 * ────────────────────────────────────────────── */
add_action( 'wp_enqueue_scripts', 'rtt_lp_dequeue_elementor', 999 );
function rtt_lp_dequeue_elementor() {
    if ( ! is_page() ) return;

    $page_template = get_post_meta( get_the_ID(), '_wp_page_template', true );
    if ( 'rtt-landing-template.php' !== $page_template ) return;

    // Dequeue Elementor styles
    wp_dequeue_style( 'elementor-frontend' );
    wp_dequeue_style( 'elementor-post-css' );
    wp_dequeue_style( 'elementor-global' );
    wp_dequeue_style( 'elementor-common' );
    wp_dequeue_style( 'elementor-icons' );
    wp_dequeue_style( 'elementor-animations' );
    wp_dequeue_style( 'elementor-pro' );
    wp_dequeue_style( 'elementor-pro-css' );

    // Dequeue Elementor scripts
    wp_dequeue_script( 'elementor-frontend' );
    wp_dequeue_script( 'elementor-pro-frontend' );
    wp_dequeue_script( 'elementor-common' );
    wp_dequeue_script( 'elementor-waypoints' );
    wp_dequeue_script( 'elementor-webpack-runtime' );

    // Deregister to prevent other plugins from enqueuing them back
    wp_deregister_style( 'elementor-frontend' );
    wp_deregister_style( 'elementor-post-css' );
    wp_deregister_style( 'elementor-global' );
    wp_deregister_style( 'elementor-common' );
    wp_deregister_style( 'elementor-icons' );
    wp_deregister_style( 'elementor-animations' );
    wp_deregister_style( 'elementor-pro' );
    wp_deregister_style( 'elementor-pro-css' );

    wp_deregister_script( 'elementor-frontend' );
    wp_deregister_script( 'elementor-pro-frontend' );
    wp_deregister_script( 'elementor-common' );
    wp_deregister_script( 'elementor-waypoints' );
    wp_deregister_script( 'elementor-webpack-runtime' );

    // Also dequeue any theme styles that aren't needed
    // (adjust these slugs based on the child theme)
    wp_dequeue_style( 'hello-elementor' );
    wp_dequeue_style( 'hello-elementor-theme-style' );
    wp_deregister_style( 'hello-elementor' );
    wp_deregister_style( 'hello-elementor-theme-style' );
}

/* ──────────────────────────────────────────────
 * 4. Enqueue WooCommerce cart fragments on LP
 * ────────────────────────────────────────────── */
add_action( 'wp_enqueue_scripts', 'rtt_lp_enqueue_wc_scripts', 20 );
function rtt_lp_enqueue_wc_scripts() {
    if ( ! is_page() ) return;

    $page_template = get_post_meta( get_the_ID(), '_wp_page_template', true );
    if ( 'rtt-landing-template.php' !== $page_template ) return;

    // Make sure WC scripts are available
    if ( function_exists( 'WC' ) ) {
        wp_enqueue_script( 'wc-add-to-cart' );
        wp_enqueue_script( 'wc-cart-fragments' );
        wp_enqueue_script( 'jquery' );
    }
}

/* ──────────────────────────────────────────────
 * 5. Meta box for rtt_lp_product_id
 * ────────────────────────────────────────────── */
add_action( 'add_meta_boxes', 'rtt_lp_add_meta_box' );
function rtt_lp_add_meta_box() {
    add_meta_box(
        'rtt_lp_product_meta',
        'RTT Landing Page — Product ID',
        'rtt_lp_meta_box_html',
        'page',
        'side',
        'high'
    );
}

function rtt_lp_meta_box_html( $post ) {
    $value = get_post_meta( $post->ID, 'rtt_lp_product_id', true );
    wp_nonce_field( 'rtt_lp_save_product_id', 'rtt_lp_nonce' );
    echo '<label for="rtt_lp_product_id" style="display:block;margin-bottom:5px;font-weight:bold;">WooCommerce Product ID:</label>';
    echo '<input type="number" id="rtt_lp_product_id" name="rtt_lp_product_id" value="' . esc_attr( $value ) . '" style="width:100%;padding:6px;" placeholder="e.g. 248" />';
    echo '<p class="description" style="margin-top:8px;">Enter the WC product ID for this landing page.<br><br>';
    echo '<strong>Product IDs:</strong><br>';
    echo '248 — Women\'s Large Chemo<br>';
    echo '235 — Women\'s Medium Chemo<br>';
    echo '10338 — Women\'s Small Chemo<br>';
    echo '250 — Radiation Care Package<br>';
    echo '232 — Men\'s Medium Chemo</p>';
}

add_action( 'save_post', 'rtt_lp_save_product_id' );
function rtt_lp_save_product_id( $post_id ) {
    if ( ! isset( $_POST['rtt_lp_nonce'] ) || ! wp_verify_nonce( $_POST['rtt_lp_nonce'], 'rtt_lp_save_product_id' ) ) return;
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
    if ( ! current_user_can( 'edit_page', $post_id ) ) return;

    if ( isset( $_POST['rtt_lp_product_id'] ) ) {
        update_post_meta( $post_id, 'rtt_lp_product_id', intval( $_POST['rtt_lp_product_id'] ) );
    }
}

/* ──────────────────────────────────────────────
 * 6. AJAX add-to-cart fragment: update cart count
 * ────────────────────────────────────────────── */
add_filter( 'woocommerce_add_to_cart_fragments', 'rtt_lp_cart_count_fragment' );
function rtt_lp_cart_count_fragment( $fragments ) {
    $count = WC()->cart->get_cart_contents_count();
    $fragments['.rtt-cart-count'] = '<span class="rtt-cart-count">' . esc_html( $count ) . '</span>';
    return $fragments;
}
