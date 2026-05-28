<?php

declare(strict_types=1);

/**
 * Fusion catalogue back-office : registre produits + contenu.json + valeurs front (app.js).
 */

/** @return array<string, array<string, mixed>> */
function sucrier_catalog_front_defaults_map(): array
{
    static $map = null;
    if ($map !== null) {
        return $map;
    }

    $path = __DIR__ . '/../data/catalog-front-defaults.json';
    $raw = is_readable($path) ? file_get_contents($path) : '{}';
    $decoded = json_decode($raw ?: '{}', true);
    $map = is_array($decoded) ? $decoded : [];

    return $map;
}

/** @param array<string, mixed> $row */
function sucrier_normalize_admin_book_row(array $row, string $id): array
{
    $defaults = sucrier_catalog_front_defaults_map()[$id] ?? [];

    $merged = array_merge([
        'id' => $id,
        'display_order' => 0,
        'collection' => '',
        'title' => '',
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
        'badge_new' => false,
        'badge_bestseller' => false,
        'badge_award' => false,
        'hide_isbn' => false,
        'hide_format' => false,
        'hide_pages' => false,
        'hide_publication_date' => false,
        'hide_languages' => false,
        'label_isbn' => '',
        'label_format' => '',
        'label_pages' => '',
        'label_publication_date' => '',
    ], $defaults, $row);

    $merged['id'] = $id;
    $merged['display_order'] = max(0, (int) ($merged['display_order'] ?? 0));
    $merged['coming_soon'] = !empty($merged['coming_soon']);
    foreach (['badge_new', 'badge_bestseller', 'badge_award', 'hide_isbn', 'hide_format', 'hide_pages', 'hide_publication_date', 'hide_languages'] as $flag) {
        $merged[$flag] = !empty($merged[$flag]);
    }

    return $merged;
}

/** @return array<string, mixed> */
function sucrier_seed_admin_book_row(string $id): array
{
    $title = $id;
    foreach (sucrier_catalog_product_registry() as $reg) {
        if (($reg['id'] ?? '') === $id) {
            $title = (string) ($reg['title'] ?? $id);
            break;
        }
    }

    return sucrier_normalize_admin_book_row(['id' => $id, 'title' => $title], $id);
}

/**
 * Liste complète des produits éditables.
 *
 * Source de vérité:
 * - ordre et contenu de catalogue_books (contenu.json),
 * - puis ajout des IDs du registre absents du CMS en fin de liste.
 *
 * @return list<array<string, mixed>>
 */
function sucrier_build_admin_catalog_rows(array $contenu): array
{
    $rows = $contenu['catalogue_books'] ?? [];
    if (!is_array($rows)) {
        $rows = [];
    }

    $out = [];
    $seen = [];
    foreach ($rows as $index => $row) {
        if (!is_array($row)) {
            continue;
        }
        $id = trim((string) ($row['id'] ?? ''));
        if ($id === '' || sucrier_is_admin_catalog_excluded($id, $contenu) || isset($seen[$id])) {
            continue;
        }
        $seen[$id] = true;
        $normalized = sucrier_normalize_admin_book_row($row, $id);
        if ((int) ($normalized['display_order'] ?? 0) <= 0) {
            $normalized['display_order'] = $index + 1;
        }
        $normalized['_source_index'] = $index;
        $out[] = $normalized;
    }

    foreach (sucrier_catalog_product_registry() as $reg) {
        $id = trim((string) ($reg['id'] ?? ''));
        if ($id === '' || sucrier_is_admin_catalog_excluded($id, $contenu) || isset($seen[$id])) {
            continue;
        }
        $seen[$id] = true;
        $seed = sucrier_seed_admin_book_row($id);
        $seed['display_order'] = count($out) + 1;
        $seed['_source_index'] = 100000 + count($out);
        $out[] = $seed;
    }

    usort($out, static function (array $a, array $b): int {
        $aOrder = (int) ($a['display_order'] ?? 0);
        $bOrder = (int) ($b['display_order'] ?? 0);
        if ($aOrder !== $bOrder) {
            return $aOrder <=> $bOrder;
        }

        return ((int) ($a['_source_index'] ?? 0)) <=> ((int) ($b['_source_index'] ?? 0));
    });

    $out = array_map(static function (array $row): array {
        unset($row['_source_index']);
        return $row;
    }, $out);

    return $out;
}

/** @param array<string, mixed> $book */
function sucrier_admin_book_row_to_json(array $book): array
{
    $clean = [
        'id' => trim((string) ($book['id'] ?? '')),
        'display_order' => max(0, (int) ($book['display_order'] ?? 0)),
        'collection' => trim((string) ($book['collection'] ?? '')),
        'title' => trim((string) ($book['title'] ?? '')),
        'authors' => trim((string) ($book['authors'] ?? '')),
        'price' => trim((string) ($book['price'] ?? '')),
        'description' => trim((string) ($book['description'] ?? '')),
        'image' => trim((string) ($book['image'] ?? '')),
        'preview_images' => trim((string) ($book['preview_images'] ?? '')),
        'pedagogical_file' => trim((string) ($book['pedagogical_file'] ?? '')),
        'catalog_category' => trim((string) ($book['catalog_category'] ?? '')),
        'isbn' => trim((string) ($book['isbn'] ?? '')),
        'format' => trim((string) ($book['format'] ?? '')),
        'pages' => trim((string) ($book['pages'] ?? '')),
        'age_range' => trim((string) ($book['age_range'] ?? '')),
        'languages' => trim((string) ($book['languages'] ?? '')),
        'publication_date' => trim((string) ($book['publication_date'] ?? '')),
        'coming_soon' => !empty($book['coming_soon']),
        'badge_new' => !empty($book['badge_new']),
        'badge_bestseller' => !empty($book['badge_bestseller']),
        'badge_award' => !empty($book['badge_award']),
        'hide_isbn' => !empty($book['hide_isbn']),
        'hide_format' => !empty($book['hide_format']),
        'hide_pages' => !empty($book['hide_pages']),
        'hide_publication_date' => !empty($book['hide_publication_date']),
        'hide_languages' => !empty($book['hide_languages']),
    ];

    $weight = (int) ($book['weight_g'] ?? 0);
    if ($weight > 0) {
        $clean['weight_g'] = $weight;
    }

    foreach (['label_isbn', 'label_format', 'label_pages', 'label_publication_date'] as $labelKey) {
        $val = trim((string) ($book[$labelKey] ?? ''));
        if ($val !== '') {
            $clean[$labelKey] = $val;
        }
    }

    if ($clean['display_order'] <= 0) {
        unset($clean['display_order']);
    }

    return $clean;
}
