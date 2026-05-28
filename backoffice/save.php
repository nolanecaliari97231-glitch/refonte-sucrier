<?php
require __DIR__ . '/init.php';

/**
 * Point central de sauvegarde du backoffice.
 *
 * Ce script:
 * - valide la requete POST + CSRF,
 * - met a jour contenu.json (textes/pages/catalogue),
 * - gere les uploads images/fichiers pedagogiques,
 * - reconstruit le stock catalogue via catalog_stock.
 */
sucrier_require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: dashboard.php');
    exit;
}

if (!sucrier_validate_csrf_from_post()) {
    http_response_code(403);
    exit('Requete invalide (CSRF).');
}

$paths = sucrier_content_paths();
$contentPath = $paths['content'];
$backupPath = $paths['backup'];
$uploadDirFs = $paths['uploads_fs'];
$uploadDirWeb = $paths['uploads_web'];

$catalogueDefaultPage = [
    'title' => 'Catalogue',
    'intro' => 'Albums jeunesse et collections des Editions du Sucrier',
];
$catalogueDefaultFilterGroups = [
    ['id' => 'albums', 'label_fr' => 'Albums de jeunesse', 'label_en' => "Children's albums", 'parent' => '', 'is_group' => false],
    ['id' => 'cahiers', 'label_fr' => 'Cahiers d\'activités', 'label_en' => 'Activity workbooks', 'parent' => '', 'is_group' => false],
    ['id' => 'bebe-nikou', 'label_fr' => 'Collection Bébé Nikou', 'label_en' => 'Baby Nikou collection', 'parent' => '', 'is_group' => false],
    ['id' => 'autres-produits', 'label_fr' => 'Nos autres produits', 'label_en' => 'Other products', 'parent' => '', 'is_group' => true],
    ['id' => 'posters', 'label_fr' => 'Posters', 'label_en' => 'Posters', 'parent' => 'autres-produits', 'is_group' => false],
    ['id' => 'bons-points', 'label_fr' => 'Bons points', 'label_en' => 'Reward charts', 'parent' => 'autres-produits', 'is_group' => false],
    ['id' => 'sous-mains', 'label_fr' => 'Sous-mains', 'label_en' => 'Desk pads', 'parent' => 'autres-produits', 'is_group' => false],
    ['id' => 'autres', 'label_fr' => 'Autres', 'label_en' => 'Other', 'parent' => 'autres-produits', 'is_group' => false],
];
$catalogueDefaultBooks = [
    [
        'id' => 'nikou-champion',
        'collection' => 'Nikou',
        'title' => 'Nikou champion',
        'authors' => 'Léanne Ramassamy · Wilfried Deroche',
        'price' => '10,00 €',
        'image' => 'images/catalog/nikou-champion-cover.webp',
        'preview_images' => 'images/catalog/nikou-champion-cover.webp,images/catalog/nikou-champion-planche-sports.png,images/catalog/nikou-champion-planche-athletisme.png',
    ],
    [
        'id' => 'circuit-ferme',
        'collection' => 'Bulles de Sucrier',
        'title' => 'Circuit ferme',
        'authors' => 'Jean Francisco Silva · Jean Fritz Junior ODNÉ',
        'price' => '16,00 €',
        'image' => 'images/catalog/circuit-ferme-premiere-couverture.webp',
        'preview_images' => 'images/catalog/circuit-ferme-premiere-couverture.webp,images/catalog/lettres-ou-betes.webp,images/catalog/tice-et-metice-premiere-couverture.webp',
    ],
    [
        'id' => 'exocette',
        'collection' => 'Les histoires du Sucrier',
        'title' => 'Exocette',
        'authors' => 'Renata · W. Deroche',
        'price' => '14,00 €',
        'image' => 'images/catalog/exocette-premiere-couverture.webp',
        'preview_images' => 'images/catalog/exocette-premiere-couverture.webp,images/catalog/nikou-musicien.webp,images/catalog/circuit-ferme-premiere-couverture.webp',
    ],
    [
        'id' => 'tice-et-metice',
        'collection' => 'Les histoires du Sucrier',
        'title' => 'Tice et Métice',
        'authors' => 'Karine Petevi · Gecko Dalch',
        'price' => '13,00 €',
        'image' => 'images/catalog/tice-et-metice-premiere-couverture.webp',
        'preview_images' => 'images/catalog/tice-et-metice-premiere-couverture.webp,images/catalog/tice-et-metice-planche-interieure.webp,images/catalog/tice-et-metice-quatrieme-couverture.webp',
    ],
];

