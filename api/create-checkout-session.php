<?php

declare(strict_types=1);

require_once __DIR__ . '/../includes/security.php';
require_once __DIR__ . '/../includes/auth_db.php';
require_once __DIR__ . '/../includes/catalog-products.php';
require_once __DIR__ . '/../includes/checkout-promo.php';
require_once __DIR__ . '/../data/sumup-config.php';

sucrier_harden_error_reporting();
sucrier_send_security_headers(true);
sucrier_start_secure_session();
header('Content-Type: application/json; charset=utf-8');

function sucrier_json_error(string $message, int $statusCode = 400): void
{
    http_response_code($statusCode);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * @param array<string, mixed> $entry
 */
function sucrier_append_order_intent(array $entry): void
{
    $path = __DIR__ . '/../data/order-intents.jsonl';
    $json = json_encode($entry, JSON_UNESCAPED_UNICODE);
    if (!is_string($json) || $json === '') {
        return;
    }
    @file_put_contents($path, $json . PHP_EOL, FILE_APPEND | LOCK_EX);
}

/**
 * @param array<int, array<string, mixed>> $items
 */
function sucrier_normalize_postal_zone(string $postalZone): string
{
    $aliases = [
        'martinique' => 'dom_martinique_near',
        'antilles_usa' => 'dom_martinique_near',
        'international_other' => 'dom_international',
    ];

    return $aliases[$postalZone] ?? $postalZone;
}

function sucrier_postal_zone_tiers_from_content(array $contenuData, string $postalZone): array
{
    $postalZone = sucrier_normalize_postal_zone($postalZone);
    $defaults = SUCRIER_POSTAL_ZONE_TIERS[$postalZone] ?? SUCRIER_POSTAL_ZONE_TIERS['dom_martinique_near'];
    $rates = $contenuData['ecommerce']['postal_rates'][$postalZone] ?? null;
    if (!is_array($rates) || count($rates) === 0) {
        foreach (['martinique', 'antilles_usa', 'international_other'] as $legacyKey) {
            if (sucrier_normalize_postal_zone($legacyKey) !== $postalZone) {
                continue;
            }
            $legacyRates = $contenuData['ecommerce']['postal_rates'][$legacyKey] ?? null;
            if (is_array($legacyRates) && count($legacyRates) > 0) {
                $rates = $legacyRates;
                break;
            }
        }
    }
    if (!is_array($rates) || count($rates) === 0) {
        return $defaults;
    }
    $sanitized = [];
    foreach ($rates as $row) {
        if (!is_array($row)) {
            continue;
        }
        $maxWeight = isset($row['max_weight_g']) ? (int) $row['max_weight_g'] : 0;
        $amountEur = isset($row['amount_eur']) ? (float) $row['amount_eur'] : -1;
        if ($maxWeight < 1 || $amountEur < 0) {
            continue;
        }
        $sanitized[] = [
            'max_weight_g' => $maxWeight,
            'amount_cents' => (int) round($amountEur * 100),
        ];
    }
    usort($sanitized, static function (array $a, array $b): int {
        return (int) ($a['max_weight_g'] ?? 0) <=> (int) ($b['max_weight_g'] ?? 0);
    });
    return count($sanitized) > 0 ? $sanitized : $defaults;
}

function sucrier_resolve_postal_zone_from_country(string $countryCode): string
{
    $code = strtoupper(trim($countryCode));
    $nearZone = [
        'MQ', 'GP', 'AG', 'AN', 'BB', 'DM', 'US', 'GD', 'GY', 'HT', 'MS', 'KN', 'VC', 'LC', 'TT', 'VG',
    ];
    if (in_array($code, $nearZone, true)) {
        return 'dom_martinique_near';
    }

    return 'dom_international';
}

/**
 * @param array<int, array<string, mixed>> $items
 */
function sucrier_compute_shipping_cents(array $items, string $shippingMode, string $postalZone, array $contenuData): int
{
    if ($shippingMode === 'pickup_siege') {
        return 0;
    }
    if ($shippingMode === 'local_personal') {
        return 150;
    }

    $totalWeightG = 0;
    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }
        $id = isset($item['id']) ? (string) $item['id'] : '';
        $qty = isset($item['qty']) ? (int) $item['qty'] : 0;
        if ($id === '' || $qty < 1 || !isset(SUCRIER_CHECKOUT_CATALOG[$id])) {
            continue;
        }
        $catalogItem = SUCRIER_CHECKOUT_CATALOG[$id];
        $weightG = isset($catalogItem['weight_g']) ? (int) $catalogItem['weight_g'] : SUCRIER_DEFAULT_WEIGHT_G;
        if ($weightG < 1) {
            $weightG = SUCRIER_DEFAULT_WEIGHT_G;
        }
        $totalWeightG += $weightG * $qty;
    }

    if ($totalWeightG <= 0) {
        return 0;
    }

    $zone = sucrier_normalize_postal_zone($postalZone);
    if (!isset(SUCRIER_POSTAL_ZONE_TIERS[$zone])) {
        $zone = 'dom_martinique_near';
    }
    $tiers = sucrier_postal_zone_tiers_from_content($contenuData, $zone);
    foreach ($tiers as $tier) {
        $maxWeight = isset($tier['max_weight_g']) ? (int) $tier['max_weight_g'] : 0;
        $amount = isset($tier['amount_cents']) ? (int) $tier['amount_cents'] : 0;
        if ($maxWeight > 0 && $totalWeightG <= $maxWeight) {
            return max(0, $amount);
        }
    }
    $lastTier = $tiers[count($tiers) - 1] ?? ['amount_cents' => 0];
    return max(0, (int) ($lastTier['amount_cents'] ?? 0));
}

