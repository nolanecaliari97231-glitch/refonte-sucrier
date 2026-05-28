<?php
declare(strict_types=1);

require_once __DIR__ . '/security.php';

/**
 * @return 'sqlite'|'pgsql'|'unknown'
 */
function sucrier_auth_driver_from_dsn(string $dsn): string
{
    if (str_starts_with($dsn, 'sqlite:')) {
        return 'sqlite';
    }
    if (str_starts_with($dsn, 'pgsql:')) {
        return 'pgsql';
    }

    return 'unknown';
}

/**
 * Résout DSN + identifiants depuis l'environnement.
 *
 * @return array{dsn:string,user:?string,pass:?string,driver:string}
 */
function sucrier_auth_resolve_dsn_config(): array
{
    $supabaseDsn = trim((string) (getenv('SUPABASE_DB_DSN') ?: getenv('SUPABASE_DB_URL') ?: ''));
    $authDsn = trim((string) (getenv('SUCRIER_AUTH_DSN') ?: ''));

    if ($authDsn !== '') {
        $dsn = $authDsn;
    } elseif ($supabaseDsn !== '') {
        $dsn = $supabaseDsn;
    } else {
        $dsn = 'sqlite:' . dirname(__DIR__) . '/data/auth.sqlite';
    }

    return [
        'dsn' => $dsn,
        'user' => getenv('SUCRIER_AUTH_DB_USER') ?: null,
        'pass' => getenv('SUCRIER_AUTH_DB_PASSWORD') ?: null,
        'driver' => sucrier_auth_driver_from_dsn($dsn),
    ];
}

function sucrier_auth_is_using_postgresql(): bool
{
    return sucrier_auth_resolve_dsn_config()['driver'] === 'pgsql';
}

function sucrier_auth_mask_dsn(string $dsn): string
{
    if (preg_match('/^(pgsql|sqlite):([^;]+)(.*)$/i', $dsn, $m)) {
        $scheme = $m[1];
        $hostPart = $m[2];
        $rest = $m[3] ?? '';
        if ($scheme === 'sqlite') {
            return 'sqlite:***';
        }
        if (preg_match('/^host=([^;]+)/i', $hostPart, $hm)) {
            return 'pgsql:host=' . $hm[1] . ';***' . preg_replace('/password=[^;]*/i', 'password=***', $rest);
        }

        return $scheme . ':***';
    }

    return '***';
}

/**
 * @return array{driver:string,dsn_masked:string,using_postgresql:bool}
 */
function sucrier_auth_database_info(): array
{
    $config = sucrier_auth_resolve_dsn_config();

    return [
        'driver' => $config['driver'],
        'dsn_masked' => sucrier_auth_mask_dsn($config['dsn']),
        'using_postgresql' => $config['driver'] === 'pgsql',
    ];
}

function sucrier_auth_pdo(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = sucrier_auth_resolve_dsn_config();
    $dsn = $config['dsn'];
    $driver = $config['driver'];

    if ($driver === 'pgsql' && !extension_loaded('pdo_pgsql')) {
        throw new RuntimeException(
            'PostgreSQL configuré (SUCRIER_AUTH_DSN) mais l’extension PHP pdo_pgsql est absente.'
        );
    }
    if ($driver === 'unknown') {
        throw new RuntimeException('DSN base de données non reconnu (attendu sqlite: ou pgsql:).');
    }

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];

    $pdo = new PDO($dsn, $config['user'] ?: null, $config['pass'] ?: null, $options);
    sucrier_auth_ensure_schema($pdo, $dsn);
    return $pdo;
}

function sucrier_auth_ensure_schema(PDO $pdo, string $dsn): void
{
    if (sucrier_auth_driver_from_dsn($dsn) === 'sqlite') {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NULL,
                has_google INTEGER NOT NULL DEFAULT 0,
                full_name TEXT NULL,
                segment TEXT NOT NULL DEFAULT "particulier",
                created_at TEXT NOT NULL
            )'
        );
        return;
    }

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            email VARCHAR(254) NOT NULL,
            password_hash TEXT NULL,
            has_google BOOLEAN NOT NULL DEFAULT FALSE,
            full_name VARCHAR(255) NULL,
            segment VARCHAR(32) NOT NULL DEFAULT \'particulier\',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT users_segment_check CHECK (segment IN (\'particulier\', \'professionnel\'))
        )'
    );
    $pdo->exec('CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_lower_idx ON users (LOWER(email))');
}

