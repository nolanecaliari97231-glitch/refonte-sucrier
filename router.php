<?php

declare(strict_types=1);

require_once __DIR__ . '/includes/security.php';

/**
 * Routeur pour le serveur PHP intégré : priorise les pages HTML (site complet)
 * et laisse passer API / admin en .php.
 */

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$root = __DIR__;
$decodedUri = rawurldecode($uri);
if (
    str_contains($decodedUri, "\0")
    || str_contains($decodedUri, '..')
    || !str_starts_with($decodedUri, '/')
) {
    http_response_code(400);
    return false;
}
$path = $root . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $decodedUri);
if (!sucrier_path_within_root($path, $root)) {
    http_response_code(403);
    return false;
}

if ($uri === '/' || $uri === '') {
    $indexHtml = $root . DIRECTORY_SEPARATOR . 'index.html';
    if (is_file($indexHtml)) {
        header('Content-Type: text/html; charset=UTF-8');
        readfile($indexHtml);
        return true;
    }
}

if (is_file($path)) {
    return false;
}

if (is_dir($path)) {
    $indexHtml = rtrim($path, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'index.html';
    if (is_file($indexHtml)) {
        header('Content-Type: text/html; charset=UTF-8');
        readfile($indexHtml);
        return true;
    }
}

$htmlPath = $path . '.html';
if (is_file($htmlPath) && sucrier_path_within_root($htmlPath, $root)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($htmlPath);
    return true;
}

$notFound = $root . DIRECTORY_SEPARATOR . '404.html';
if (is_file($notFound)) {
    http_response_code(404);
    header('Content-Type: text/html; charset=UTF-8');
    readfile($notFound);
    return true;
}

return false;
