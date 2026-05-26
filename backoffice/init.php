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