function sucrier_auth_bind_has_google(string $dsn, bool $hasGoogle): int|bool
{
    return sucrier_auth_driver_from_dsn($dsn) === 'pgsql' ? $hasGoogle : ($hasGoogle ? 1 : 0);
}

function sucrier_auth_normalize_user_row(array $row): array
{
    $row['has_google'] = !empty($row['has_google']);
    $row['id'] = (int) ($row['id'] ?? 0);

    return $row;
}

function sucrier_auth_find_user_by_email(PDO $pdo, string $email): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => strtolower(trim($email))]);
    $row = $stmt->fetch();

    return is_array($row) ? sucrier_auth_normalize_user_row($row) : null;
}

function sucrier_auth_create_user(PDO $pdo, array $payload): array
{
    $config = sucrier_auth_resolve_dsn_config();
    $createdAt = trim((string) ($payload['created_at'] ?? ''));
    if ($createdAt === '') {
        $createdAt = gmdate('c');
    }

    $stmt = $pdo->prepare(
        'INSERT INTO users (email, password_hash, has_google, full_name, segment, created_at)
         VALUES (:email, :password_hash, :has_google, :full_name, :segment, :created_at)'
    );
    $stmt->execute([
        'email' => strtolower(trim((string) ($payload['email'] ?? ''))),
        'password_hash' => $payload['password_hash'] ?? null,
        'has_google' => sucrier_auth_bind_has_google($config['dsn'], !empty($payload['has_google'])),
        'full_name' => $payload['full_name'] ?? null,
        'segment' => ($payload['segment'] ?? 'particulier') === 'professionnel' ? 'professionnel' : 'particulier',
        'created_at' => $createdAt,
    ]);

    $created = sucrier_auth_find_user_by_email($pdo, (string) ($payload['email'] ?? ''));
    if (!$created) {
        throw new RuntimeException('Impossible de récupérer le compte créé.');
    }
    return $created;
}

function sucrier_auth_enable_google(PDO $pdo, int $userId, ?string $name = null): void
{
    $config = sucrier_auth_resolve_dsn_config();
    $stmt = $pdo->prepare('UPDATE users SET has_google = :has_google, full_name = COALESCE(:full_name, full_name) WHERE id = :id');
    $stmt->execute([
        'has_google' => sucrier_auth_bind_has_google($config['dsn'], true),
        'full_name' => $name,
        'id' => $userId,
    ]);
}

/**
 * Identifiant client OAuth « Application Web » utilisé pour vérifier l'audience
 * du jeton côté serveur. Priorité :
 *   1. Variable d'environnement SUCRIER_GOOGLE_CLIENT_ID (recommandé en prod).
 *   2. Fichier racine google-auth-config.js (même valeur que le front) — pratique
 *      en local car PHP ne charge pas automatiquement un fichier .env.
 *
 * L'ID client OAuth n'est pas un secret (il est déjà exposé dans le JS du site).
 */
function sucrier_google_oauth_web_client_id(): string
{
    $fromEnv = trim((string) (getenv('SUCRIER_GOOGLE_CLIENT_ID') ?: ''));
    if ($fromEnv !== '') {
        return $fromEnv;
    }

    $configPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'google-auth-config.js';
    if (!is_readable($configPath)) {
        return '';
    }
    $raw = (string) @file_get_contents($configPath);
    if ($raw === '') {
        return '';
    }
    if (preg_match('/SUCRIER_GOOGLE_CLIENT_ID\s*=\s*["\']([^"\']+)["\']/', $raw, $m)) {
        return trim((string) ($m[1] ?? ''));
    }

    return '';
}

/**
 * Vérifie un access token Google côté serveur ET s'assure qu'il a été émis
 * pour notre application (audience = SUCRIER_GOOGLE_CLIENT_ID). Sans cette
 * vérification, n'importe quel access token Google valide (issu d'une autre
 * application) pourrait être présenté pour se connecter avec un email
 * arbitraire — c'est la principale faille corrigée ici (OWASP A07:2021,
 * « Identification and Authentication Failures »).
 *
 * Étapes :
 *  1. tokeninfo?access_token=… (Google) → vérifie validité + audience.
 *  2. userinfo (avec Bearer) → récupère email + email_verified + name.
 *
 * @return array{email:string,email_verified:bool,name:?string,sub:?string}|null
 */