/**
 * @return array{status:int, body:string}
 */
function sucrier_post_json(string $url, array $payload, array $headers): array
{
    $jsonBody = json_encode($payload, JSON_UNESCAPED_UNICODE);
    if ($jsonBody === false) {
        return ['status' => 500, 'body' => '{"error":"Erreur encodage JSON."}'];
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $jsonBody,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 20,
        ]);
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($body === false || $curlError !== '') {
            error_log('[sucrier] SumUp POST network error: ' . $curlError);
            return ['status' => 502, 'body' => '{"error":"Erreur reseau vers SumUp."}'];
        }

        return ['status' => $status, 'body' => (string) $body];
    }

    $headerLines = implode("\r\n", $headers);
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => $headerLines . "\r\n",
            'content' => $jsonBody,
            'timeout' => 20,
            'ignore_errors' => true,
        ],
    ]);
    $body = @file_get_contents($url, false, $context);
    $status = 0;
    $responseHeaders = [];
    if (function_exists('http_get_last_response_headers')) {
        $responseHeaders = http_get_last_response_headers();
    }
    if (isset($responseHeaders[0]) && preg_match('/\s(\d{3})\s/', (string) $responseHeaders[0], $matches)) {
        $status = (int) $matches[1];
    }

    if ($body === false) {
        return ['status' => 502, 'body' => '{"error":"Erreur reseau vers SumUp (HTTP stream)."}'];
    }

    return ['status' => $status, 'body' => (string) $body];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sucrier_json_error('Methode non autorisee.', 405);
}

if (!sucrier_check_request_origin()) {
    sucrier_json_safe_error(403, 'Requete refusee.', 'checkout: origin mismatch');
}

if (!sucrier_throttle_consume('checkout_create', 12, 600)) {
    sucrier_json_safe_error(429, 'Trop de tentatives. Reessayez dans quelques minutes.', 'checkout: throttled');
}

$contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
if ($contentType !== '' && strpos($contentType, 'application/json') !== 0) {
    sucrier_json_error('Content-Type invalide.', 415);
}

