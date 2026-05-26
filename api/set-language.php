<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/security.php';

sucrier_harden_error_reporting();
sucrier_send_security_headers(true);
sucrier_start_secure_session();

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sucrier_json_safe_error(405, 'Methode non autorisee.');
}
if (!sucrier_check_request_origin()) {
    sucrier_json_safe_error(403, 'Requete refusee.', 'set-language: origin mismatch');
}

$raw = file_get_contents('php://input');
if (!is_string($raw) || strlen($raw) > 256) {
    sucrier_json_safe_error(413, 'Payload trop volumineux.');
}
$payload = json_decode($raw ?: '{}', true);
$language = is_array($payload) ? ($payload['language'] ?? 'fr') : 'fr';
$normalized = $language === 'en' ? 'en' : 'fr';

$_SESSION['sucrier_language'] = $normalized;
setcookie('sucrier_language', $normalized, [
    'expires' => time() + (365 * 24 * 60 * 60),
    'path' => '/',
    'secure' => sucrier_is_https(),
    'httponly' => false,
    'samesite' => 'Lax',
]);

echo json_encode(['ok' => true, 'language' => $normalized], JSON_UNESCAPED_UNICODE);