sucrier_ensure_upload_dirs();
$newData = $contenu;
$action = (string) ($_POST['action'] ?? '');

if ($action === 'restore_backup') {
    if (is_file($backupPath)) {
        copy($backupPath, $contentPath);
        header('Location: dashboard.php?saved=1&action=restore_backup');
        exit;
    }
    header('Location: dashboard.php?saved=1');
    exit;
}

if (is_file($contentPath)) {
    copy($contentPath, $backupPath);
}

$newData['home_page']['hero_tag'] = trim((string) ($_POST['home_hero_tag'] ?? ''));
$newData['home_page']['hero_title'] = trim((string) ($_POST['home_hero_title'] ?? ''));
$newData['home_page']['hero_intro'] = trim((string) ($_POST['home_hero_intro'] ?? ''));
$newData['home_page']['hero_motto'] = trim((string) ($_POST['home_hero_motto'] ?? ''));
$newData['home_page']['cta_primary_text'] = trim((string) ($_POST['home_cta_primary_text'] ?? ''));
$newData['home_page']['cta_primary_link'] = trim((string) ($_POST['home_cta_primary_link'] ?? ''));
$newData['home_page']['cta_secondary_text'] = trim((string) ($_POST['home_cta_secondary_text'] ?? ''));
$newData['home_page']['cta_secondary_link'] = trim((string) ($_POST['home_cta_secondary_link'] ?? ''));
$newData['home_page']['hero_image'] = trim((string) ($_POST['home_hero_image'] ?? ($newData['home_page']['hero_image'] ?? '')));
$newData['home_page']['hero_book_cover'] = trim((string) ($_POST['home_hero_book_cover'] ?? ($newData['home_page']['hero_book_cover'] ?? '')));
$newData['home_page']['hero_background_image'] = trim((string) ($_POST['home_hero_background_image'] ?? ($newData['home_page']['hero_background_image'] ?? '')));

foreach (
    [
        'home_hero_image_file' => 'hero_image',
        'home_hero_book_cover_file' => 'hero_book_cover',
        'home_hero_background_file' => 'hero_background_image',
    ] as $field => $key
) {
    $uploaded = sucrier_upload_image_file($field, $uploadDirFs, $uploadDirWeb);
    if ($uploaded !== null) {
        $newData['home_page'][$key] = $uploaded;
    }
}

$readingValidIds = array_flip(sucrier_valid_reading_pick_product_ids($newData));
$readingFeatured = trim((string) ($_POST['reading_featured_product_id'] ?? ''));
if ($readingFeatured !== '' && !isset($readingValidIds[$readingFeatured])) {
    $readingFeatured = '';
}
$newData['reading_recommendations']['featured_product_id'] = $readingFeatured;
$readingSecondaryRaw = $_POST['reading_secondary_product_id'] ?? [];
if (!is_array($readingSecondaryRaw)) {
    $readingSecondaryRaw = [];
}
$readingSecondaryOut = [];
foreach ($readingSecondaryRaw as $secondaryId) {
    $id = trim((string) $secondaryId);
    if ($id === '' || !isset($readingValidIds[$id]) || in_array($id, $readingSecondaryOut, true)) {
        continue;
    }
    $readingSecondaryOut[] = $id;
    if (count($readingSecondaryOut) >= 4) {
        break;
    }
}
$newData['reading_recommendations']['secondary_product_ids'] = $readingSecondaryOut;

