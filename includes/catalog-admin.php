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
 * Liste complète des produits éditables (ordre registre + entrées CMS hors registre).
 *
 * @return list<array<string, mixed>>
 */
function sucrier_build_admin_catalog_rows(array $contenu): array
{
    $existingById = [];
    $rows = $contenu['catalogue_books'] ?? [];
    if (is_array($rows)) {
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $id = trim((string) ($row['id'] ?? ''));
            if ($id === '') {
                continue;
            }
            $existingById[$id] = $row;
        }
    }

    $out = [];
    $seen = [];

    foreach (sucrier_catalog_product_registry() as $reg) {
        $id = trim((string) ($reg['id'] ?? ''));
        if ($id === '' || sucrier_is_admin_catalog_excluded($id, $contenu)) {
            continue;
        }
        $seen[$id] = true;
        if (isset($existingById[$id])) {
            $out[] = sucrier_normalize_admin_book_row($existingById[$id], $id);
        } else {
            $out[] = sucrier_seed_admin_book_row($id);
        }
    }

    foreach ($existingById as $id => $row) {
        if (isset($seen[$id]) || sucrier_is_admin_catalog_excluded($id, $contenu)) {
            continue;
        }
        $out[] = sucrier_normalize_admin_book_row($row, $id);
    }

    return $out;
}

/** @param array<string, mixed> $book */
function sucrier_admin_book_row_to_json(array $book): array
{
    $clean = [
        'id' => trim((string) ($book['id'] ?? '')),
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

    return $clean;
}
