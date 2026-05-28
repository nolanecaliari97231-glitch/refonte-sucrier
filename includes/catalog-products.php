<?php

declare(strict_types=1);

/**
 * Outils catalogue partages (backoffice + API):
 * - registre des produits connus,
 * - lecture/normalisation du stock (catalog_stock),
 * - verification serveur des quantites commandables.
 */
/**
 * Registre des produits du catalogue (IDs alignés sur app.js / BOOK_CATALOG).
 * Utilisé par le back-office pour gérer les stocks de tous les articles.
 */
function sucrier_catalog_product_registry(): array
{
    return [
        ['id' => 'peluche-nikou', 'title' => 'La peluche de Nikou'],
        ['id' => 'nikou-champion', 'title' => 'Nikou champion'],
        ['id' => 'nikou-musicien-album', 'title' => 'Nikou musicien'],
        ['id' => 'nikou-patron', 'title' => 'Nikou patron'],
        ['id' => 'bons-points-nikou', 'title' => 'Bons points Nikou'],
        ['id' => 'le-cahier-de-nikou', 'title' => 'Le cahier de Nikou — niveau 1'],
        ['id' => 'nikou-formes', 'title' => 'Nikou joue avec les formes'],
        ['id' => 'coloriages-nikou-v1', 'title' => 'Les coloriages de Nikou — Volume 1'],
        ['id' => 'poster-carnaval-nikou', 'title' => 'Poster Vive le carnaval avec Nikou'],
        ['id' => 'stickers-carnaval-nikou', 'title' => 'Planche stickers Le carnaval de Nikou'],
        ['id' => 'compte-avec-nikou', 'title' => 'Compte avec Nikou'],
        ['id' => 'le-carnaval-de-nikou', 'title' => 'Le carnaval de Nikou'],
        ['id' => 'les-couleurs-de-nikou', 'title' => 'Les couleurs de Nikou'],
        ['id' => 'bebe-nikou-dit-non', 'title' => 'Bébé Nikou dit non'],
        ['id' => 'bebe-nikou-a-faim', 'title' => 'Bébé Nikou a faim'],
        ['id' => 'stickers-fruits-martinique', 'title' => 'Stickers Fruits de Martinique'],
        ['id' => 'circuit-ferme', 'title' => 'Circuit fermé'],
        ['id' => 'comptines-karambole-bateaux', 'title' => 'Les comptines de Karambole'],
        ['id' => 'tice-et-metice', 'title' => 'Tice et Métice'],
        ['id' => 'exocette-et-la-mer-de-plastique', 'title' => 'Exocette et la mer de plastique'],
        ['id' => 'exocette', 'title' => 'Exocette'],
        ['id' => 'sac-a-dos-vole-wo', 'title' => 'Volé wo, volé lwen ! — Sac à dos brodé'],
        ['id' => 'poster-abecedaire', 'title' => 'Poster abécédaire animalier de la Caraïbe'],
        ['id' => 'coloriages-lettres-ou-betes', 'title' => 'Lettres ou bêtes ? — Cahier de coloriage'],
        ['id' => 'lettres-ou-betes', 'title' => 'Lettres ou bêtes ? Abécédaire animalier'],
        ['id' => 'sous-main-abecedaire', 'title' => 'Sous-main / set de table — Abécédaire'],
        ['id' => 'stickers-abecedaire', 'title' => 'Stickers abécédaire animalier'],
    ];
}

/**
 * Produits absents du back-office (catalogue public pas encore ouvert).
 *
 * @return list<string>
 */
function sucrier_catalog_admin_excluded_ids(array $contenu): array
{
    $ids = [];
    $fromCms = $contenu['catalogue_removed_ids'] ?? [];
    if (is_array($fromCms)) {
        foreach ($fromCms as $id) {
            $id = trim((string) $id);
            if ($id !== '') {
                $ids[$id] = true;
            }
        }
    }

    return array_keys($ids);
}

function sucrier_is_admin_catalog_excluded(string $id, array $contenu): bool
{
    $id = trim($id);
    if ($id === '') {
        return false;
    }

    return in_array($id, sucrier_catalog_admin_excluded_ids($contenu), true);
}

function sucrier_catalog_stock_map(array $contenu): array
{
    $stock = $contenu['catalog_stock'] ?? [];
    if (!is_array($stock)) {
        return [];
    }
    $out = [];
    foreach ($stock as $id => $qty) {
        $productId = trim((string) $id);
        if ($productId === '') {
            continue;
        }
        $value = (int) $qty;
        if ($value < 0) {
            $value = 0;
        }
        $out[$productId] = $value;
    }

    return $out;
}

/**
 * Charge contenu.json (cache statique par requête).
 *
 * @return array<string, mixed>
 */
function sucrier_load_contenu_data(): array
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }

    $path = __DIR__ . '/../data/contenu.json';
    $raw = is_readable($path) ? file_get_contents($path) : '{}';
    $decoded = json_decode($raw ?: '{}', true);

    $cache = is_array($decoded) ? $decoded : [];

    return $cache;
}

/**
 * Vérifie qu'un produit peut être vendu en quantité demandée (stock serveur).
 */
function sucrier_catalog_product_available_for_qty(string $productId, int $qty, ?array $contenu = null): bool
{
    $productId = trim($productId);
    if ($productId === '' || $qty < 1 || $qty > 50) {
        return false;
    }

    if ($contenu === null) {
        $contenu = sucrier_load_contenu_data();
    }

    $stockMap = sucrier_catalog_stock_map($contenu);
    if (!array_key_exists($productId, $stockMap)) {
        return true;
    }

    return $stockMap[$productId] >= $qty;
}

/**
 * Liste des produits pour les menus « Conseils de lecture » (back-office).
 *
 * Ordre: d'abord catalogue_books (ordre CMS), puis IDs du registre absents.
 *
 * @return list<array{id: string, title: string}>
 */
function sucrier_reading_pick_product_choices(array $contenu): array
{
    $books = $contenu['catalogue_books'] ?? [];
    $choices = [];
    $seen = [];

    if (is_array($books)) {
        foreach ($books as $book) {
            if (!is_array($book)) {
                continue;
            }
            $id = trim((string) ($book['id'] ?? ''));
            if ($id === '' || isset($seen[$id]) || sucrier_is_admin_catalog_excluded($id, $contenu)) {
                continue;
            }
            $seen[$id] = true;
            $title = trim((string) ($book['title'] ?? ''));
            $choices[] = [
                'id' => $id,
                'title' => $title !== '' ? $title : $id,
            ];
        }
    }

    foreach (sucrier_catalog_product_registry() as $row) {
        $id = trim((string) ($row['id'] ?? ''));
        if ($id === '' || isset($seen[$id]) || sucrier_is_admin_catalog_excluded($id, $contenu)) {
            continue;
        }
        $seen[$id] = true;
        $title = trim((string) ($row['title'] ?? ''));
        $choices[] = [
            'id' => $id,
            'title' => $title !== '' ? $title : $id,
        ];
    }

    return $choices;
}

/** @return list<string> */
function sucrier_valid_reading_pick_product_ids(array $contenu): array
{
    return array_map(
        static fn (array $row): string => $row['id'],
        sucrier_reading_pick_product_choices($contenu)
    );
}
