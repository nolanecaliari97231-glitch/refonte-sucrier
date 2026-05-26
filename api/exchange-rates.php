<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/security.php';
require_once __DIR__ . '/../includes/exchange_rates.php';

sucrier_send_security_headers(true);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Methode non autorisee.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$payload = sucrier_get_official_exchange_rates();
if (!($payload['ok'] ?? false)) {
    http_response_code(503);
}

echo json_encode($payload, JSON_UNESCAPED_UNICODE);
