<?php

declare(strict_types=1);

require_once __DIR__ . '/catalog-products.php';
require_once __DIR__ . '/promo-codes.php';

/**
 * Prépare le JSON « contenu site » exposé au navigateur : pas de stock détaillé,
 * pas de chemins internes sensibles.
 *
 * @param array<string, mixed> $data
 * @return array<string, mixed>
 */
function sucrier_public_content_payload(array $data): array
{
    // Important: calculer la liste rupture AVANT de retirer catalog_stock.
    // Sinon sucrier_catalog_stock_map() ne voit plus rien.
    $data['products_out_of_stock'] = sucrier_public_products_out_of_stock($data);
    // Expose le stock public pour afficher "X restants" sur la fiche produit.
    // Seules les references suivies apparaissent ici.
    $data['catalog_stock_public'] = sucrier_catalog_stock_map($data);
    unset($data['catalog_stock']);
    $data['promo_codes_active'] = sucrier_public_promo_codes_active($data);
    $data['home_promo'] = sucrier_public_home_promo($data);
    unset($data['promo_codes']);

    return $data;
}

/**
 * Liste publique des références en rupture (sans quantité exacte).
 *
 * @param array<string, mixed> $contenu
 * @return list<string>
 */
function sucrier_public_products_out_of_stock(array $contenu): array
{
    $out = [];
    foreach (sucrier_catalog_stock_map($contenu) as $productId => $qty) {
        if ($qty <= 0) {
            $out[] = $productId;
        }
    }
    sort($out);

    return $out;
}