$newData['about_page']['title'] = trim((string) ($_POST['about_title'] ?? ''));
$newData['about_page']['intro'] = trim((string) ($_POST['about_intro'] ?? ''));
$newData['about_page']['paragraphe_1'] = trim((string) ($_POST['about_p1'] ?? ''));
$newData['about_page']['paragraphe_2'] = trim((string) ($_POST['about_p2'] ?? ''));
$newData['about_page']['paragraphe_3'] = trim((string) ($_POST['about_p3'] ?? ''));
$newData['about_page']['paragraphe_4'] = trim((string) ($_POST['about_p4'] ?? ''));
$newData['about_page']['paragraphe_5'] = trim((string) ($_POST['about_p5'] ?? ''));

$newData['news_page']['title'] = trim((string) ($_POST['news_title'] ?? ''));
$newData['news_page']['intro'] = trim((string) ($_POST['news_intro'] ?? ''));

$newsCount = max(0, (int) ($_POST['news_count'] ?? 0));
$newsOut = [];
for ($n = 0; $n < $newsCount; $n++) {
    if (isset($_POST['news_' . $n . '_remove'])) {
        continue;
    }
    $item = [
        'id' => trim((string) ($_POST['news_' . $n . '_id'] ?? '')),
        'tag' => trim((string) ($_POST['news_' . $n . '_tag'] ?? 'nouveau')),
        'tag_label' => trim((string) ($_POST['news_' . $n . '_tag_label'] ?? '')),
        'title' => trim((string) ($_POST['news_' . $n . '_title'] ?? '')),
        'date' => trim((string) ($_POST['news_' . $n . '_date'] ?? '')),
        'image' => trim((string) ($_POST['news_' . $n . '_image'] ?? '')),
        'link' => trim((string) ($_POST['news_' . $n . '_link'] ?? '')),
    ];
    if ($item['id'] === '') {
        $item['id'] = 'actu-' . ($n + 1);
    }
    $uploadedNews = sucrier_upload_image_file('news_' . $n . '_image_file', $uploadDirFs, $uploadDirWeb);
    if ($uploadedNews !== null) {
        $item['image'] = $uploadedNews;
    }
    $newsOut[] = $item;
}
if ($action === 'add_news') {
    $newsOut[] = [
        'id' => 'actu-' . (count($newsOut) + 1),
        'tag' => 'nouveau',
        'tag_label' => 'Nouveau',
        'title' => 'Nouvelle actualité',
        'date' => date('Y'),
        'image' => '',
        'link' => '',
    ];
}
$newData['news_items'] = $newsOut;

$newData['promo_codes'] = sucrier_promo_codes_from_post($_POST, $action);

