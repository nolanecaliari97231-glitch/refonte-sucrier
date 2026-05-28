<?php
declare(strict_types=1);

require_once __DIR__ . '/security.php';
sucrier_send_security_headers();
sucrier_start_secure_session();

$supportedLangs = ['fr', 'en'];
$requestedLang = $_GET['lang'] ?? null;
$cookieLang = $_COOKIE['sucrier_language'] ?? null;
$sessionLang = $_SESSION['sucrier_language'] ?? null;

if (is_string($requestedLang) && in_array($requestedLang, $supportedLangs, true)) {
    $currentLang = $requestedLang;
} elseif (is_string($sessionLang) && in_array($sessionLang, $supportedLangs, true)) {
    $currentLang = $sessionLang;
} elseif (is_string($cookieLang) && in_array($cookieLang, $supportedLangs, true)) {
    $currentLang = $cookieLang;
} else {
    $currentLang = 'fr';
}

$_SESSION['sucrier_language'] = $currentLang;
setcookie('sucrier_language', $currentLang, [
    'expires' => time() + (365 * 24 * 60 * 60),
    'path' => '/',
    'secure' => sucrier_is_https(),
    'httponly' => false,
    'samesite' => 'Lax',
]);

$config = require __DIR__ . '/../data/config.php';

$contenuPath = __DIR__ . '/../data/contenu.json';
$contenuRaw = is_file($contenuPath) ? file_get_contents($contenuPath) : '{}';
$contenu = json_decode($contenuRaw ?: '{}', true);

if (!is_array($contenu)) {
    $contenu = [];
}

function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function contenu_get(array $data, string $path, string $default = ''): string
{
    $current = $data;
    $segments = explode('.', $path);

    foreach ($segments as $segment) {
        if (!is_array($current) || !array_key_exists($segment, $current)) {
            return $default;
        }
        $current = $current[$segment];
    }

    return is_scalar($current) ? (string) $current : $default;
}

function contenu_get_array(array $data, string $path, array $default = []): array
{
    $current = $data;
    $segments = explode('.', $path);

    foreach ($segments as $segment) {
        if (!is_array($current) || !array_key_exists($segment, $current)) {
            return $default;
        }
        $current = $current[$segment];
    }

    return is_array($current) ? $current : $default;
}

function tr(string $fr, string $en): string
{
    global $currentLang;
    return $currentLang === 'en' ? $en : $fr;
}
