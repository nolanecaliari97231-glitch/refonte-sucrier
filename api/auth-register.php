<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/security.php';
require_once __DIR__ . '/../includes/auth_db.php';

sucrier_harden_error_reporting();
sucrier_send_security_headers(true);
sucrier_start_secure_session();
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    sucrier_json_safe_error(405, 'Methode non autorisee.');
}

if (!sucrier_check_request_origin()) {
    sucrier_json_safe_error(403, 'Requete refusee.', 'auth-register: origin mismatch');
}

$contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
if ($contentType !== '' && strpos($contentType, 'application/json') !== 0) {
    sucrier_json_safe_error(415, 'Content-Type invalide.');
}

if (!sucrier_throttle_login_attempts(5, 600)) {
    sucrier_json_safe_error(429, 'Trop de tentatives. Reessayez plus tard.');
}

$rawInput = file_get_contents('php://input');
if (!is_string($rawInput) || strlen($rawInput) > 10000) {
    sucrier_json_safe_error(413, 'Payload trop volumineux.');
}
$payload = json_decode($rawInput, true);
if (!is_array($payload)) {
    sucrier_json_safe_error(400, 'Payload invalide.');
}

$provider = (string) ($payload['provider'] ?? 'password');
$segment = (string) ($payload['segment'] ?? 'particulier');
$segment = $segment === 'professionnel' ? 'professionnel' : 'particulier';

try {
    $pdo = sucrier_auth_pdo();
} catch (Throwable $e) {
    sucrier_json_safe_error(500, 'Service temporairement indisponible.', 'auth-register: db error ' . $e->getMessage());
}

if ($provider === 'google') {
    $googleProfile = sucrier_auth_verify_google_access_token((string) ($payload['accessToken'] ?? ''));
    if (!$googleProfile) {
        sucrier_record_failed_login_attempt();
        sucrier_json_safe_error(401, 'Authentification Google invalide.');
    }

    $email = (string) ($googleProfile['email'] ?? '');
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sucrier_json_safe_error(400, 'Email Google manquant.');
    }

    $existing = sucrier_auth_find_user_by_email($pdo, $email);
    if ($existing) {
        sucrier_auth_enable_google($pdo, (int) $existing['id'], (string) ($googleProfile['name'] ?? ''));
        $user = sucrier_auth_find_user_by_email($pdo, $email);
    } else {
        $user = sucrier_auth_create_user($pdo, [
            'email' => $email,
            'password_hash' => null,
            'has_google' => true,
            'full_name' => (string) ($googleProfile['name'] ?? ''),
            'segment' => $segment,
        ]);
    }

    session_regenerate_id(true);
    sucrier_auth_start_user_session($user);
    $seg = (($user['segment'] ?? $segment) === 'professionnel') ? 'professionnel' : 'particulier';
    echo json_encode(['ok' => true, 'email' => $email, 'segment' => $seg]);
    exit;
}

$email = strtolower(trim((string) ($payload['email'] ?? '')));
$password = (string) ($payload['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 254) {
    sucrier_json_safe_error(422, 'Email invalide.');
}
if (strlen($password) < 8 || strlen($password) > 200) {
    sucrier_json_safe_error(422, 'Mot de passe invalide (8 a 200 caracteres).');
}
// Politique : au moins une lettre et un chiffre.
if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
    sucrier_json_safe_error(422, 'Mot de passe trop simple : melangez lettres et chiffres.');
}

if (sucrier_auth_find_user_by_email($pdo, $email)) {
    sucrier_json_safe_error(409, 'Ce compte existe deja.');
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$user = sucrier_auth_create_user($pdo, [
    'email' => $email,
    'password_hash' => $hash,
    'has_google' => false,
    'segment' => $segment,
]);

session_regenerate_id(true);
sucrier_auth_start_user_session($user);
$seg = (($user['segment'] ?? $segment) === 'professionnel') ? 'professionnel' : 'particulier';
echo json_encode(['ok' => true, 'email' => $email, 'segment' => $seg]);

