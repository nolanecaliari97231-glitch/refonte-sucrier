<?php

declare(strict_types=1);

/**
 * Fiches pédagogiques « Pourquoi utiliser nos publications à l'école » (extraits par ouvrage).
 * Pages indexées à partir de 0 (pypdf).
 *
 * @return array<string, array{pages: list<int>, label: string}>
 */
function sucrier_pedagogical_sheet_registry(): array
{
    return [
        'nikou-formes' => [
            'pages' => [0],
            'label' => 'Nikou joue avec les formes',
        ],
        'le-cahier-de-nikou' => [
            'pages' => [0],
            'label' => 'Le cahier de Nikou — niveau 1 (3/4 ans)',
        ],
        'les-couleurs-de-nikou' => [
            'pages' => [1],
            'label' => 'Les couleurs de Nikou',
        ],
        'compte-avec-nikou' => [
            'pages' => [1, 2],
            'label' => 'Compte avec Nikou',
        ],
        'le-carnaval-de-nikou' => [
            'pages' => [2],
            'label' => 'Le carnaval de Nikou',
        ],
        'lettres-ou-betes' => [
            'pages' => [3],
            'label' => 'Lettres ou bêtes ? Abécédaire animalier de la Caraïbe',
        ],
        'exocette' => [
            'pages' => [4],
            'label' => 'Exocette',
        ],
    ];
}

function sucrier_pedagogical_sheets_dir(): string
{
    return dirname(__DIR__) . '/data/pedagogical';
}

function sucrier_pedagogical_sheet_web_path(string $bookId): string
{
    $slug = preg_replace('/[^a-z0-9-]+/i', '-', strtolower($bookId)) ?: 'livre';

    return 'data/pedagogical/' . $slug . '.pdf';
}

function sucrier_pedagogical_sheet_fs_path(string $bookId): ?string
{
    $bookId = trim($bookId);
    if ($bookId === '' || !isset(sucrier_pedagogical_sheet_registry()[$bookId])) {
        return null;
    }

    $path = sucrier_pedagogical_sheets_dir() . DIRECTORY_SEPARATOR . $bookId . '.pdf';
    if (!is_file($path)) {
        return null;
    }

    return $path;
}

/** @return list<string> */
function sucrier_pedagogical_sheets_available_ids(): array
{
    $out = [];
    foreach (array_keys(sucrier_pedagogical_sheet_registry()) as $bookId) {
        if (sucrier_pedagogical_sheet_fs_path($bookId) !== null) {
            $out[] = $bookId;
        }
    }

    return $out;
}

function sucrier_book_has_pedagogical_sheet(string $bookId, array $contenu = []): bool
{
    $bookId = trim($bookId);
    if ($bookId === '') {
        return false;
    }

    $books = $contenu['catalogue_books'] ?? [];
    if (is_array($books)) {
        foreach ($books as $book) {
            if (!is_array($book)) {
                continue;
            }
            if ((string) ($book['id'] ?? '') !== $bookId) {
                continue;
            }
            $custom = trim((string) ($book['pedagogical_file'] ?? ''));
            if ($custom !== '') {
                return true;
            }
        }
    }

    return sucrier_pedagogical_sheet_fs_path($bookId) !== null;
}

function sucrier_resolve_pedagogical_download_path(string $bookId, array $contenu): ?string
{
    $bookId = trim($bookId);
    if ($bookId === '') {
        return null;
    }

    $books = $contenu['catalogue_books'] ?? [];
    if (is_array($books)) {
        foreach ($books as $book) {
            if (!is_array($book)) {
                continue;
            }
            if ((string) ($book['id'] ?? '') !== $bookId) {
                continue;
            }
            $fileWeb = trim((string) ($book['pedagogical_file'] ?? ''));
            if ($fileWeb !== '') {
                return $fileWeb;
            }
        }
    }

    if (sucrier_pedagogical_sheet_fs_path($bookId) !== null) {
        return sucrier_pedagogical_sheet_web_path($bookId);
    }

    return null;
}
