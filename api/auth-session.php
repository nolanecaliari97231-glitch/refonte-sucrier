<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/security.php';
require_once __DIR__ . '/../includes/auth_db.php';

sucrier_harden_error_reporting();
sucrier_send_security_headers(true);
sucrier_start_secure_session();
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    sucrier_json_safe_error(405, 'Methode non autorisee.');
}

$user = sucrier_auth_get_user_session();
if (!$user) {
    echo json_encode(['authenticated' => false]);
    exit;
}

echo json_encode([
    'authenticated' => true,
    'user' => [
        'email' => (string) ($user['email'] ?? ''),
        'segment' => (string) ($user['segment'] ?? 'particulier'),
        'fullName' => (string) ($user['full_name'] ?? ''),
    ],
]);

