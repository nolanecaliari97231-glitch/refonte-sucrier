<?php

declare(strict_types=1);

/**
 * Diagnostic léger pour l'environnement de test (universe.wf).
 * Ne pas activer en production publique finale sans SUCRIER_HEALTH_CHECK=1.
 */

require_once __DIR__ . '/../includes/env.php';
require_once __DIR__ . '/../includes/security.php';

sucrier_harden_error_reporting();
sucrier_send_security_headers(true);
header('Content-Type: application/json; charset=utf-8');

$host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
$allowed = str_contains($host, 'universe.wf') || trim((string) (getenv('SUCRIER_HEALTH_CHECK') ?: '')) === '1';
if (!$allowed) {
    http_response_code(404);
    echo json_encode(['ok' => false], JSON_UNESCAPED_UNICODE);
    exit;
}

$adminHash = trim((string) (getenv('SUCRIER_ADMIN_PASSWORD_HASH') ?: ''));
$hashFile = dirname(__DIR__) . '/data/admin-password.hash';
$adminConfigured = $adminHash !== '' || (is_file($hashFile) && trim((string) @file_get_contents($hashFile)) !== '');

$result = [
    'ok' => true,
    'php' => PHP_VERSION,
    'https' => sucrier_is_https(),
    'pdo_pgsql' => extension_loaded('pdo_pgsql'),
    'sumup_configured' => trim((string) (getenv('SUCRIER_SUMUP_API_KEY') ?: '')) !== '',
    'admin_configured' => $adminConfigured,
    'google_client_id_configured' => false,
    'database' => ['ok' => false, 'driver' => null],
    'hints' => [],
];

require_once __DIR__ . '/../includes/auth_db.php';
$result['google_client_id_configured'] = sucrier_google_oauth_web_client_id() !== '';

try {
    $info = sucrier_auth_database_info();
    $pdo = sucrier_auth_pdo();
    $pdo->query('SELECT 1');
    $result['database'] = ['ok' => true, 'driver' => $info['driver']];
} catch (Throwable $e) {
    $result['ok'] = false;
    $result['database'] = ['ok' => false, 'driver' => sucrier_auth_resolve_dsn_config()['driver']];
    $result['hints'][] = 'PostgreSQL : activer pdo_pgsql dans cPanel et vérifier SUCRIER_AUTH_DSN (host=127.0.0.1).';
}

if (!$result['pdo_pgsql']) {
    $result['ok'] = false;
    $result['hints'][] = 'Extension PHP pdo_pgsql absente.';
}
if (!$result['sumup_configured']) {
    $result['hints'][] = 'Définir SUCRIER_SUMUP_API_KEY et SUCRIER_SUMUP_MERCHANT_CODE dans .env.';
}
if (!$result['admin_configured']) {
    $result['hints'][] = 'Définir SUCRIER_ADMIN_PASSWORD_HASH ou data/admin-password.hash pour le back-office.';
}
if (!$result['google_client_id_configured']) {
    $result['hints'][] = 'Définir SUCRIER_GOOGLE_CLIENT_ID (ou google-auth-config.js).';
}

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