if ($action === 'reset_catalogue') {
    $newData['catalogue_page'] = $catalogueDefaultPage;
    $newData['catalogue_books'] = $catalogueDefaultBooks;
    $newData['catalogue_removed_ids'] = [];
    $newData['catalogue_filter_groups'] = $catalogueDefaultFilterGroups;
} else {
    $newData['catalogue_page']['title'] = trim((string) ($_POST['catalogue_title'] ?? ''));
    $newData['catalogue_page']['intro'] = trim((string) ($_POST['catalogue_intro'] ?? ''));

    $bookCount = max(0, (int) ($_POST['book_count'] ?? 0));
    $booksOut = [];
    $removedIds = is_array($newData['catalogue_removed_ids'] ?? null) ? $newData['catalogue_removed_ids'] : [];
    for ($i = 0; $i < $bookCount; $i++) {
        $postedIdEarly = trim((string) ($_POST['book_' . $i . '_id'] ?? ''));
        if (isset($_POST['book_' . $i . '_remove_book'])) {
            $idToRemove = $postedIdEarly !== ''
                ? $postedIdEarly
                : trim((string) (($newData['catalogue_books'][$i]['id'] ?? '')));
            if ($idToRemove !== '') {
                $removedIds[] = $idToRemove;
            }
            continue;
        }

        $book = [];
        $book['collection'] = trim((string) ($_POST['book_' . $i . '_collection'] ?? ''));
        $book['title'] = trim((string) ($_POST['book_' . $i . '_title'] ?? ''));
        $book['authors'] = trim((string) ($_POST['book_' . $i . '_authors'] ?? ''));
        $book['price'] = trim((string) ($_POST['book_' . $i . '_price'] ?? ''));
        $book['description'] = trim((string) ($_POST['book_' . $i . '_description'] ?? ''));
        $weightG = (int) ($_POST['book_' . $i . '_weight_g'] ?? 0);
        if ($weightG > 0) {
            $book['weight_g'] = $weightG;
        }
        $book['image'] = trim((string) ($_POST['book_' . $i . '_image'] ?? ''));
        $book['preview_images'] = trim((string) ($_POST['book_' . $i . '_preview_images'] ?? ''));
        $book['pedagogical_file'] = trim((string) ($_POST['book_' . $i . '_pedagogical_file'] ?? ''));
        $book['catalog_category'] = trim((string) ($_POST['book_' . $i . '_catalog_category'] ?? ''));
        $book['isbn'] = trim((string) ($_POST['book_' . $i . '_isbn'] ?? ''));
        $book['format'] = trim((string) ($_POST['book_' . $i . '_format'] ?? ''));
        $book['pages'] = trim((string) ($_POST['book_' . $i . '_pages'] ?? ''));
        $book['age_range'] = trim((string) ($_POST['book_' . $i . '_age_range'] ?? ''));
        $book['languages'] = trim((string) ($_POST['book_' . $i . '_languages'] ?? ''));
        $book['publication_date'] = trim((string) ($_POST['book_' . $i . '_publication_date'] ?? ''));
        $book['coming_soon'] = isset($_POST['book_' . $i . '_coming_soon']);
        $book['badge_new'] = isset($_POST['book_' . $i . '_badge_new']);
        $book['badge_bestseller'] = isset($_POST['book_' . $i . '_badge_bestseller']);
        $book['badge_award'] = isset($_POST['book_' . $i . '_badge_award']);
        $book['hide_isbn'] = isset($_POST['book_' . $i . '_hide_isbn']);
        $book['hide_format'] = isset($_POST['book_' . $i . '_hide_format']);
        $book['hide_pages'] = isset($_POST['book_' . $i . '_hide_pages']);
        $book['hide_publication_date'] = isset($_POST['book_' . $i . '_hide_publication_date']);
        $book['hide_languages'] = isset($_POST['book_' . $i . '_hide_languages']);
        $book['label_isbn'] = trim((string) ($_POST['book_' . $i . '_label_isbn'] ?? ''));
        $book['label_format'] = trim((string) ($_POST['book_' . $i . '_label_format'] ?? ''));
        $book['label_pages'] = trim((string) ($_POST['book_' . $i . '_label_pages'] ?? ''));
        $book['label_publication_date'] = trim((string) ($_POST['book_' . $i . '_label_publication_date'] ?? ''));
        $postedId = trim((string) ($_POST['book_' . $i . '_id'] ?? ''));
        $book['id'] = $postedId !== '' ? $postedId : trim((string) (($newData['catalogue_books'][$i]['id'] ?? sucrier_make_book_id($book['title'], $i))));

        if (isset($_POST['book_' . $i . '_remove_image'])) {
            $book['image'] = '';
        }
        if (isset($_POST['book_' . $i . '_remove_previews'])) {
            $book['preview_images'] = '';
        }
        if (isset($_POST['book_' . $i . '_remove_pedagogical'])) {
            $book['pedagogical_file'] = '';
        }

        $uploadedMain = sucrier_upload_image_file('book_' . $i . '_image_file', $uploadDirFs, $uploadDirWeb);
        if ($uploadedMain !== null) {
            $book['image'] = $uploadedMain;
        }

        $uploadedPreviews = sucrier_upload_preview_files('book_' . $i . '_preview_files', $uploadDirFs, $uploadDirWeb);
        if (!empty($uploadedPreviews)) {
            $book['preview_images'] = implode(',', $uploadedPreviews);
        }

        $uploadedPed = sucrier_upload_pedagogical_file('book_' . $i . '_pedagogical_upload', $book['id']);
        if ($uploadedPed !== null) {
            $book['pedagogical_file'] = $uploadedPed;
        }

        // Le stock est piloté uniquement via la table "Stocks du catalogue".
        unset($book['stock_qty']);

        $displayOrderRaw = (int) ($_POST['book_' . $i . '_display_order'] ?? ($i + 1));
        if ($displayOrderRaw < 1) {
            $displayOrderRaw = $i + 1;
        }
        $displayOrderOriginal = (int) ($_POST['book_' . $i . '_display_order_original'] ?? ($i + 1));
        if ($displayOrderOriginal < 1) {
            $displayOrderOriginal = $i + 1;
        }
        $book['display_order'] = $displayOrderRaw;
        $booksOut[] = [
            'order' => $displayOrderRaw,
            'changed' => $displayOrderRaw !== $displayOrderOriginal ? 1 : 0,
            'seq' => $i,
            'book' => sucrier_admin_book_row_to_json($book),
        ];
    }

    if ($action === 'add_book') {
        $booksOut[] = [
            'order' => count($booksOut) + 1,
            'changed' => 1,
            'seq' => $bookCount + 1,
            'book' => sucrier_admin_book_row_to_json([
            'id' => 'produit-' . (count($booksOut) + 1),
            'collection' => 'Nouvelle collection',
            'title' => 'Nouveau produit',
            'authors' => 'Auteur',
            'price' => '0,00 €',
            'image' => '',
            'preview_images' => '',
            'description' => '',
            'pedagogical_file' => '',
            'catalog_category' => 'albums',
            'display_order' => count($booksOut) + 1,
            ]),
        ];
    }

    usort($booksOut, static function (array $a, array $b): int {
        $orderCmp = ((int) ($a['order'] ?? 0)) <=> ((int) ($b['order'] ?? 0));
        if ($orderCmp !== 0) {
            return $orderCmp;
        }
        $changedCmp = ((int) ($b['changed'] ?? 0)) <=> ((int) ($a['changed'] ?? 0));
        if ($changedCmp !== 0) {
            return $changedCmp;
        }

        return ((int) ($a['seq'] ?? 0)) <=> ((int) ($b['seq'] ?? 0));
    });

    foreach ($booksOut as $index => &$entry) {
        if (is_array($entry['book'] ?? null)) {
            $entry['book']['display_order'] = $index + 1;
        }
    }
    unset($entry);

    $booksOut = array_values(array_map(
        static fn(array $entry): array => is_array($entry['book'] ?? null) ? $entry['book'] : [],
        $booksOut
    ));

    $newData['catalogue_books'] = $booksOut;

    $activeIds = array_map(static fn(array $book): string => (string) ($book['id'] ?? ''), $booksOut);
    $removedIds = array_values(array_unique(array_filter(array_map(
        static fn($id): string => trim((string) $id),
        array_diff($removedIds, $activeIds)
    ))));
    $newData['catalogue_removed_ids'] = $removedIds;
}

