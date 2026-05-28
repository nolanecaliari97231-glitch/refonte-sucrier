<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/security.php';
require_once __DIR__ . '/../data/sumup-config.php';

sucrier_send_security_headers(true);
sucrier_start_secure_session();
header('Content-Type: application/json; charset=utf-8');

function sucrier_status_json(bool $ok, bool $paid, string $status, string $error = '', int $httpStatus = 200): void
{
    http_response_code($httpStatus);
    echo json_encode([
        'ok' => $ok,
        'paid' => $paid,
        'status' => $status,
        'error' => $error,
    ], JSON_UNESCAPED_UNICODE);
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
 * @return array{status:int, body:string}
 */
function sucrier_get_json(string $url, array $headers): array
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 20,
        ]);
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($body === false || $curlError !== '') {
            return ['status' => 502, 'body' => '{"error":"Erreur reseau vers SumUp."}'];
        }
        return ['status' => $status, 'body' => (string) $body];
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => implode("\r\n", $headers) . "\r\n",
            'timeout' => 20,
            'ignore_errors' => true,
        ],
    ]);
    $body = @file_get_contents($url, false, $context);
    if ($body === false) {
        return ['status' => 502, 'body' => '{"error":"Erreur reseau vers SumUp."}'];
    }
    return ['status' => 200, 'body' => (string) $body];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sucrier_status_json(false, false, 'method_not_allowed', 'Methode non autorisee.', 405);
}

if (!sucrier_check_request_origin()) {
    sucrier_status_json(false, false, 'forbidden', 'Requete refusee.', 403);
}

if (!sucrier_throttle_consume('checkout_status', 40, 600)) {
    sucrier_status_json(false, false, 'throttled', 'Trop de verifications. Reessayez plus tard.', 429);
}

if (SUCRIER_SUMUP_API_KEY_RUNTIME === '' || SUCRIER_SUMUP_MERCHANT_CODE_RUNTIME === '') {
    sucrier_status_json(false, false, 'misconfigured', 'Configuration SumUp manquante.', 500);
}

$rawInput = file_get_contents('php://input');
if (!is_string($rawInput) || strlen($rawInput) > 4096) {
    sucrier_status_json(false, false, 'payload_too_large', 'Payload trop volumineux.', 413);
}
$contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
if ($contentType !== '' && strpos($contentType, 'application/json') !== 0) {
    sucrier_status_json(false, false, 'invalid_content_type', 'Content-Type invalide.', 415);
}
$payload = json_decode($rawInput ?: '{}', true);
$checkoutRef = is_array($payload) ? (string) ($payload['checkout_ref'] ?? '') : '';
if ($checkoutRef === '' || !preg_match('/^[a-zA-Z0-9._:-]{8,120}$/', $checkoutRef)) {
    sucrier_status_json(false, false, 'invalid_reference', 'Reference checkout invalide.', 400);
}

$pending = $_SESSION['sumup_pending'] ?? [];
if (!is_array($pending) || !isset($pending[$checkoutRef]) || !is_array($pending[$checkoutRef])) {
    sucrier_status_json(false, false, 'unknown_reference', 'Reference checkout inconnue.', 404);
}

$checkoutId = (string) ($pending[$checkoutRef]['checkout_id'] ?? '');
if ($checkoutId === '') {
    sucrier_status_json(false, false, 'invalid_checkout_id', 'Identifiant checkout manquant.', 400);
}

$response = sucrier_get_json(
    'https://api.sumup.com/v0.1/checkouts/' . rawurlencode($checkoutId),
    [
        'Authorization: Bearer ' . SUCRIER_SUMUP_API_KEY_RUNTIME,
        'Accept: application/json',
    ]
);

$httpCode = (int) $response['status'];
$sumupData = json_decode((string) $response['body'], true);
if ($httpCode >= 400 || !is_array($sumupData)) {
    sucrier_status_json(false, false, 'sumup_error', 'Impossible de verifier le checkout SumUp.', 502);
}

$status = strtoupper((string) ($sumupData['status'] ?? 'UNKNOWN'));
$paid = in_array($status, ['PAID', 'SUCCESSFUL'], true);
if ($paid) {
    $expectedCents = (int) ($pending[$checkoutRef]['amount_cents'] ?? 0);
    $sumupAmount = isset($sumupData['amount']) ? (float) $sumupData['amount'] : 0.0;
    $paidCents = (int) round($sumupAmount * 100);
    if ($expectedCents > 0 && abs($paidCents - $expectedCents) > 2) {
        error_log(
            '[sucrier] SumUp amount mismatch ref=' . $checkoutRef . ' expected=' . $expectedCents . ' paid=' . $paidCents
        );
        sucrier_status_json(false, false, 'amount_mismatch', 'Le montant payé ne correspond pas à la commande.', 409);
    }
    $pendingEntry = is_array($pending[$checkoutRef] ?? null) ? $pending[$checkoutRef] : [];
    sucrier_append_order_intent([
        'event' => 'checkout_paid',
        'checkout_ref' => $checkoutRef,
        'paid_at' => gmdate('c'),
        'shipping_mode' => (string) ($pendingEntry['shipping_mode'] ?? ''),
        'shipping_note' => (string) ($pendingEntry['shipping_note'] ?? ''),
        'amount_cents' => (int) ($pendingEntry['amount_cents'] ?? 0),
        'shipping_cents' => (int) ($pendingEntry['shipping_cents'] ?? 0),
    ]);
    unset($_SESSION['sumup_pending'][$checkoutRef]);
}

sucrier_status_json(true, $paid, strtolower($status));
