<?php

declare(strict_types=1);

/**
 * Résout un chemin d'image catalogue vers le fichier réellement présent (.webp ou .png).
 */
function sucrier_resolve_catalog_image_path(string $path): string
{
    $path = trim($path);
    if ($path === '' || preg_match('#^https?://#i', $path)) {
        return $path;
    }

    $root = dirname(__DIR__);
    $relative = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
    $full = $root . DIRECTORY_SEPARATOR . $relative;

    if (is_file($full)) {
        return $path;
    }

    if (preg_match('/\.png$/i', $path)) {
        $webp = preg_replace('/\.png$/i', '.webp', $path);
        $webpFull = $root . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $webp);
        if (is_file($webpFull)) {
            return $webp;
        }
    } elseif (preg_match('/\.webp$/i', $path)) {
        $png = preg_replace('/\.webp$/i', '.png', $path);
        $pngFull = $root . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $png);
        if (is_file($pngFull)) {
            return $png;
        }
    }

    return $path;
}

/**
 * @param array<string, mixed> $data
 */
function sucrier_resolve_content_catalog_images(array &$data): void
{
    if (!isset($data['catalogue_books']) || !is_array($data['catalogue_books'])) {
        return;
    }

    foreach ($data['catalogue_books'] as &$row) {
        if (!is_array($row)) {
            continue;
        }
        if (!empty($row['image'])) {
            $row['image'] = sucrier_resolve_catalog_image_path((string) $row['image']);
        }
        if (!empty($row['preview_images'])) {
            $parts = array_map('trim', explode(',', (string) $row['preview_images']));
            $resolved = [];
            foreach ($parts as $part) {
                if ($part !== '') {
                    $resolved[] = sucrier_resolve_catalog_image_path($part);
                }
            }
            $row['preview_images'] = implode(',', $resolved);
        }
    }
    unset($row);
}