if (SUCRIER_SUMUP_API_KEY_RUNTIME === '' || SUCRIER_SUMUP_MERCHANT_CODE_RUNTIME === '') {
    sucrier_json_safe_error(
        503,
        'Paiement temporairement indisponible. Réessayez plus tard ou contactez-nous.',
        'checkout: sumup not configured'
    );
}

$rawInput = file_get_contents('php://input');
$rawSize = strlen((string) $rawInput);
if ($rawSize > 100_000) {
    sucrier_json_error('Payload trop volumineux.', 413);
}
$payload = json_decode($rawInput ?: '', true);
if (!is_array($payload) || !isset($payload['items']) || !is_array($payload['items'])) {
    sucrier_json_error('Panier invalide.');
}

$customer = isset($payload['customer']) && is_array($payload['customer']) ? $payload['customer'] : [];
$customerFirstName = trim((string) ($customer['firstName'] ?? ''));
$customerLastName = trim((string) ($customer['lastName'] ?? ''));
$customerEmail = strtolower(trim((string) ($customer['email'] ?? '')));
$customerPhone = trim((string) ($customer['phone'] ?? ''));
$customerPhoneDigits = preg_replace('/[^\d+]/', '', $customerPhone) ?? '';

$shippingAddress = isset($payload['shipping_address']) && is_array($payload['shipping_address']) ? $payload['shipping_address'] : [];
$addressLabel = trim((string) ($shippingAddress['label'] ?? ''));
$addressLine1 = trim((string) ($shippingAddress['line1'] ?? ''));
$addressLine2 = trim((string) ($shippingAddress['line2'] ?? ''));
$addressPostal = trim((string) ($shippingAddress['postal'] ?? ''));
$addressCity = trim((string) ($shippingAddress['city'] ?? ''));
$addressCountry = strtoupper(trim((string) ($shippingAddress['country'] ?? 'MQ')));
if ($addressCountry === '') {
    $addressCountry = 'MQ';
}

$contenuData = sucrier_load_contenu_data();

$checkoutReferenceParts = [];
$totalAmount = 0;
foreach ($payload['items'] as $item) {
    if (!is_array($item)) {
        continue;
    }
    $id = isset($item['id']) ? (string) $item['id'] : '';
    $qty = isset($item['qty']) ? (int) $item['qty'] : 0;
    if ($id === '' || $qty < 1 || $qty > 50) {
        sucrier_json_error('Article invalide detecte dans le panier.');
    }
    if (!isset(SUCRIER_CHECKOUT_CATALOG[$id])) {
        sucrier_json_error('Article inconnu dans le catalogue serveur.');
    }

    if (!sucrier_catalog_product_available_for_qty($id, $qty, $contenuData)) {
        sucrier_json_safe_error(
            409,
            'Un article de votre panier n\'est plus disponible en quantité demandée.',
            'checkout: out of stock ' . $id
        );
    }

    $product = SUCRIER_CHECKOUT_CATALOG[$id];
    $checkoutReferenceParts[] = $id . 'x' . $qty;
    $totalAmount += ((int) $product['unit_amount']) * $qty;
}

if ($totalAmount <= 0) {
    sucrier_json_error('Panier vide.');
}

$shippingMode = isset($payload['shipping_mode']) ? (string) $payload['shipping_mode'] : '';
if (!in_array($shippingMode, ['pickup_siege', 'local_personal', 'postal'], true)) {
    sucrier_json_error('Mode de livraison invalide.');
}
$postalZone = 'dom_martinique_near';
$customerMode = isset($payload['customer_mode']) ? (string) $payload['customer_mode'] : 'guest';
if (!in_array($customerMode, ['guest', 'account_saved', 'pickup'], true)) {
    $customerMode = 'guest';
}