$catalogStockOut = [];
if (isset($_POST['stock_qty']) && is_array($_POST['stock_qty'])) {
    foreach ($_POST['stock_qty'] as $productId => $qtyRaw) {
        $productId = trim((string) $productId);
        if ($productId === '') {
            continue;
        }
        if ($qtyRaw === '' || $qtyRaw === null) {
            continue;
        }
        $qty = (int) $qtyRaw;
        if ($qty < 0) {
            $qty = 0;
        }
        $catalogStockOut[$productId] = $qty;
    }
}
$newData['catalog_stock'] = empty($catalogStockOut) ? (object) [] : $catalogStockOut;

$filterGroupCount = max(0, (int) ($_POST['filter_group_count'] ?? 0));
$filterGroupsOut = [];
for ($f = 0; $f < $filterGroupCount; $f++) {
    if (isset($_POST['filter_' . $f . '_remove'])) {
        continue;
    }
    $filterId = trim((string) ($_POST['filter_' . $f . '_id'] ?? ''));
    if ($filterId === '') {
        continue;
    }
    $filterGroupsOut[] = [
        'id' => $filterId,
        'label_fr' => trim((string) ($_POST['filter_' . $f . '_label_fr'] ?? '')),
        'label_en' => trim((string) ($_POST['filter_' . $f . '_label_en'] ?? '')),
        'parent' => trim((string) ($_POST['filter_' . $f . '_parent'] ?? '')),
        'is_group' => isset($_POST['filter_' . $f . '_is_group']),
    ];
}
if ($action === 'add_filter_group') {
    $filterGroupsOut[] = [
        'id' => 'rayon-' . (count($filterGroupsOut) + 1),
        'label_fr' => 'Nouveau rayon',
        'label_en' => 'New section',
        'parent' => 'autres-produits',
        'is_group' => false,
    ];
}
if ($filterGroupCount > 0 || $action === 'add_filter_group') {
    $newData['catalogue_filter_groups'] = !empty($filterGroupsOut) ? $filterGroupsOut : $catalogueDefaultFilterGroups;
}

