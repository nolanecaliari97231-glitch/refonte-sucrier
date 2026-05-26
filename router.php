<?php

declare(strict_types=1);

/**
 * Routeur pour le serveur PHP intégré : priorise les pages HTML (site complet)
 * et laisse passer API / admin en .php.
 */

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$root = __DIR__;
$path = $root . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, rawurldecode($uri));

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
if (is_file($htmlPath)) {
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
