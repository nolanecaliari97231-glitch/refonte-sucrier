<?php

declare(strict_types=1);

require_once __DIR__ . '/../includes/security.php';
require_once __DIR__ . '/../includes/catalog-image.php';
require_once __DIR__ . '/../includes/pedagogical-sheets.php';
require_once __DIR__ . '/../includes/content-public.php';
require_once __DIR__ . '/../includes/cms-profiles.php';

/**
 * API publique du contenu front.
 *
 * Role:
 * - lire data/contenu.json,
 * - resoudre certains assets (images/fiches),
 * - filtrer les champs sensibles (via content-public.php),
 * - renvoyer un JSON exploitable directement par app.js.
 */
sucrier_send_security_headers(true);
header('Content-Type: application/json; charset=utf-8');
// Contenu dynamique (back-office) : autoriser la mise en cache mais imposer la revalidation.
header('Cache-Control: public, max-age=0, must-revalidate');
header('Vary: Accept-Encoding');

$contentPath = __DIR__ . '/../data/contenu.json';
if (!is_readable($contentPath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Contenu indisponible.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Validation conditionnelle rapide (avant le parsing JSON) base sur mtime
$mtime = @filemtime($contentPath) ?: 0;
$etag = '"' . dechex($mtime) . '-' . dechex(@filesize($contentPath) ?: 0) . '"';
header('ETag: ' . $etag);
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $mtime) . ' GMT');

$ifNoneMatch = trim((string) ($_SERVER['HTTP_IF_NONE_MATCH'] ?? ''));
$ifModified  = trim((string) ($_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? ''));
if (
    ($ifNoneMatch !== '' && $ifNoneMatch === $etag) ||
    ($ifModified !== '' && strtotime($ifModified) >= $mtime)
) {
    http_response_code(304);
    exit;
}

// Compression GZIP locale (au cas o le serveur ne le fait pas)
if (!ini_get('zlib.output_compression') && !headers_sent()) {
    $accept = (string) ($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '');
    if (strpos($accept, 'gzip') !== false) {
        @ob_start('ob_gzhandler');
    }
}

$raw = file_get_contents($contentPath);
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    http_response_code(500);
    echo json_encode(['error' => 'Contenu invalide.'], JSON_UNESCAPED_UNICODE);
    exit;
}

sucrier_resolve_content_catalog_images($data);
$data['pedagogical_sheets_available'] = sucrier_pedagogical_sheets_available_ids();
$data = sucrier_attach_cms_profiles($data);
$data = sucrier_public_content_payload($data);

echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
