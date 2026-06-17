<?php
/**
 * RTT Landing Page — Static Product Data
 *
 * This file contains the static content (item breakdowns, descriptions,
 * reviews, categories, images) for all 5 landing page products.
 *
 * Usage: $data = rtt_lp_get_product_data( $product_id );
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function rtt_lp_get_all_product_data() {

    $img = 'https://cdn-aidbo.nitrocdn.com/DPyFKgPXzaaaSqAmCcbtAPNJPtyXQoqz/assets/images/optimized/rev-8d96e32/www.rockthetreatment.com/wp-content/uploads';

    $item_images = array(
        'Lindi Skin Face Serum'        => $img . '/2019/05/lindi-face-serum.jpg',
        'Lindi Skin Body Lotion'       => $img . '/2019/05/lindi-body-lotion.jpg',
        'Dionis Goat Milk Lip Balm'    => $img . '/2019/07/lip-care.jpg',
        'Dionis Goat Milk Skin Cream'  => $img . '/2019/05/dionis-hand-cream-.png',
        'Dry Mouth Lozenges'           => $img . '/2019/05/10-dry-mouth-lozenges.jpg',
        'Peppermint Drops'             => $img . '/2019/05/peppermint-candy-crop.jpg',
        'Herbal Tea'                   => $img . '/2019/05/peppermint-tea.jpeg',
        'Hot & Cold Eye Pillow'        => $img . '/2019/07/eye-pillow.jpg',
        'Soft & Cozy Socks'            => $img . '/2018/04/fuzzy-socks.jpg',
        'RTT Chemo Beanie'             => $img . '/2019/07/knit-cap.jpg',
        'Queasy Pops'                  => $img . '/2019/05/queasy-pops.jpg',
        'Nut & Dried Fruit Mix'        => $img . '/2019/07/nuts.jpg',
        'Dark Chocolate Covered Berries' => $img . '/2023/04/Copy-of-Drk-Choc-and-Berries.jpeg',
        'Peanut Butter Sandwich Crackers' => $img . '/2019/05/peanut-butter-crackers-crop.jpg',
        'Adult Coloring Book Set'      => $img . '/2018/04/Copy-of-distractivities.jpg',
        'Custom Designed Note Cards'   => $img . '/2020/07/Copy-of-note-cards-w-env.jpg',
        'Cancer Health Organizer'      => $img . '/2021/07/Cancer-Organizer-Card-with-QRcardwhite.jpg',
        'Jelly Belly Cocktails'        => $img . '/2019/05/jelly-belly-cocktail-crop.jpg',
        'Puzzle Book'                  => $img . '/2023/04/Puzzle-Book.jpg',
        'Brain Teaser Puzzle'          => $img . '/2023/04/Puzzle-Book.jpg',
        'Puzzles & Brain Teasers'      => $img . '/2023/04/Puzzle-Book.jpg',
        'Mio Water Enhancer'           => $img . '/2019/07/Mio.jpg',
        'Aloe Vera Skin Gel'           => $img . '/2019/05/aloe-gel.jpg',
        'Calendula Cream'              => $img . '/2019/05/calendula-cream.jpg',
        'Aquaphor Healing Ointment'    => $img . '/2019/05/aquaphor.jpg',
    );

    $shared = array(
        'logo'     => 'https://cdn-aidbo.nitrocdn.com/DPyFKgPXzaaaSqAmCcbtAPNJPtyXQoqz/assets/images/optimized/rev-8d96e32/www.rockthetreatment.com/wp-content/uploads/2023/01/RTT.S1.tm_.new-logo.png',
        'bell_img' => $img . '/2023/06/bell.png',
        'item_images' => $item_images,
        'faqs' => array(
            'What gifts to avoid?',
            'What are the most common side effects of chemo?',
            'What items help with the side effects of chemo?',
            'Are there any restrictions on gifts chemo patients can receive?',
            'What about dietary restriction substitutions?',
        ),
        'radiation_faqs' => array(
            'What gifts to avoid for radiation patients?',
            'What are the most common side effects of radiation?',
            'What items help with the side effects of radiation?',
            'Are there any restrictions on gifts radiation patients can receive?',
            'What about dietary restriction substitutions?',
        ),
        'upsell_products' => array(
            array( 'name' => 'YOU ROCK! Worry Stone',       'image' => $img . '/2025/04/YOU-ROCK-Worry-Stone-Package.png',   'url' => '/you-rock-worry-stone-package/' ),
            array( 'name' => 'Cozy Companion™ Blanket',     'image' => $img . '/2020/02/rock_the_treatment_cozycompanion_plush_2-in-1-blanketpillow_white-bg_thumbnail.webp', 'url' => '/luxurious-soft-plush-blanket-throw/' ),
            array( 'name' => 'Post Surgical Drain Belt',    'image' => $img . '/2024/01/belt-and-shower.jpg',                'url' => '/post-surgical-drain-belt-with-shower-bag/' ),
            array( 'name' => 'Mastectomy Pillow',           'image' => $img . '/2024/01/mast-pill-fronticepacks-1.jpg',       'url' => '/mastectomy-pillow/' ),
            array( 'name' => 'Reusable Folding Tote',       'image' => $img . '/2020/07/Copy-of-tote-standing-1.jpg',         'url' => '/reusable-folding-tote-bag/' ),
            array( 'name' => 'Knit Beanie',                 'image' => $img . '/2018/04/beanie-1000-copy.jpg',                'url' => '/knit-hat/' ),
            array( 'name' => 'Anti-Nausea Wristband',       'image' => $img . '/2023/08/nausea-wrist-1.jpg',                  'url' => '/anti-nausea-wristband/' ),
            array( 'name' => '#ROCKtheTREATMENT Wristband', 'image' => $img . '/2020/07/Copy-of-bracelets.jpg',               'url' => '/wristband/' ),
            array( 'name' => 'Deluxe Celebration Gift',     'image' => $img . '/2023/07/Copy-of-Bell-w-Big-Champ-no-box-transformed.jpg', 'url' => '/bell-deluxe/' ),
            array( 'name' => 'Celebration Gift (Free)',     'image' => $img . '/2023/06/Copy-of-free-bell-w-box-1-1.jpg',     'url' => '/bell/' ),
            array( 'name' => 'Warmies® Plush Animal',      'image' => $img . '/2025/04/Rock-the-Treatment-Warmies-Soft-Plush-Stuffed-Animals-1.gif', 'url' => '/warmies-soft-plush-stuffed-animal/' ),
            array( 'name' => 'Empower Kit',                 'image' => $img . '/2020/07/Copy-of-RTT-can-no-filter-green_2.jpg','url' => '/empower-kit/' ),
        ),
    );

    // ── Product 1: Women's Large Chemo ──────────────────────
    $products = array();

    $products[248] = array(
        'id'           => 248,
        'slug'         => 'womens-large-chemo-basket',
        'meta_title'   => 'Chemo Care Package for Women | Large',
        'item_count'   => '20+',
        'total_sales'  => 9178,
        'review_count' => 254,
        'hero_image'   => $img . '/2018/04/Women-Large-Chemo-Basket-Main.jpg',
        'gallery'      => array(
            $img . '/2018/04/Women-Large-Chemo-Basket-Main.jpg',
            $img . '/2018/04/Womens_Chemo_Product-Tiles_dry-mouth.jpg',
            $img . '/2018/04/Womens_Chemo_Product-Tiles_nausea.jpg',
            $img . '/2018/04/Womens_Chemo_Product-Tiles_engaging-mind.jpg',
        ),
        'description'  => 'Lovingly packed with <strong>over 20 high quality products</strong> for comfort, relief, and relaxation. From soothing skin care to engaging puzzles — everything she needs to look and feel her best during chemo.',
        'short_desc'   => 'The large chemo care package for women is lovingly packed with over 20 high quality useful products to enhance physical and mental well-being during treatment.',
        'is_radiation'  => false,
        'categories'   => array(
            array(
                'name' => 'For Dry Mouth, Lips &amp; Skin',
                'items' => array(
                    array( 'name' => 'Lindi Skin Face Serum',       'desc' => 'Renew and replenish skin with this light, non-greasy serum aimed at reducing redness, irritation, itching and rash. (travel size)' ),
                    array( 'name' => 'Lindi Skin Body Lotion',      'desc' => 'Nourish your skin with this light, clean body lotion containing Vitamins C &amp; E, chamomile and cucumber for maximum comfort. (travel size)' ),
                    array( 'name' => 'Dionis Goat Milk Lip Balm',   'desc' => 'Repair chapped lips with paraben free beeswax lip balms infused with goat milk, shea butter and coconut oil. Twice the standard size.' ),
                    array( 'name' => 'Dionis Goat Milk Skin Cream', 'desc' => 'Rich, creamy unscented goat milk cream. pH similar to human skin — naturally full of vitamins. (3.3 oz)' ),
                    array( 'name' => 'Dry Mouth Lozenges',          'desc' => 'All-natural, sugar free lozenges — #1 Doctor recommended for dry mouth. Dairy free, Gluten free, Nut free, Kosher.' ),
                    array( 'name' => 'Peppermint Drops',            'desc' => 'Ease nausea, headaches and dry mouth with real peppermint oil mints. Individually wrapped. Dairy free, Gluten free, Kosher.' ),
                    array( 'name' => 'Herbal Tea',                  'desc' => 'Rich in polyphenols — natural compounds that reduce inflammation and help fight cancer. Peppermint eases headaches and digestive issues.' ),
                ),
            ),
            array(
                'name' => 'For Nausea, Comfort &amp; Energy',
                'items' => array(
                    array( 'name' => 'Hot & Cold Eye Pillow',       'desc' => 'Silky aromatherapy pillow — microwavable for heat, freezable for cold. Peppermint and eucalyptus scent eases nausea and headaches.' ),
                    array( 'name' => 'Soft & Cozy Socks',           'desc' => 'Warm up during chemotherapy since centers are often chilly. Like a hug for your feet. (styles vary)' ),
                    array( 'name' => 'RTT Chemo Beanie',            'desc' => 'Soft knit beanie embroidered with #RockTheTreatment. Cotton/poly blend for breathable comfort. (colors vary)' ),
                    array( 'name' => 'Queasy Pops',                 'desc' => 'Drug-free drops from all-natural herbs and essential oils. Developed with oncology dietitians. Doctor recommended.' ),
                    array( 'name' => 'Nut & Dried Fruit Mix',       'desc' => 'Heart healthy snack packed with fiber, potassium, antioxidants and proteins. Dairy free, Gluten free, Kosher.' ),
                    array( 'name' => 'Dark Chocolate Covered Berries','desc' => 'Pomegranate, blueberries and acai with powerful antioxidants. Gluten free. Kosher. 2 snack packs.' ),
                    array( 'name' => 'Peanut Butter Sandwich Crackers','desc' => 'Protein-filled snack that decreases nausea and increases energy. Kosher.' ),
                ),
            ),
            array(
                'name' => 'For Engaging the Mind',
                'items' => array(
                    array( 'name' => 'Adult Coloring Book Set',     'desc' => 'Calm your brain and help your body relax. Improves sleep, decreases depression and fatigue. Includes colored pencils and sharpener.' ),
                    array( 'name' => 'Puzzles & Brain Teasers',     'desc' => 'Stimulate your brain with crosswords, sudoku or word search. 40-50 puzzles per book. (types vary)' ),
                    array( 'name' => 'Custom Designed Note Cards',  'desc' => 'Write notes to loved ones. Bring to treatment to use the time productively.' ),
                    array( 'name' => 'Cancer Health Organizer',     'desc' => 'Record and track vital health info — medical history, medicines, appointments, tests, checklists, and reminders.' ),
                ),
            ),
            array(
                'name' => 'Just For Fun',
                'items' => array(
                    array( 'name' => 'Jelly Belly Cocktails',       'desc' => 'Piña Colada, Strawberry Daiquiri, Cosmo and more — fun without the hangover. Dairy Free, Gluten Free, Kosher.' ),
                ),
            ),
        ),
        'related' => array(
            array( 'name' => 'Small Women\'s Chemo Care Package',  'price' => '$69.99',  'image' => $img . '/2019/05/Womens-Chemo-Small-Care-Package-Main.jpg', 'url' => '/womens-small-chemo-basket/' ),
            array( 'name' => 'Medium Women\'s Chemo Care Package', 'price' => '$119.99', 'image' => $img . '/2018/04/Women-Medium-Chemo-Basket-Main.jpg',       'url' => '/womens-medium-chemo-basket/' ),
        ),
        'reviews' => array(
            array( 'stars' => 5, 'title' => 'Stacey is an angel.', 'text' => 'Stacey helped to expedite the Large Women\'s Chemo Care Package to my daughter to be ontime for her treatment. My daughter was overwhelmed by the obvious care and personal touches.', 'author' => 'Gary W.', 'date' => '02/15/2026', 'reply' => 'Gary, You are so kind. We\'re honored we could help get the package there in time. Wishing her continued strength and healing.' ),
            array( 'stars' => 5, 'title' => 'Such a thoughtful company and gift', 'text' => 'Amazing! I was blessed to stumble upon this site as I was searching for the \'perfect something\' for a family member going through a horrific time. Amazing customer service.', 'author' => 'Brooke S.', 'date' => '02/13/2026', 'reply' => 'Thank you for your incredibly kind words. We\'re deeply honored to support your family during such a difficult time.' ),
            array( 'stars' => 5, 'title' => 'Rock the Treatment', 'text' => 'I couldn\'t be happier. She was absolutely blown away and thrilled. Said she felt so taken care of. This is by far the best gift basket for Chemo patients I\'ve come across.', 'author' => 'Kerry M.', 'date' => '12/11/2025', 'reply' => '' ),
        ),
    );

    // ── Product 2: Women's Medium Chemo ─────────────────────
    $products[235] = array(
        'id'           => 235,
        'slug'         => 'womens-medium-chemo-basket',
        'meta_title'   => 'Chemo Care Package for Her | Medium',
        'item_count'   => '15+',
        'total_sales'  => 5200,
        'review_count' => 185,
        'hero_image'   => $img . '/2018/04/Women-Medium-Chemo-Basket-Main.jpg',
        'gallery'      => array(
            $img . '/2018/04/Women-Medium-Chemo-Basket-Main.jpg',
            $img . '/2018/04/Womens_Chemo_Medium_Product-Tiles_dry-mouth.jpg',
            $img . '/2018/04/Womens_Chemo_Medium_Product-Tiles_nausea.jpg',
            $img . '/2018/04/Womens_Chemo_Medium_Product-Tiles_engaging-mind.jpg',
        ),
        'description'  => 'Packed with <strong>over 15 high quality products</strong> that ease the side effects of chemotherapy. Thoughtfully curated with skin care, comfort items, healthy snacks, and engaging activities.',
        'short_desc'   => 'The medium women\'s chemo care package includes all essentials that ease the side effects of chemotherapy, with items for skin, comfort, nausea, and mental well-being.',
        'is_radiation'  => false,
        'categories'   => array(
            array(
                'name' => 'For Dry Mouth, Lips &amp; Skin',
                'items' => array(
                    array( 'name' => 'Lindi Skin Face Serum',       'desc' => 'Renew and replenish skin with this light, non-greasy serum aimed at reducing redness, irritation, itching and rash. (travel size)' ),
                    array( 'name' => 'Lindi Skin Body Lotion',      'desc' => 'Nourish your skin with this light, clean body lotion containing Vitamins C &amp; E, chamomile and cucumber. (travel size)' ),
                    array( 'name' => 'Dionis Goat Milk Lip Balm',   'desc' => 'Repair chapped lips with paraben free beeswax lip balms infused with goat milk, shea butter and coconut oil.' ),
                    array( 'name' => 'Dionis Goat Milk Skin Cream', 'desc' => 'Rich, creamy unscented goat milk cream — pH similar to human skin. (3.3 oz)' ),
                    array( 'name' => 'Dry Mouth Lozenges',          'desc' => 'All-natural, sugar free lozenges — #1 Doctor recommended. Dairy free, Gluten free, Kosher.' ),
                    array( 'name' => 'Peppermint Drops',            'desc' => 'Ease nausea, headaches and dry mouth with real peppermint oil mints. Individually wrapped.' ),
                ),
            ),
            array(
                'name' => 'For Nausea, Comfort &amp; Energy',
                'items' => array(
                    array( 'name' => 'Hot & Cold Eye Pillow',       'desc' => 'Silky aromatherapy pillow — microwavable for heat, freezable for cold. Eases nausea and headaches.' ),
                    array( 'name' => 'Soft & Cozy Socks',           'desc' => 'Warm up during chemotherapy since centers are often chilly. Like a hug for your feet.' ),
                    array( 'name' => 'Queasy Pops',                 'desc' => 'Drug-free drops from all-natural herbs and essential oils. Doctor recommended.' ),
                    array( 'name' => 'Nut & Dried Fruit Mix',       'desc' => 'Heart healthy snack packed with fiber, potassium, antioxidants. Dairy free, Gluten free.' ),
                    array( 'name' => 'Dark Chocolate Covered Berries','desc' => 'Pomegranate, blueberries and acai with powerful antioxidants. Gluten free. Kosher.' ),
                    array( 'name' => 'Peanut Butter Sandwich Crackers','desc' => 'Protein-filled snack that decreases nausea and increases energy.' ),
                ),
            ),
            array(
                'name' => 'For Engaging the Mind',
                'items' => array(
                    array( 'name' => 'Puzzle Book',                 'desc' => 'Crosswords, sudoku or word search — 40-50 puzzles per book. (types vary)' ),
                    array( 'name' => 'Brain Teaser Puzzle',         'desc' => 'Self-contained 3D fun distraction. Pop in a pocket and pass the time during treatment.' ),
                ),
            ),
            array(
                'name' => 'Just For Fun',
                'items' => array(
                    array( 'name' => 'Jelly Belly Cocktails',       'desc' => 'Piña Colada, Strawberry Daiquiri, Cosmo and more — fun without the hangover. Dairy Free, Gluten Free.' ),
                ),
            ),
        ),
        'related' => array(
            array( 'name' => 'Small Women\'s Chemo Care Package',  'price' => '$69.99',  'image' => $img . '/2019/05/Womens-Chemo-Small-Care-Package-Main.jpg', 'url' => '/womens-small-chemo-basket/' ),
            array( 'name' => 'Large Women\'s Chemo Care Package',  'price' => '$159.99', 'image' => $img . '/2018/04/Women-Large-Chemo-Basket-Main.jpg',        'url' => '/womens-large-chemo-basket/' ),
        ),
        'reviews' => array(
            array( 'stars' => 5, 'title' => 'Rick the Treatment Box', 'text' => 'I purchased the box for my best friend of 40 years who just started her chemo treatments. She really enjoyed looking through the box and having several items to try.', 'author' => 'Verified Buyer', 'date' => '02/2026', 'reply' => '' ),
            array( 'stars' => 5, 'title' => 'Care Package for Family member Fighting Lung Cancer', 'text' => 'I cannot thank this shop enough for their incredible service. The shipping was incredibly fast. The product itself is wonderful — she truly loved it.', 'author' => 'Verified Buyer', 'date' => '01/2026', 'reply' => '' ),
            array( 'stars' => 5, 'title' => 'The Perfect Gift', 'text' => 'I was looking for an appropriate gift for a friend going through chemo. I love the great care and consideration in selecting products that bring comfort. She absolutely loved the basket.', 'author' => 'Verified Buyer', 'date' => '12/2025', 'reply' => '' ),
        ),
    );

    // ── Product 3: Women's Small Chemo ──────────────────────
    $products[10338] = array(
        'id'           => 10338,
        'slug'         => 'womens-small-chemo-basket',
        'meta_title'   => 'Women\'s Chemo Gift Basket | Small',
        'item_count'   => '10+',
        'total_sales'  => 3556,
        'review_count' => 142,
        'hero_image'   => $img . '/2019/05/Womens-Chemo-Small-Care-Package-Main.jpg',
        'gallery'      => array(
            $img . '/2019/05/Womens-Chemo-Small-Care-Package-Main.jpg',
            $img . '/2019/05/Womens_Chemo_Small_Product-Tiles_dry-mouth.jpg',
            $img . '/2019/05/Womens_Chemo_Small_Product-Tiles_nausea.jpg',
            $img . '/2019/05/Womens_Chemo_Small_Product-Tiles_engaging-mind.jpg',
        ),
        'description'  => 'Packed with <strong>essential products</strong> medical professionals and survivors recommend to ease the effects of cancer treatment. Skin care, nausea relief, energy boosters, and brain-engaging activities.',
        'short_desc'   => 'This vibrant, uplifting women\'s chemo gift basket is packed with everything to ease the effects of cancer treatment.',
        'is_radiation'  => false,
        'categories'   => array(
            array(
                'name' => 'For Dry Mouth, Lips &amp; Skin',
                'items' => array(
                    array( 'name' => 'Dionis Goat Milk Lip Balm',   'desc' => 'Repair chapped lips with paraben free beeswax lip balms infused with goat milk, shea butter and coconut oil.' ),
                    array( 'name' => 'Dry Mouth Lozenges',          'desc' => 'All-natural, sugar free lozenges — #1 Doctor recommended. Dairy free, Gluten free, Kosher.' ),
                    array( 'name' => 'Peppermint Drops',            'desc' => 'Ease nausea, headaches and dry mouth with real peppermint oil mints. Individually wrapped.' ),
                ),
            ),
            array(
                'name' => 'For Nausea, Comfort &amp; Energy',
                'items' => array(
                    array( 'name' => 'Soft & Cozy Socks',           'desc' => 'Warm up during chemotherapy since centers are often chilly. Like a hug for your feet.' ),
                    array( 'name' => 'Queasy Pops',                 'desc' => 'Drug-free drops from all-natural herbs and essential oils. Doctor recommended.' ),
                    array( 'name' => 'Nut & Dried Fruit Mix',       'desc' => 'Heart healthy snack. Dairy free, Gluten free, Kosher.' ),
                    array( 'name' => 'Peanut Butter Sandwich Crackers','desc' => 'Protein-filled snack that decreases nausea and increases energy.' ),
                ),
            ),
            array(
                'name' => 'For Engaging the Mind',
                'items' => array(
                    array( 'name' => 'Puzzle Book',                 'desc' => 'Crosswords, sudoku or word search — 40-50 puzzles. (types vary)' ),
                ),
            ),
            array(
                'name' => 'Just For Fun',
                'items' => array(
                    array( 'name' => 'Jelly Belly Cocktails',       'desc' => 'Fun mocktail jelly beans — without the hangover. Dairy Free, Gluten Free.' ),
                ),
            ),
        ),
        'related' => array(
            array( 'name' => 'Medium Women\'s Chemo Care Package', 'price' => '$119.99', 'image' => $img . '/2018/04/Women-Medium-Chemo-Basket-Main.jpg',       'url' => '/womens-medium-chemo-basket/' ),
            array( 'name' => 'Large Women\'s Chemo Care Package',  'price' => '$159.99', 'image' => $img . '/2018/04/Women-Large-Chemo-Basket-Main.jpg',        'url' => '/womens-large-chemo-basket/' ),
        ),
        'reviews' => array(
            array( 'stars' => 5, 'title' => 'Perfect pick-me-up', 'text' => 'Sent this to my coworker starting chemo. She said it was exactly what she needed and used every single item.', 'author' => 'Verified Buyer', 'date' => '01/2026', 'reply' => '' ),
            array( 'stars' => 5, 'title' => 'Thoughtful and practical', 'text' => 'Great value for the price. Everything in the box was useful and high quality. My friend was so grateful.', 'author' => 'Verified Buyer', 'date' => '12/2025', 'reply' => '' ),
            array( 'stars' => 5, 'title' => 'Will order again', 'text' => 'This was my second time ordering. Love that everything is curated specifically for chemo patients.', 'author' => 'Verified Buyer', 'date' => '11/2025', 'reply' => '' ),
        ),
    );

    // ── Product 4: Radiation Care Package ───────────────────
    $products[250] = array(
        'id'           => 250,
        'slug'         => 'radiation-basket',
        'meta_title'   => 'Radiation Care Package | Cancer Gifts',
        'item_count'   => '15+',
        'total_sales'  => 3339,
        'review_count' => 128,
        'hero_image'   => $img . '/2018/04/Radiation-Care-Package-Main.jpg',
        'gallery'      => array(
            $img . '/2018/04/Radiation-Care-Package-Main.jpg',
            $img . '/2018/04/updated-radiation-tile-green.jpg',
            $img . '/2018/04/Radiation_Product-Tiles_focus-fun-energy_rev.jpg',
        ),
        'description'  => 'Thoughtfully curated with <strong>premium skin care, comfort items, and healthy snacks</strong> specifically chosen for radiation therapy patients. Soothe irritated skin, boost energy, and keep the mind engaged.',
        'short_desc'   => 'The Radiation Therapy Gift Basket boasts items that promote comfort and well-being — from energy-boosting snacks to premium skincare that soothes radiation effects.',
        'is_radiation'  => true,
        'categories'   => array(
            array(
                'name' => 'For Skin Relief &amp; Comfort',
                'items' => array(
                    array( 'name' => 'Lindi Skin Face Serum',       'desc' => 'Renew and replenish skin with this light, non-greasy serum aimed at reducing redness, irritation, itching and rash. (travel size)' ),
                    array( 'name' => 'Lindi Skin Body Lotion',      'desc' => 'Nourish your skin with Vitamins C &amp; E, chamomile and cucumber for maximum comfort. (travel size)' ),
                    array( 'name' => 'Dionis Goat Milk Lip Balm',   'desc' => 'Repair chapped lips with goat milk, shea butter and coconut oil.' ),
                    array( 'name' => 'Dionis Goat Milk Skin Cream', 'desc' => 'Rich, creamy unscented goat milk cream — pH similar to human skin. (3.3 oz)' ),
                    array( 'name' => 'Dry Mouth Lozenges',          'desc' => 'All-natural, sugar free lozenges — #1 Doctor recommended. Dairy free, Gluten free, Kosher.' ),
                    array( 'name' => 'Peppermint Drops',            'desc' => 'Ease nausea, headaches and dry mouth with real peppermint oil mints.' ),
                ),
            ),
            array(
                'name' => 'For Comfort &amp; Energy',
                'items' => array(
                    array( 'name' => 'Hot & Cold Eye Pillow',       'desc' => 'Silky aromatherapy pillow — microwavable or freezable. Eases headaches and aids sleep.' ),
                    array( 'name' => 'Soft & Cozy Socks',           'desc' => 'Soft and cozy socks — like a hug for your feet during treatment.' ),
                    array( 'name' => 'Queasy Pops',                 'desc' => 'Drug-free drops from natural herbs and essential oils. Doctor recommended.' ),
                    array( 'name' => 'Nut & Dried Fruit Mix',       'desc' => 'Heart healthy snack packed with fiber, antioxidants and proteins.' ),
                    array( 'name' => 'Dark Chocolate Covered Berries','desc' => 'Pomegranate, blueberries and acai with powerful antioxidants.' ),
                    array( 'name' => 'Peanut Butter Sandwich Crackers','desc' => 'Protein-filled snack for energy.' ),
                ),
            ),
            array(
                'name' => 'For Focus &amp; Fun',
                'items' => array(
                    array( 'name' => 'Puzzle Book',                 'desc' => 'Crosswords, sudoku or word search — 40-50 puzzles. (types vary)' ),
                    array( 'name' => 'Jelly Belly Cocktails',       'desc' => 'Fun mocktail jelly beans — without the hangover. Dairy Free, Gluten Free.' ),
                ),
            ),
        ),
        'related' => array(
            array( 'name' => 'Large Women\'s Chemo Care Package',      'price' => '$159.99', 'image' => $img . '/2018/04/Women-Large-Chemo-Basket-Main.jpg',          'url' => '/womens-large-chemo-basket/' ),
            array( 'name' => 'Medium Men\'s Chemo Care Package',       'price' => '$119.99', 'image' => $img . '/2018/04/Medium-Mens-Chemo-Care-Package-Main.jpg',    'url' => '/mens-medium-chemo-basket/' ),
        ),
        'reviews' => array(
            array( 'stars' => 5, 'title' => 'Exactly what was needed', 'text' => 'The skin care products were perfect for radiation side effects. My mom used everything in the box.', 'author' => 'Verified Buyer', 'date' => '01/2026', 'reply' => '' ),
            array( 'stars' => 5, 'title' => 'Wonderful gift', 'text' => 'Sent this to my aunt going through radiation. She was so touched and said the items were exactly what she needed.', 'author' => 'Verified Buyer', 'date' => '12/2025', 'reply' => '' ),
            array( 'stars' => 5, 'title' => 'Highly recommend', 'text' => 'Great quality products, fast shipping, and my friend loved every item. Will order again for others.', 'author' => 'Verified Buyer', 'date' => '11/2025', 'reply' => '' ),
        ),
    );

    // ── Product 5: Men's Medium Chemo ───────────────────────
    $products[232] = array(
        'id'           => 232,
        'slug'         => 'mens-medium-chemo-basket',
        'meta_title'   => 'Men\'s Chemo Care Package | Medium',
        'item_count'   => '15+',
        'total_sales'  => 3153,
        'review_count' => 156,
        'hero_image'   => $img . '/2018/04/Medium-Mens-Chemo-Care-Package-Main.jpg',
        'gallery'      => array(
            $img . '/2018/04/Medium-Mens-Chemo-Care-Package-Main.jpg',
            $img . '/2018/04/Mens_Chemo_Medium_Product-Tiles_dry-mouth.jpg',
            $img . '/2018/04/Mens_Chemo_Medium_Product-Tiles_nausea.jpg',
            $img . '/2018/04/Mens_Chemo_Medium_Product-Tiles_engaging-mind.jpg',
        ),
        'description'  => 'Packed with <strong>over 15 high quality products</strong> specifically chosen for men going through chemo. From skin care to comfort items to brain-engaging activities — everything he needs during treatment.',
        'short_desc'   => 'The medium men\'s chemo care package includes all essentials that ease the side effects of chemotherapy for him.',
        'is_radiation'  => false,
        'categories'   => array(
            array(
                'name' => 'For Dry Mouth, Lips &amp; Skin',
                'items' => array(
                    array( 'name' => 'Lindi Skin Face Serum',       'desc' => 'Renew and replenish skin with this light, non-greasy serum. (travel size)' ),
                    array( 'name' => 'Lindi Skin Body Lotion',      'desc' => 'Nourish skin with Vitamins C &amp; E, chamomile and cucumber. (travel size)' ),
                    array( 'name' => 'Dionis Goat Milk Lip Balm',   'desc' => 'Repair chapped lips with goat milk, shea butter and coconut oil.' ),
                    array( 'name' => 'Dionis Goat Milk Skin Cream', 'desc' => 'Rich, creamy unscented goat milk cream. (3.3 oz)' ),
                    array( 'name' => 'Dry Mouth Lozenges',          'desc' => 'All-natural, sugar free — #1 Doctor recommended. Dairy free, Gluten free, Kosher.' ),
                    array( 'name' => 'Peppermint Drops',            'desc' => 'Ease nausea, headaches and dry mouth with real peppermint oil mints.' ),
                ),
            ),
            array(
                'name' => 'For Nausea, Comfort &amp; Energy',
                'items' => array(
                    array( 'name' => 'Hot & Cold Eye Pillow',       'desc' => 'Aromatherapy pillow — microwavable or freezable. Eases nausea and headaches.' ),
                    array( 'name' => 'Soft & Cozy Socks',           'desc' => 'Warm up during chemo — centers are often chilly. Like a hug for your feet.' ),
                    array( 'name' => 'Queasy Pops',                 'desc' => 'Drug-free drops from natural herbs and essential oils. Doctor recommended.' ),
                    array( 'name' => 'Nut & Dried Fruit Mix',       'desc' => 'Heart healthy snack packed with fiber, antioxidants and proteins.' ),
                    array( 'name' => 'Dark Chocolate Covered Berries','desc' => 'Pomegranate, blueberries and acai with powerful antioxidants.' ),
                    array( 'name' => 'Peanut Butter Sandwich Crackers','desc' => 'Protein-filled snack for energy.' ),
                ),
            ),
            array(
                'name' => 'For Engaging the Mind',
                'items' => array(
                    array( 'name' => 'Puzzle Book',                 'desc' => 'Crosswords, sudoku or word search — 40-50 puzzles. (types vary)' ),
                    array( 'name' => 'Brain Teaser Puzzle',         'desc' => '3D distraction to keep mind and hands busy during treatment.' ),
                ),
            ),
            array(
                'name' => 'Just For Fun',
                'items' => array(
                    array( 'name' => 'Jelly Belly Cocktails',       'desc' => 'Fun mocktail jelly beans — without the hangover. Dairy Free, Gluten Free.' ),
                ),
            ),
        ),
        'related' => array(
            array( 'name' => 'Small Men\'s Chemo Care Package',    'price' => '$69.99',  'image' => $img . '/2018/04/Small-Mens-Chemo-Care-Package-Main.jpg',    'url' => '/mens-small-chemo-basket/' ),
            array( 'name' => 'Large Men\'s Chemo Care Package',    'price' => '$159.99', 'image' => $img . '/2018/04/Large-Mens-Chemo-Care-Package-Main.jpg',    'url' => '/mens-large-chemo-basket/' ),
        ),
        'reviews' => array(
            array( 'stars' => 5, 'title' => 'Dad loved it', 'text' => 'Sent this to my father starting chemo. He said it was the most thoughtful gift he received and used the socks and lozenges immediately.', 'author' => 'Verified Buyer', 'date' => '01/2026', 'reply' => '' ),
            array( 'stars' => 5, 'title' => 'Perfect for my husband', 'text' => 'Everything in the box was practical and high quality. My husband actually used every item during his treatment.', 'author' => 'Verified Buyer', 'date' => '12/2025', 'reply' => '' ),
            array( 'stars' => 5, 'title' => 'Great gift idea', 'text' => 'Didn\'t know what to get my friend starting chemo. This was perfect — he said it made him feel cared for.', 'author' => 'Verified Buyer', 'date' => '11/2025', 'reply' => '' ),
        ),
    );

    return array( 'shared' => $shared, 'products' => $products );
}

/**
 * Get a single product's landing page data by WooCommerce product ID.
 */
function rtt_lp_get_product_data( $product_id ) {
    $all  = rtt_lp_get_all_product_data();
    $pid  = intval( $product_id );
    if ( isset( $all['products'][ $pid ] ) ) {
        return array(
            'product' => $all['products'][ $pid ],
            'shared'  => $all['shared'],
        );
    }
    return false;
}
