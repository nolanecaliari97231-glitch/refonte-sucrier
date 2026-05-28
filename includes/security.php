<?php
declare(strict_types=1);

require_once __DIR__ . '/env.php';

/**
 * Centralise la posture de sécurité du site : HTTPS detection, en-têtes HTTP
 * (CSP, HSTS, Frame-Options, etc.), sessions, CSRF, throttling, fingerprint
 * admin, et helpers anti-CSRF par origine pour les APIs JSON.
 *
 * Principes appliqués (Zéro Trust côté serveur) :
 *   - Aucun secret en clair côté client.
 *   - Validation stricte des entrées (whitelist) côté serveur.
 *   - Réponses d'erreur génériques côté client ; détails uniquement en log.
 *   - Cookies de session HttpOnly + Secure (en HTTPS) + SameSite Strict.
 *   - CSRF protégé par double mécanisme : token + vérification d'origine.
 */

function sucrier_is_https(): bool
{
    if (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
        return true;
    }
    if (isset($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443) {
        return true;
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https') {
        return true;
    }
    return false;
}

function sucrier_is_dev_host(): bool
{
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === '') {
        return PHP_SAPI === 'cli-server';
    }
    return $host === 'localhost'
        || str_starts_with($host, 'localhost:')
        || str_starts_with($host, '127.0.0.1');
}

function sucrier_is_production_host(): bool
{
    return !sucrier_is_dev_host();
}

/**
 * Renvoie la Content-Security-Policy à appliquer. Stricte par défaut.
 * Si vous ajoutez un nouveau domaine externe (CDN, image, font), ajustez ici.
 */
function sucrier_content_security_policy(): string
{
    $directives = [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "img-src 'self' data: https://lh3.googleusercontent.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        // 'unsafe-inline' nécessaire tant que le front utilise des handlers
        // inline et data-bindings ; à durcir vers des nonces ultérieurement.
        "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
        "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://api.sumup.com https://api-adresse.data.gouv.fr",
        "frame-src https://accounts.google.com https://pay.sumup.com",
    ];
    // Safari applique strictement upgrade-insecure-requests : en dev HTTP
    // (localhost:8000) les CSS/fonts passent en HTTPS et ne chargent plus.
    if (sucrier_is_https()) {
        $directives[] = 'upgrade-insecure-requests';
    }
    return implode('; ', $directives);
}

function sucrier_send_security_headers(bool $apiResponse = false): void
{
    if (headers_sent()) {
        return;
    }

    // Masque l'environnement serveur côté client.
    header_remove('X-Powered-By');
    header_remove('Server');

    header('X-Frame-Options: DENY');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self)');
    header('Cross-Origin-Opener-Policy: same-origin');
    header('Cross-Origin-Resource-Policy: same-origin');
    header('Content-Security-Policy: ' . sucrier_content_security_policy());

    if (sucrier_is_https()) {
        header('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');
    }

    if ($apiResponse) {
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
    }
}

/**
 * Configure PHP pour ne JAMAIS afficher les détails d'erreur côté client en
 * production. Les détails sont uniquement logués via error_log.
 */
function sucrier_harden_error_reporting(): void
{
    if (sucrier_is_dev_host()) {
        return;
    }
    @ini_set('display_errors', '0');
    @ini_set('display_startup_errors', '0');
    @ini_set('log_errors', '1');
    @ini_set('expose_php', '0');
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
}

function sucrier_start_secure_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    // SameSite=Strict : empêche l'envoi du cookie de session sur toute requête
    // initiée depuis un autre site (protection anti-CSRF de premier plan).
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => sucrier_is_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);

    @ini_set('session.use_strict_mode', '1');
    @ini_set('session.use_only_cookies', '1');
    @ini_set('session.cookie_httponly', '1');
    @ini_set('session.cookie_samesite', 'Strict');

    session_start();
}

/**
 * Renvoie la liste des origines de confiance pour les appels API (CSRF).
 * Par défaut : domaine courant + localhost en dev. Étend via la variable
 * d'environnement SUCRIER_ALLOWED_ORIGINS (séparée par virgules).
 *
 * @return string[]
 */
