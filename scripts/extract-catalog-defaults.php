<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$js = file_get_contents($root . '/app.js');
if ($js === false) {
    fwrite(STDERR, "Cannot read app.js\n");
    exit(1);
}

$skipIds = [
    'nikou', 'bebe-nikou', 'exocette', 'tice-et-metice', 'alice-et-jacob',
    'w-deroche', 'l-ramassamy', 'patrick-petito', 'ojf-junior', 'jf-silva',
    'k-petevi', 'renata', 'collectif', 'rolyne-pam',
];

$newIds = ['nikou-champion', 'circuit-ferme', 'exocette', 'tice-et-metice'];
$bestIds = ['nikou-champion', 'circuit-ferme', 'exocette', 'tice-et-metice', 'nikou-musicien-album', 'le-carnaval-de-nikou'];
$awardIds = ['exocette', 'exocette-et-la-mer-de-plastique'];

$catalogPos = strpos($js, 'var BOOK_CATALOG_DEFAULT = {');
if ($catalogPos === false) {
    fwrite(STDERR, "BOOK_CATALOG_DEFAULT not found\n");
    exit(1);
}
$js = substr($js, $catalogPos);
$heroPos = strpos($js, 'var CATALOG_FILTER_GROUPS_DEFAULT');
if ($heroPos !== false) {
    $js = substr($js, 0, $heroPos);
}

$products = [];
$offset = 0;
$len = strlen($js);

while (preg_match('/\n    "([a-z0-9-]+)": \{/s', $js, $idm, PREG_OFFSET_CAPTURE, $offset)) {
    $id = $idm[1][0];
    $start = (int) $idm[0][1];
    if (in_array($id, $skipIds, true)) {
        $offset = $start + 1;
        continue;
    }

    $nextStart = $len;
    if (preg_match('/\n    "[a-z0-9-]+": \{/s', $js, $nextm, PREG_OFFSET_CAPTURE, $start + 5)) {
        $nextStart = (int) $nextm[0][1];
    }
    $block = substr($js, $start, $nextStart - $start);
    $offset = $nextStart;

    if (!preg_match('/\btitle:\s*"([^"]*)"/', $block, $tm)) {
        continue;
    }

    $row = [
        'id' => $id,
        'title' => $tm[1],
        'collection' => '',
        'authors' => '',
        'price' => '',
        'description' => '',
        'image' => '',
        'preview_images' => '',
        'pedagogical_file' => '',
        'catalog_category' => '',
        'isbn' => '',
        'format' => '',
        'pages' => '',
        'age_range' => '',
        'languages' => '',
        'publication_date' => '',
        'weight_g' => '',
        'coming_soon' => false,
        'badge_new' => in_array($id, $newIds, true),
        'badge_bestseller' => in_array($id, $bestIds, true),
        'badge_award' => in_array($id, $awardIds, true),
        'hide_isbn' => false,
        'hide_format' => false,
        'hide_pages' => false,
        'hide_publication_date' => false,
        'hide_languages' => false,
        'label_isbn' => '',
        'label_format' => '',
        'label_pages' => '',
        'label_publication_date' => '',
    ];

    if (preg_match('/\bcollection:\s*"([^"]*)"/', $block, $cm)) {
        $row['collection'] = $cm[1];
    }
    if (preg_match('/\bprice:\s*([0-9.]+)/', $block, $pm)) {
        $euros = (float) $pm[1];
        $row['price'] = number_format($euros, 2, ',', ' ') . ' €';
    }
    if (preg_match('/\bcover:\s*"([^"]*)"/', $block, $cov)) {
        $row['image'] = $cov[1];
    }
    if (preg_match('/\bgallery:\s*\[([^\]]*)\]/s', $block, $gm)) {
        preg_match_all('/"([^"]+)"/', $gm[1], $imgs);
        $row['preview_images'] = implode(',', $imgs[1] ?? []);
    }
    if (preg_match('/\bcatalogCategory:\s*"([^"]*)"/', $block, $cc)) {
        $row['catalog_category'] = $cc[1];
    }
    if (preg_match('/\bageGroup:\s*"([^"]*)"/', $block, $ag)) {
        $row['age_range'] = $ag[1];
    }
    if (strpos($block, 'hideIsbn: true') !== false) {
        $row['hide_isbn'] = true;
    }
    if (strpos($block, 'hidePublicationDate: true') !== false) {
        $row['hide_publication_date'] = true;
    }
    if (strpos($block, 'hideLanguages: true') !== false) {
        $row['hide_languages'] = true;
    }
    if (strpos($block, 'comingSoon: true') !== false) {
        $row['coming_soon'] = true;
    }
    if (preg_match('/\bisbn:\s*"([^"]*)"/', $block, $is)) {
        $row['isbn'] = $is[1];
    }
    if (preg_match('/\bformat:\s*"([^"]*)"/', $block, $fm)) {
        $row['format'] = $fm[1];
    }
    if (preg_match('/\bpages:\s*"([^"]*)"/', $block, $pg)) {
        $row['pages'] = $pg[1];
    }
    if (preg_match('/\bpublicationDate:\s*"([^"]*)"/', $block, $pd)) {
        $row['publication_date'] = $pd[1];
    }
    if (preg_match('/\bweightG:\s*([0-9]+)/', $block, $wg)) {
        $row['weight_g'] = (int) $wg[1];
    }
    if (preg_match('/\bdescription:\s*"((?:[^"\\\\]|\\\\.)*)"/s', $block, $dm)) {
        $row['description'] = stripcslashes($dm[1]);
    }

    $products[$id] = $row;
}

if (count($products) === 0) {
    preg_match_all('/\n    "([a-z0-9-]+)": \{/s', $js, $dbg);
    fwrite(STDERR, 'Debug keys found: ' . count($dbg[1] ?? []) . PHP_EOL);
    if (!empty($dbg[1])) {
        fwrite(STDERR, implode(', ', array_slice($dbg[1], 0, 5)) . PHP_EOL);
    }
}

$outPath = $root . '/data/catalog-front-defaults.json';
file_put_contents($outPath, json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
echo 'Wrote ' . count($products) . ' products to ' . $outPath . PHP_EOL;