if ($customerMode === 'account_saved') {
    $sessionUser = sucrier_auth_get_user_session();
    if (!$sessionUser || empty($sessionUser['email'])) {
        sucrier_json_safe_error(
            401,
            'Connectez-vous pour finaliser la commande avec votre compte.',
            'checkout: account_saved without session'
        );
    }
    $customerEmail = strtolower(trim((string) $sessionUser['email']));
    $sessionFullName = trim((string) ($sessionUser['full_name'] ?? ''));
    if ($sessionFullName !== '') {
        $nameParts = preg_split('/\s+/u', $sessionFullName) ?: [];
        if ($customerFirstName === '' && count($nameParts) > 1) {
            $customerFirstName = implode(' ', array_slice($nameParts, 0, -1));
        }
        if ($customerLastName === '' && count($nameParts) > 0) {
            $customerLastName = (string) $nameParts[count($nameParts) - 1];
        }
    }
}

if ($shippingMode !== 'pickup_siege' && $customerMode === 'guest') {
    if ($customerFirstName === '' || $customerLastName === '') {
        sucrier_json_error('Nom et prénom sont obligatoires.');
    }
    if ($customerEmail === '' || !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
        sucrier_json_error('Adresse email invalide.');
    }
    if (strlen($customerPhoneDigits) < 8) {
        sucrier_json_error('Numéro de téléphone invalide.');
    }
}
if ($shippingMode !== 'pickup_siege') {
    if ($addressLabel === '' || $addressLine1 === '' || $addressCity === '') {
        sucrier_json_error('Adresse de livraison incomplète.');
    }
    $requiresFrenchPostal = in_array($addressCountry, ['MQ', 'GP', 'GF', 'RE', 'FR'], true);
    if ($requiresFrenchPostal && !preg_match('/^\d{5}$/', $addressPostal)) {
        sucrier_json_error('Code postal invalide (5 chiffres attendus).');
    }
    if (!$requiresFrenchPostal && $addressPostal === '') {
        sucrier_json_error('Code postal obligatoire.');
    }
    if (!preg_match('/^(?:[A-Z]{2}|OTHER)$/', $addressCountry)) {
        sucrier_json_error('Pays de destination invalide.');
    }
}
$shippingNote = isset($payload['shipping_note']) ? (string) $payload['shipping_note'] : '';
$shippingNote = trim(preg_replace('/\s+/', ' ', $shippingNote) ?? '');
$shippingNote = mb_substr($shippingNote, 0, 500);
if (($shippingMode === 'local_personal' || $shippingMode === 'pickup_siege') && $shippingNote === '') {
    sucrier_json_error('Message de coordination obligatoire pour ce mode de livraison.');
}

if ($shippingMode === 'postal') {
    $postalZone = sucrier_resolve_postal_zone_from_country($addressCountry);
}

$shippingAmount = sucrier_compute_shipping_cents($payload['items'], $shippingMode, $postalZone, $contenuData);
$subtotalCents = $totalAmount;
$totalAmount += $shippingAmount;

$promoCode = isset($payload['promo_code']) ? (string) $payload['promo_code'] : '';
$promoRule = sucrier_promo_checkout_rule($promoCode, $contenuData);
$discountCents = sucrier_checkout_promo_discount_cents($subtotalCents, $shippingAmount, $promoRule);
if ($discountCents > 0) {
    $totalAmount = max(0, $totalAmount - $discountCents);
}

$baseUrl = sucrier_get_base_url();
$entropy = '';
try {
    $entropy = bin2hex(random_bytes(4));
} catch (Throwable $e) {
    $entropy = substr(uniqid('', true), -8);
}
$checkoutReference = 'order-' . date('YmdHis') . '-' . substr(md5(implode('|', $checkoutReferenceParts)), 0, 6) . '-' . $entropy;
$requestPayload = [
    'checkout_reference' => $checkoutReference,
    'amount' => round($totalAmount / 100, 2),
    'currency' => 'EUR',
    'merchant_code' => SUCRIER_SUMUP_MERCHANT_CODE_RUNTIME,
    'description' => 'Commande Les Editions du Sucrier',
    'redirect_url' => $baseUrl . '/checkout-success.html?checkout_ref=' . rawurlencode($checkoutReference),
    'return_url' => $baseUrl . '/checkout-cancel.html?checkout_ref=' . rawurlencode($checkoutReference),
    'hosted_checkout' => ['enabled' => true],
];

