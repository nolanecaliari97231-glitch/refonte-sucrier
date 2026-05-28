<?php

declare(strict_types=1);

function sucrier_content_paths(): array
{
    $root = defined('SUCRIER_SITE_ROOT') ? SUCRIER_SITE_ROOT : dirname(__DIR__);

    return [
        'root' => $root,
        'content' => $root . '/data/contenu.json',
        'backup' => $root . '/data/contenu.backup.json',
        'uploads_fs' => $root . '/images/uploads',
        'uploads_web' => 'images/uploads',
        'pedagogical_fs' => $root . '/data/pedagogical',
        'pedagogical_web' => 'data/pedagogical',
    ];
}

function sucrier_ensure_upload_dirs(): void
{
    $paths = sucrier_content_paths();
    foreach ([$paths['uploads_fs'], $paths['pedagogical_fs']] as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

function sucrier_make_book_id(string $title, int $index): string
{
    $slug = strtolower(trim($title));
    $slug = preg_replace('/[^a-z0-9]+/i', '-', $slug ?? '') ?? '';
    $slug = trim($slug, '-');
    if ($slug === '') {
        $slug = 'livre-' . ($index + 1);
    }

    return $slug;
}

function sucrier_upload_image_file(string $fieldName, ?string $uploadDirFs = null, ?string $uploadDirWeb = null): ?string
{
    $paths = sucrier_content_paths();
    $uploadDirFs = $uploadDirFs ?? $paths['uploads_fs'];
    $uploadDirWeb = $uploadDirWeb ?? $paths['uploads_web'];
    sucrier_ensure_upload_dirs();

    if (!isset($_FILES[$fieldName])) {
        return null;
    }

    $file = $_FILES[$fieldName];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        return null;
    }

    $tmpPath = (string) ($file['tmp_name'] ?? '');
    if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
        return null;
    }

    $allowedMimeToExt = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    $mime = mime_content_type($tmpPath) ?: '';
    if (!isset($allowedMimeToExt[$mime])) {
        return null;
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > (8 * 1024 * 1024)) {
        return null;
    }

    $ext = $allowedMimeToExt[$mime];
    $safeName = date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
    $targetFs = rtrim($uploadDirFs, '/\\') . DIRECTORY_SEPARATOR . $safeName;

    if (!move_uploaded_file($tmpPath, $targetFs)) {
        return null;
    }

    return rtrim(str_replace('\\', '/', $uploadDirWeb), '/') . '/' . $safeName;
}

/**
 * @return string[]
 */
function sucrier_upload_preview_files(string $fieldName, ?string $uploadDirFs = null, ?string $uploadDirWeb = null): array
{
    if (
        !isset($_FILES[$fieldName]['name']) ||
        !is_array($_FILES[$fieldName]['name'])
    ) {
        return [];
    }

    $uploaded = [];
    $maxFiles = min(3, count($_FILES[$fieldName]['name']));
    for ($j = 0; $j < $maxFiles; $j++) {
        $error = $_FILES[$fieldName]['error'][$j] ?? UPLOAD_ERR_NO_FILE;
        if ($error === UPLOAD_ERR_NO_FILE) {
            continue;
        }

        $singleField = $fieldName . '_single_' . $j;
        $_FILES[$singleField] = [
            'name' => $_FILES[$fieldName]['name'][$j] ?? '',
            'type' => $_FILES[$fieldName]['type'][$j] ?? '',
            'tmp_name' => $_FILES[$fieldName]['tmp_name'][$j] ?? '',
            'error' => $error,
            'size' => $_FILES[$fieldName]['size'][$j] ?? 0,
        ];

        $path = sucrier_upload_image_file($singleField, $uploadDirFs, $uploadDirWeb);
        unset($_FILES[$singleField]);
        if ($path !== null) {
            $uploaded[] = $path;
        }
    }

    return $uploaded;
}

function sucrier_upload_pedagogical_file(string $fieldName, string $bookId): ?string
{
    $paths = sucrier_content_paths();
    sucrier_ensure_upload_dirs();

    if (!isset($_FILES[$fieldName])) {
        return null;
    }

    $file = $_FILES[$fieldName];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if (($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        return null;
    }

    $tmpPath = (string) ($file['tmp_name'] ?? '');
    if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
        return null;
    }

    $mime = mime_content_type($tmpPath) ?: '';
    $allowed = [
        'application/pdf' => 'pdf',
        'text/plain' => 'txt',
    ];
    if (!isset($allowed[$mime])) {
        return null;
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > (12 * 1024 * 1024)) {
        return null;
    }

    $slug = preg_replace('/[^a-z0-9-]+/i', '-', strtolower(trim($bookId))) ?: 'livre';
    $ext = $allowed[$mime];
    $targetFs = $paths['pedagogical_fs'] . DIRECTORY_SEPARATOR . $slug . '.' . $ext;

    if (!move_uploaded_file($tmpPath, $targetFs)) {
        return null;
    }

    return $paths['pedagogical_web'] . '/' . $slug . '.' . $ext;
}

function sucrier_save_content_json(array $data): bool
{
    $paths = sucrier_content_paths();
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }

    return file_put_contents($paths['content'], $json . PHP_EOL, LOCK_EX) !== false;
}

function sucrier_default_news_items(): array
{
    return [
        [
            'id' => 'actu-bebe-nikou-dit-non',
            'tag' => 'nouveau',
            'tag_label' => 'Nouveau livre',
            'title' => 'Sortie de Bébé Nikou dit non — édition révisée',
            'date' => 'Mars 2025',
            'image' => 'images/catalog/bebe-nikou-dit-non.webp',
            'cover_style' => 'book',
            'link' => 'livre.html?id=bebe-nikou-dit-non',
        ],
        [
            'id' => 'actu-fljm-2024',
            'tag' => 'evenement',
            'tag_label' => 'Événement',
            'title' => 'Les Éditions du Sucrier aux rencontres FLJM 2024',
            'date' => 'Avril 2025',
            'image' => 'images/portraits/laane-ramassamy-fljm2024.webp',
            'cover_style' => 'portrait',
            'link' => '',
        ],
        [
            'id' => 'actu-tice-et-metice',
            'tag' => 'publication',
            'tag_label' => 'Publication',
            'title' => 'Tice et Métice : album multilingue primé aux Antilles',
            'date' => 'Février 2025',
            'image' => 'images/catalog/tice-et-metice-premiere-couverture.webp',
            'cover_style' => 'book',
            'link' => 'livre.html?id=tice-et-metice',
        ],
        [
            'id' => 'actu-nikou-champion',
            'tag' => 'nouveau',
            'tag_label' => 'Annonce',
            'title' => "Nikou champion : l'album multilingue déjà culte",
            'date' => 'Janvier 2025',
            'image' => 'images/catalog/nikou-champion-cover.png',
            'cover_style' => 'book',
            'link' => 'livre.html?id=nikou-champion',
        ],
    ];
}