function sucrier_auth_verify_google_access_token(string $accessToken): ?array
{
    $token = trim($accessToken);
    if ($token === '' || strlen($token) > 4096 || !preg_match('/^[A-Za-z0-9._\-]+$/', $token)) {
        return null;
    }

    $expectedClientId = sucrier_google_oauth_web_client_id();
    if ($expectedClientId === '') {
        // Politique stricte : sans client_id, l'authentification Google est refusée.
        error_log('[sucrier] Google OAuth refusé : aucun SUCRIER_GOOGLE_CLIENT_ID (env ni google-auth-config.js).');
        return null;
    }

    $tokenInfo = sucrier_auth_http_json_get(
        'https://oauth2.googleapis.com/tokeninfo?access_token=' . rawurlencode($token)
    );
    if (!is_array($tokenInfo)) {
        return null;
    }
    $audience = trim((string) ($tokenInfo['aud'] ?? ''));
    if ($audience === '' || !hash_equals($expectedClientId, $audience)) {
        error_log('[sucrier] Google OAuth rejected (audience mismatch).');
        return null;
    }
    $expiresIn = (int) ($tokenInfo['expires_in'] ?? 0);
    if ($expiresIn <= 0) {
        return null;
    }

    $userInfo = sucrier_auth_http_json_get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        ['Authorization: Bearer ' . $token, 'Accept: application/json']
    );
    if (!is_array($userInfo) || empty($userInfo['email'])) {
        return null;
    }

    $emailVerified = !empty($userInfo['email_verified']) || ($tokenInfo['email_verified'] ?? '') === 'true';
    if (!$emailVerified) {
        error_log('[sucrier] Google OAuth rejected (email not verified).');
        return null;
    }

    return [
        'email' => strtolower(trim((string) $userInfo['email'])),
        'email_verified' => true,
        'name' => isset($userInfo['name']) ? (string) $userInfo['name'] : null,
        'sub' => isset($userInfo['sub']) ? (string) $userInfo['sub'] : null,
    ];
}

/**
 * GET HTTP simplifié vers Google : timeout court, parsing JSON, pas de
 * propagation d'erreur réseau côté client.
 *
 * @param string[] $headers
 */
function sucrier_auth_http_json_get(string $url, array $headers = []): ?array
{
    $defaultHeaders = ['Accept: application/json'];
    $allHeaders = array_values(array_unique(array_merge($defaultHeaders, $headers)));

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_HTTPHEADER => $allHeaders,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if (!is_string($body) || $body === '' || $status < 200 || $status >= 300) {
            return null;
        }
        $decoded = json_decode($body, true);
        return is_array($decoded) ? $decoded : null;
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => implode("\r\n", $allHeaders) . "\r\n",
            'timeout' => 8,
            'ignore_errors' => true,
        ],
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ],
    ]);
    $body = @file_get_contents($url, false, $context);
    if (!is_string($body) || $body === '') {
        return null;
    }
    $decoded = json_decode($body, true);
    return is_array($decoded) ? $decoded : null;
}

function sucrier_auth_start_user_session(array $user): void
{
    sucrier_start_secure_session();
    $_SESSION['user'] = [
        'id' => (int) ($user['id'] ?? 0),
        'email' => (string) ($user['email'] ?? ''),
        'segment' => ($user['segment'] ?? 'particulier') === 'professionnel' ? 'professionnel' : 'particulier',
        'has_google' => !empty($user['has_google']),
        'full_name' => (string) ($user['full_name'] ?? ''),
        'login_at' => time(),
    ];
}

function sucrier_auth_get_user_session(): ?array
{
    sucrier_start_secure_session();
    $session = $_SESSION['user'] ?? null;
    return is_array($session) ? $session : null;
}

function sucrier_auth_normalize_segment(string $segment): string
{
    return $segment === 'professionnel' ? 'professionnel' : 'particulier';
}
