<?php

declare(strict_types=1);

require_once __DIR__ . '/../includes/security.php';
require_once __DIR__ . '/../includes/auth_db.php';
require_once __DIR__ . '/../includes/pedagogical-sheets.php';

sucrier_start_secure_session();

$bookId = trim((string) ($_GET['book'] ?? ''));
if ($bookId === '' || !preg_match('/^[a-z0-9-]+$/i', $bookId)) {
    http_response_code(400);
    exit('Identifiant livre invalide.');
}

$user = sucrier_auth_get_user_session();
$segment = is_array($user) ? (string) ($user['segment'] ?? '') : '';
if ($segment !== 'professionnel') {
    http_response_code(403);
    exit('Accès réservé aux comptes professionnels.');
}

$contentPath = __DIR__ . '/../data/contenu.json';
$raw = is_readable($contentPath) ? file_get_contents($contentPath) : '{}';
$data = json_decode($raw ?: '{}', true);
if (!is_array($data)) {
    $data = [];
}

$fileWeb = sucrier_resolve_pedagogical_download_path($bookId, $data);
if ($fileWeb === null) {
    http_response_code(404);
    exit('Fiche pédagogique non disponible pour cet ouvrage.');
}

$root = realpath(__DIR__ . '/..');
$fileFs = realpath($root . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $fileWeb));
if ($fileFs === false || !is_file($fileFs) || !str_starts_with($fileFs, $root)) {
    http_response_code(404);
    exit('Fichier introuvable.');
}

$registry = sucrier_pedagogical_sheet_registry();
$downloadName = isset($registry[$bookId])
    ? 'fiche-pedagogique-' . $bookId . '.pdf'
    : basename($fileFs);

$mime = mime_content_type($fileFs) ?: 'application/pdf';
if ($mime === 'application/octet-stream' && str_ends_with(strtolower($fileFs), '.pdf')) {
    $mime = 'application/pdf';
}

header('Content-Type: ' . $mime);
header('Content-Disposition: attachment; filename="' . $downloadName . '"');
header('Content-Length: ' . (string) filesize($fileFs));
header('Cache-Control: private, no-store');
readfile($fileFs);
exit;
