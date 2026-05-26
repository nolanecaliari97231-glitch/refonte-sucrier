<?php

declare(strict_types=1);

require_once __DIR__ . '/../includes/security.php';
require_once __DIR__ . '/../data/sumup-config.php';
sucrier_send_security_headers(true);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'status' => 'method_not_allowed']);
    exit;
}

$providedSecret = (string) ($_SERVER['HTTP_X_SUCRIER_WEBHOOK_SECRET'] ?? '');
if (SUCRIER_WEBHOOK_SECRET_RUNTIME !== '') {
    if ($providedSecret === '' || !hash_equals(SUCRIER_WEBHOOK_SECRET_RUNTIME, $providedSecret)) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'status' => 'unauthorized']);
        exit;
    }
}

http_response_code(200);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => true, 'status' => 'ok']);

