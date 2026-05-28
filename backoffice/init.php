<?php

declare(strict_types=1);

/** Racine du site public (HTML, data, images, api). */
define('SUCRIER_SITE_ROOT', dirname(__DIR__));

require SUCRIER_SITE_ROOT . '/includes/bootstrap.php';
require SUCRIER_SITE_ROOT . '/includes/content-admin.php';
require SUCRIER_SITE_ROOT . '/includes/catalog-products.php';
require SUCRIER_SITE_ROOT . '/includes/catalog-admin.php';
require SUCRIER_SITE_ROOT . '/includes/promo-codes.php';

/**
 * URL absolue d'un asset back-office (évite les chemins relatifs cassés selon le navigateur).
 */
function sucrier_backoffice_asset(string $filename): string
{
    $scriptDir = str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? '/backoffice/login.php')));
    if ($scriptDir === '/' || $scriptDir === '.') {
        $scriptDir = '/backoffice';
    }

    return rtrim($scriptDir, '/') . '/' . ltrim($filename, '/');
}

/**
 * Balises favicon / icône d'onglet (symbole Éditions du Sucrier recadré).
 */
function sucrier_favicon_link_tags(string $assetsPrefix = ''): string
{
    $base = rtrim($assetsPrefix, '/') . '/';
    if ($base === '/') {
        $base = '';
    }
    $iconBase = $base . 'images/site/';

    return implode("\n  ", [
        '<link rel="icon" href="' . $iconBase . 'favicon.ico" sizes="any">',
        '<link rel="icon" type="image/png" sizes="32x32" href="' . $iconBase . 'favicon-32x32.png">',
        '<link rel="icon" type="image/png" sizes="16x16" href="' . $iconBase . 'favicon-16x16.png">',
        '<link rel="apple-touch-icon" sizes="180x180" href="' . $iconBase . 'favicon-180x180.png">',
    ]);
}