function sucrier_allowed_origins(): array
{
    $origins = [];
    $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
    if ($host !== '') {
        $scheme = sucrier_is_https() ? 'https' : 'http';
        $origins[] = $scheme . '://' . $host;
    }
    $envOrigins = getenv('SUCRIER_ALLOWED_ORIGINS');
    if (is_string($envOrigins) && $envOrigins !== '') {
        foreach (explode(',', $envOrigins) as $part) {
            $clean = rtrim(trim($part), '/');
            if ($clean !== '') {
                $origins[] = $clean;
            }
        }
    }
    if (sucrier_is_dev_host()) {
        $origins[] = 'http://localhost:8000';
        $origins[] = 'http://127.0.0.1:8000';
        $origins[] = 'http://localhost:8001';
        $origins[] = 'http://127.0.0.1:8001';
    }
    return array_values(array_unique(array_filter($origins)));
}

/**
 * Vérifie l'origine (Origin ou Referer) pour les requêtes mutables. Sert de
 * deuxième barrière anti-CSRF pour les APIs JSON appelées sans formulaire.
 */
function sucrier_check_request_origin(): bool
{
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        return true;
    }
    $allowed = sucrier_allowed_origins();
    if (empty($allowed)) {
        return false;
    }

    $candidates = [];
    $origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin !== '' && $origin !== 'null') {
        $candidates[] = rtrim($origin, '/');
    }
    $referer = trim((string) ($_SERVER['HTTP_REFERER'] ?? ''));
    if ($referer !== '') {
        $parts = parse_url($referer);
        if (is_array($parts) && !empty($parts['scheme']) && !empty($parts['host'])) {
            $candidate = $parts['scheme'] . '://' . $parts['host'];
            if (!empty($parts['port'])) {
                $candidate .= ':' . $parts['port'];
            }
            $candidates[] = $candidate;
        }
    }
    if (empty($candidates)) {
        // Sans Origin ni Referer, on refuse les requêtes mutables (browsers
        // modernes envoient toujours au moins l'un des deux pour fetch).
        return false;
    }

    foreach ($candidates as $candidate) {
        foreach ($allowed as $allowedOrigin) {
            if (hash_equals($allowedOrigin, $candidate)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Renvoie une réponse JSON d'erreur générique et termine le script.
 * Le message technique n'est jamais inclus côté client.
 */
function sucrier_json_safe_error(int $status, string $userMessage, ?string $logContext = null): void
{
    if ($logContext !== null) {
        error_log('[sucrier] ' . $logContext);
    }
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $userMessage], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Vérifie qu'un chemin résolu reste sous la racine du site (anti path traversal).
 */
function sucrier_path_within_root(string $candidatePath, string $rootDir): bool
{
    $rootReal = realpath($rootDir);
    if ($rootReal === false) {
        return false;
    }
    $candidateReal = realpath($candidatePath);
    if ($candidateReal !== false) {
        return str_starts_with($candidateReal, $rootReal . DIRECTORY_SEPARATOR)
            || hash_equals($rootReal, $candidateReal);
    }
    $parentReal = realpath(dirname($candidatePath));
    if ($parentReal === false) {
        return false;
    }
    return str_starts_with($parentReal, $rootReal . DIRECTORY_SEPARATOR)
        || hash_equals($rootReal, $parentReal);
}

function sucrier_get_csrf_token(): string
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        sucrier_start_secure_session();
    }
    if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function sucrier_validate_csrf_from_post(string $field = 'csrf_token'): bool
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        sucrier_start_secure_session();
    }
    $token = $_POST[$field] ?? '';
    $sessionToken = $_SESSION['csrf_token'] ?? '';
    return is_string($token) && is_string($sessionToken) && $sessionToken !== '' && hash_equals($sessionToken, $token);
}

function sucrier_throttle_login_attempts(int $maxAttempts = 5, int $lockSeconds = 600): bool
{
    return sucrier_throttle_request('admin_login', $maxAttempts, $lockSeconds);
}

/**
 * Limite le débit par session (panier, contact, etc.).
 */
function sucrier_throttle_request(string $bucket, int $maxAttempts = 10, int $lockSeconds = 600): bool
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        sucrier_start_secure_session();
    }

    $bucket = preg_replace('/[^a-z0-9_-]/i', '_', $bucket) ?: 'default';
    if (!isset($_SESSION['sucrier_throttle']) || !is_array($_SESSION['sucrier_throttle'])) {
        $_SESSION['sucrier_throttle'] = [];
    }

    $entry = $_SESSION['sucrier_throttle'][$bucket] ?? ['count' => 0, 'first' => 0];
    $attempts = (int) ($entry['count'] ?? 0);
    $firstTs = (int) ($entry['first'] ?? 0);
    $now = time();

    if ($firstTs > 0 && ($now - $firstTs) >= $lockSeconds) {
        $attempts = 0;
        $firstTs = 0;
    }

    if ($attempts >= $maxAttempts && $firstTs > 0 && ($now - $firstTs) < $lockSeconds) {
        return false;
    }

    if ($firstTs === 0) {
        $firstTs = $now;
    }

    $_SESSION['sucrier_throttle'][$bucket] = [
        'count' => $attempts,
        'first' => $firstTs,
    ];

    return true;
}

