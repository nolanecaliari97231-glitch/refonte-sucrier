<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/security.php';

sucrier_harden_error_reporting();
sucrier_send_security_headers(true);
sucrier_start_secure_session();
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    sucrier_json_safe_error(405, 'Methode non autorisee.');
}
if (!sucrier_check_request_origin()) {
    sucrier_json_safe_error(403, 'Requete refusee.', 'auth-logout: origin mismatch');
}

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params['path'] ?? '/',
        $params['domain'] ?? '',
        (bool) ($params['secure'] ?? false),
        (bool) ($params['httponly'] ?? true)
    );
}
if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
}

echo json_encode(['ok' => true]);