$response = sucrier_post_json(
    'https://api.sumup.com/v0.1/checkouts',
    $requestPayload,
    [
        'Authorization: Bearer ' . SUCRIER_SUMUP_API_KEY_RUNTIME,
        'Content-Type: application/json',
    ]
);
$responseBody = $response['body'];
$httpCode = $response['status'];

$responseData = json_decode($responseBody, true);
if (!is_array($responseData) || !isset($responseData['hosted_checkout_url']) || $httpCode >= 400) {
    error_log(
        '[sucrier] SumUp checkout create failed http=' . $httpCode . ' body=' . mb_substr(trim((string) $responseBody), 0, 400)
    );
    sucrier_json_safe_error(
        502,
        'Impossible d\'ouvrir le paiement pour le moment. Réessayez ou contactez-nous.',
        'checkout: sumup create failed'
    );
}

$checkoutId = isset($responseData['id']) ? (string) $responseData['id'] : '';
if ($checkoutId === '') {
    sucrier_json_safe_error(
        502,
        'Impossible d\'ouvrir le paiement pour le moment. Réessayez ou contactez-nous.',
        'checkout: sumup missing checkout id'
    );
}

if (!isset($_SESSION['sumup_pending']) || !is_array($_SESSION['sumup_pending'])) {
    $_SESSION['sumup_pending'] = [];
}
$_SESSION['sumup_pending'][$checkoutReference] = [
    'checkout_id' => $checkoutId,
    'created_at' => time(),
    'amount_cents' => $totalAmount,
    'subtotal_cents' => $subtotalCents,
    'discount_cents' => $discountCents,
    'promo_code' => $promoRule !== null ? strtoupper(trim($promoCode)) : '',
    'shipping_cents' => $shippingAmount,
    'shipping_mode' => $shippingMode,
    'postal_zone' => $postalZone,
    'customer_mode' => $customerMode,
    'shipping_note' => $shippingNote,
    'customer' => [
        'first_name' => $customerFirstName,
        'last_name' => $customerLastName,
        'email' => $customerEmail,
        'phone' => $customerPhone,
    ],
    'shipping_address' => [
        'label' => $addressLabel,
        'line1' => $addressLine1,
        'line2' => $addressLine2,
        'postal' => $addressPostal,
        'city' => $addressCity,
        'country' => $addressCountry,
    ],
    'items' => $payload['items'],
];
if (count($_SESSION['sumup_pending']) > 30) {
    $_SESSION['sumup_pending'] = array_slice($_SESSION['sumup_pending'], -30, null, true);
}

sucrier_append_order_intent([
    'event' => 'checkout_created',
    'checkout_ref' => $checkoutReference,
    'created_at' => gmdate('c'),
    'shipping_mode' => $shippingMode,
    'postal_zone' => $postalZone,
    'customer_mode' => $customerMode,
    'shipping_note' => $shippingNote,
    'customer' => [
        'first_name' => $customerFirstName,
        'last_name' => $customerLastName,
        'email' => $customerEmail,
        'phone' => $customerPhone,
    ],
    'shipping_address' => [
        'label' => $addressLabel,
        'line1' => $addressLine1,
        'line2' => $addressLine2,
        'postal' => $addressPostal,
        'city' => $addressCity,
        'country' => $addressCountry,
    ],
    'shipping_cents' => $shippingAmount,
    'discount_cents' => $discountCents,
    'promo_code' => $promoRule !== null ? strtoupper(trim($promoCode)) : '',
    'amount_cents' => $totalAmount,
    'items' => $payload['items'],
]);

echo json_encode([
    'ok' => true,
    'url' => $responseData['hosted_checkout_url'],
    'checkout_ref' => $checkoutReference,
], JSON_UNESCAPED_UNICODE);

