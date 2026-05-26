<?php

declare(strict_types=1);

const SUCRIER_SUMUP_API_KEY = '';
const SUCRIER_SUMUP_MERCHANT_CODE = '';
const SUCRIER_BASE_URL = '';
const SUCRIER_WEBHOOK_SECRET = '';
const SUCRIER_DEFAULT_WEIGHT_G = 280;
const SUCRIER_POSTAL_WEIGHT_TIERS = [
    ['max_weight_g' => 250, 'amount_cents' => 495],
    ['max_weight_g' => 500, 'amount_cents' => 665],
    ['max_weight_g' => 750, 'amount_cents' => 745],
    ['max_weight_g' => 1000, 'amount_cents' => 845],
    ['max_weight_g' => 2000, 'amount_cents' => 995],
];
const SUCRIER_POSTAL_OVERFLOW_STEP_G = 500;
const SUCRIER_POSTAL_OVERFLOW_STEP_CENTS = 150;

$envApiKey = getenv('SUCRIER_SUMUP_API_KEY');
if (is_string($envApiKey) && $envApiKey !== '') {
    define('SUCRIER_SUMUP_API_KEY_RUNTIME', $envApiKey);
} else {
    define('SUCRIER_SUMUP_API_KEY_RUNTIME', SUCRIER_SUMUP_API_KEY);
}

$envMerchantCode = getenv('SUCRIER_SUMUP_MERCHANT_CODE');
if (is_string($envMerchantCode) && $envMerchantCode !== '') {
    define('SUCRIER_SUMUP_MERCHANT_CODE_RUNTIME', $envMerchantCode);
} else {
    define('SUCRIER_SUMUP_MERCHANT_CODE_RUNTIME', SUCRIER_SUMUP_MERCHANT_CODE);
}

$envBaseUrl = getenv('SUCRIER_BASE_URL');
if (is_string($envBaseUrl) && $envBaseUrl !== '') {
    define('SUCRIER_BASE_URL_RUNTIME', $envBaseUrl);
} else {
    define('SUCRIER_BASE_URL_RUNTIME', SUCRIER_BASE_URL);
}

$envWebhookSecret = getenv('SUCRIER_WEBHOOK_SECRET');
if (is_string($envWebhookSecret) && $envWebhookSecret !== '') {
    define('SUCRIER_WEBHOOK_SECRET_RUNTIME', $envWebhookSecret);
} else {
    define('SUCRIER_WEBHOOK_SECRET_RUNTIME', SUCRIER_WEBHOOK_SECRET);
}

/**
 * Catalogue serveur — aligné sur le catalogue PDF n°11 (mai 2026). Prix en centimes.
 */
const SUCRIER_CHECKOUT_CATALOG = [
    'peluche-nikou' => ['name' => 'La peluche de Nikou', 'unit_amount' => 500, 'weight_g' => 120],
    'nikou-champion' => ['name' => 'Nikou champion', 'unit_amount' => 1000, 'weight_g' => 320],
    'nikou-musicien-album' => ['name' => 'Nikou musicien', 'unit_amount' => 1200, 'weight_g' => 310],
    'nikou-patron' => ['name' => 'Nikou patron', 'unit_amount' => 1200, 'weight_g' => 310],
    'bons-points-nikou' => ['name' => 'Bons points Nikou', 'unit_amount' => 300, 'weight_g' => 30],
    'le-cahier-de-nikou' => ['name' => 'Le cahier de Nikou', 'unit_amount' => 700, 'weight_g' => 270],
    'nikou-formes' => ['name' => 'Nikou joue avec les formes', 'unit_amount' => 900, 'weight_g' => 250],
    'coloriages-nikou-v1' => ['name' => 'Les coloriages de Nikou Vol.1', 'unit_amount' => 600, 'weight_g' => 210],
    'poster-carnaval-nikou' => ['name' => 'Poster Vive le carnaval avec Nikou', 'unit_amount' => 500, 'weight_g' => 90],
    'stickers-carnaval-nikou' => ['name' => 'Stickers Le carnaval de Nikou', 'unit_amount' => 300, 'weight_g' => 40],
    'compte-avec-nikou' => ['name' => 'Compte avec Nikou', 'unit_amount' => 600, 'weight_g' => 240],
    'le-carnaval-de-nikou' => ['name' => 'Le carnaval de Nikou', 'unit_amount' => 600, 'weight_g' => 240],
    'les-couleurs-de-nikou' => ['name' => 'Les couleurs de Nikou', 'unit_amount' => 600, 'weight_g' => 250],
    'bebe-nikou-dit-non' => ['name' => 'Bebe Nikou dit non', 'unit_amount' => 1150, 'weight_g' => 220],
    'bebe-nikou-a-faim' => ['name' => 'Bebe Nikou a faim', 'unit_amount' => 1150, 'weight_g' => 220],
    'stickers-fruits-martinique' => ['name' => 'Stickers Fruits de Martinique', 'unit_amount' => 300, 'weight_g' => 45],
    'circuit-ferme' => ['name' => 'Circuit ferme', 'unit_amount' => 1600, 'weight_g' => 330],
    'comptines-karambole-bateaux' => ['name' => 'Les comptines de Karambole', 'unit_amount' => 1200, 'weight_g' => 190],
    'tice-et-metice' => ['name' => 'Tice et Metice', 'unit_amount' => 1300, 'weight_g' => 330],
    'exocette-et-la-mer-de-plastique' => ['name' => 'Exocette et la mer de plastique T2', 'unit_amount' => 1500, 'weight_g' => 310],
    'exocette' => ['name' => 'Exocette tome 1 2e edition', 'unit_amount' => 1400, 'weight_g' => 320],
    'sac-a-dos-vole-wo' => ['name' => 'Sac a dos Vole wo vole lwen', 'unit_amount' => 1000, 'weight_g' => 180],
    'poster-abecedaire' => ['name' => 'Poster abecedaire animalier', 'unit_amount' => 500, 'weight_g' => 90],
    'coloriages-lettres-ou-betes' => ['name' => 'Lettres ou betes coloriage', 'unit_amount' => 600, 'weight_g' => 150],
    'lettres-ou-betes' => ['name' => 'Lettres ou betes abecedaire', 'unit_amount' => 1500, 'weight_g' => 320],
    'sous-main-abecedaire' => ['name' => 'Sous-main abecedaire', 'unit_amount' => 600, 'weight_g' => 120],
    'stickers-abecedaire' => ['name' => 'Stickers abecedaire animalier', 'unit_amount' => 300, 'weight_g' => 45],
];

function sucrier_get_base_url(): string
{
    if (SUCRIER_BASE_URL_RUNTIME !== '') {
        return rtrim(SUCRIER_BASE_URL_RUNTIME, '/');
    }

    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? '127.0.0.1:8000';
    return $scheme . '://' . $host;
}