/**
 * Consomme une tentative (ex. création de paiement) — incrémente à chaque appel.
 */
function sucrier_throttle_consume(string $bucket, int $maxAttempts = 10, int $lockSeconds = 600): bool
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        sucrier_start_secure_session();
    }

    $bucket = preg_replace('/[^a-z0-9_-]/i', '_', $bucket) ?: 'default';
    if (!isset($_SESSION['sucrier_throttle']) || !is_array($_SESSION['sucrier_throttle'])) {
        $_SESSION['sucrier_throttle'] = [];
    }

    $entry = $_SESSION['sucrier_throttle'][$bucket] ?? ['count' => 0, 'first' => 0];
    $attempts = (int) ($entry['count'] ?? 0);
    $firstTs = (int) ($entry['first'] ?? 0);
    $now = time();

    if ($firstTs > 0 && ($now - $firstTs) >= $lockSeconds) {
        $attempts = 0;
        $firstTs = $now;
    } elseif ($firstTs === 0) {
        $firstTs = $now;
    }

    if ($attempts >= $maxAttempts) {
        return false;
    }

    $_SESSION['sucrier_throttle'][$bucket] = [
        'count' => $attempts + 1,
        'first' => $firstTs,
    ];

    return true;
}

function sucrier_record_throttle_failure(string $bucket): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        sucrier_start_secure_session();
    }
    $bucket = preg_replace('/[^a-z0-9_-]/i', '_', $bucket) ?: 'default';
    if (!isset($_SESSION['sucrier_throttle']) || !is_array($_SESSION['sucrier_throttle'])) {
        $_SESSION['sucrier_throttle'] = [];
    }
    $entry = $_SESSION['sucrier_throttle'][$bucket] ?? ['count' => 0, 'first' => time()];
    $_SESSION['sucrier_throttle'][$bucket] = [
        'count' => (int) ($entry['count'] ?? 0) + 1,
        'first' => (int) ($entry['first'] ?? time()) ?: time(),
    ];
}

function sucrier_reset_throttle_request(string $bucket): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        sucrier_start_secure_session();
    }
    $bucket = preg_replace('/[^a-z0-9_-]/i', '_', $bucket) ?: 'default';
    if (isset($_SESSION['sucrier_throttle'][$bucket])) {
        unset($_SESSION['sucrier_throttle'][$bucket]);
    }
}

function sucrier_record_failed_login_attempt(): void
{
    sucrier_record_throttle_failure('admin_login');
}

function sucrier_reset_login_attempts(): void
{
    sucrier_reset_throttle_request('admin_login');
}

function sucrier_admin_fingerprint(): string
{
    $ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown');
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
    return hash('sha256', $ua . '|' . $ip);
}

function sucrier_mark_admin_session(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        sucrier_start_secure_session();
    }
    $_SESSION['is_admin'] = true;
    $_SESSION['admin_login_at'] = time();
    $_SESSION['admin_last_activity'] = time();
    $_SESSION['admin_fingerprint'] = sucrier_admin_fingerprint();
}

function sucrier_require_admin(int $idleTimeoutSeconds = 1800): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        sucrier_start_secure_session();
    }

    $isAdmin = !empty($_SESSION['is_admin']);
    $fingerprint = (string) ($_SESSION['admin_fingerprint'] ?? '');
    $lastActivity = (int) ($_SESSION['admin_last_activity'] ?? 0);
    $now = time();

    $sessionExpired = $lastActivity > 0 && ($now - $lastActivity) > $idleTimeoutSeconds;
    $fingerprintMismatch = $fingerprint === '' || !hash_equals($fingerprint, sucrier_admin_fingerprint());

    if (!$isAdmin || $sessionExpired || $fingerprintMismatch) {
        $_SESSION = [];
        session_destroy();
        header('Location: login.php');
        exit;
    }

    $_SESSION['admin_last_activity'] = $now;
}