$newData['contact_page']['title'] = trim((string) ($_POST['contact_title'] ?? ''));
$newData['contact_page']['intro'] = trim((string) ($_POST['contact_intro'] ?? ''));
$newData['contact_page']['bloc_titre'] = trim((string) ($_POST['contact_bloc_titre'] ?? ''));
$newData['contact_page']['bloc_texte'] = trim((string) ($_POST['contact_bloc_texte'] ?? ''));
$newData['contact_page']['adresse_label'] = trim((string) ($_POST['contact_adresse_label'] ?? ''));
$newData['contact_page']['adresse_texte'] = trim((string) ($_POST['contact_adresse_texte'] ?? ''));
$newData['contact_page']['telephone_label'] = trim((string) ($_POST['contact_telephone_label'] ?? ''));
$newData['contact_page']['telephone'] = trim((string) ($_POST['contact_telephone'] ?? ''));
$newData['contact_page']['retour_texte'] = trim((string) ($_POST['contact_retour_texte'] ?? ''));

$newData['ecommerce']['cart_note'] = trim((string) ($_POST['ecom_cart_note'] ?? ''));
$newData['ecommerce']['shipping_note'] = trim((string) ($_POST['ecom_shipping_note'] ?? ''));
$newData['ecommerce']['support_email'] = trim((string) ($_POST['ecom_support_email'] ?? ''));
$newData['ecommerce']['support_phone'] = trim((string) ($_POST['ecom_support_phone'] ?? ''));

$newData['footer']['brand_name'] = trim((string) ($_POST['footer_brand_name'] ?? ''));
$newData['footer']['brand_tagline'] = trim((string) ($_POST['footer_brand_tagline'] ?? ''));
$newData['footer']['description'] = trim((string) ($_POST['footer_description'] ?? ''));
$newData['footer']['ville'] = trim((string) ($_POST['footer_ville'] ?? ''));
$newData['footer']['telephone'] = trim((string) ($_POST['footer_tel'] ?? ''));
$newData['footer']['copyright'] = trim((string) ($_POST['footer_copyright'] ?? ''));
$newData['footer']['mentions_legales'] = trim((string) ($_POST['footer_mentions_legales'] ?? ''));
$newData['footer']['confidentialite'] = trim((string) ($_POST['footer_confidentialite'] ?? ''));
$newData['footer']['cgv'] = trim((string) ($_POST['footer_cgv'] ?? ''));

if (!sucrier_save_content_json($newData)) {
    http_response_code(500);
    exit('Impossible de sauvegarder le contenu.');
}

if ($action !== '') {
    header('Location: dashboard.php?saved=1&action=' . urlencode($action));
    exit;
}
header('Location: dashboard.php?saved=1');
exit;
