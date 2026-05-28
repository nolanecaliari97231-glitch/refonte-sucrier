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
    sucrier_json_safe_error(403, 'Requete refusee.', 'auth-login: origin mismatch');
}

$contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
if ($contentType !== '' && strpos($contentType, 'application/json') !== 0) {
    sucrier_json_safe_error(415, 'Content-Type invalide.');
}

$rawInput = file_get_contents('php://input');
if (!is_string($rawInput) || strlen($rawInput) > 10000) {
    sucrier_json_safe_error(413, 'Payload trop volumineux.');
}
$payload = json_decode($rawInput, true);
if (!is_array($payload)) {
    sucrier_json_safe_error(400, 'Payload invalide.');
}

if (!sucrier_throttle_consume('auth_login', 20, 600)) {
    sucrier_json_safe_error(429, 'Trop de tentatives. Reessayez plus tard.', 'auth-login: throttled');
}

try {
    $pdo = sucrier_auth_pdo();
} catch (Throwable $e) {
    sucrier_json_safe_error(500, 'Service temporairement indisponible.', 'auth-login: db error ' . $e->getMessage());
}

$provider = (string) ($payload['provider'] ?? 'password');

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

    $user = sucrier_auth_find_user_by_email($pdo, $email);
    if ($user) {
        if (empty($user['has_google'])) {
            sucrier_auth_enable_google($pdo, (int) $user['id'], (string) ($googleProfile['name'] ?? ''));
            $user = sucrier_auth_find_user_by_email($pdo, $email);
        }
    } else {
        $segment = sucrier_auth_normalize_segment((string) ($payload['segment'] ?? ''));
        if ($segment === '') {
            $segment = 'particulier';
        }
        $user = sucrier_auth_create_user($pdo, [
            'email' => $email,
            'password_hash' => null,
            'has_google' => true,
            'full_name' => (string) ($googleProfile['name'] ?? ''),
            'segment' => $segment,
        ]);
    }

    if (!$user) {
        sucrier_record_failed_login_attempt();
        sucrier_json_safe_error(500, 'Impossible de finaliser la connexion Google.');
    }

    $userSegment = (($user['segment'] ?? 'particulier') === 'professionnel') ? 'professionnel' : 'particulier';
    $requestedSegment = sucrier_auth_normalize_segment((string) ($payload['segment'] ?? ''));
    if ($requestedSegment === 'professionnel' && $userSegment !== 'professionnel') {
        sucrier_record_failed_login_attempt();
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'error' => 'Ce compte est enregistre en tant que particulier. Pour un acces professionnel, creez un compte professionnel ou connectez-vous via le parcours particulier.',
            'code' => 'segment_mismatch',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    session_regenerate_id(true);
    sucrier_reset_login_attempts();
    sucrier_auth_start_user_session($user);
    echo json_encode(['ok' => true, 'email' => $email, 'segment' => $userSegment]);
    exit;
}

$email = strtolower(trim((string) ($payload['email'] ?? '')));
$password = (string) ($payload['password'] ?? '');

if (
    !filter_var($email, FILTER_VALIDATE_EMAIL)
    || mb_strlen($email) > 254
    || $password === ''
    || strlen($password) > 200
) {
    sucrier_record_failed_login_attempt();
    sucrier_json_safe_error(422, 'Identifiants invalides.');
}

$user = sucrier_auth_find_user_by_email($pdo, $email);
if (!$user || empty($user['password_hash']) || !password_verify($password, (string) $user['password_hash'])) {
    sucrier_record_failed_login_attempt();
    sucrier_json_safe_error(401, 'Email ou mot de passe incorrect.');
}

// Régénération de l'ID de session pour prévenir le session fixation.
session_regenerate_id(true);

$userSegment = (($user['segment'] ?? 'particulier') === 'professionnel') ? 'professionnel' : 'particulier';
$requestedSegment = sucrier_auth_normalize_segment((string) ($payload['segment'] ?? ''));
if ($requestedSegment === 'professionnel' && $userSegment !== 'professionnel') {
    sucrier_record_failed_login_attempt();
    http_response_code(403);
    echo json_encode([
        'ok' => false,
        'error' => 'Ce compte est enregistre en tant que particulier. Pour un acces professionnel, creez un compte professionnel ou connectez-vous via le parcours particulier.',
        'code' => 'segment_mismatch',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

sucrier_reset_login_attempts();
sucrier_auth_start_user_session($user);
echo json_encode(['ok' => true, 'email' => $email, 'segment' => $userSegment]);

