<?php

declare(strict_types=1);

/**
 * Copie les comptes depuis data/auth.sqlite (dev local) vers PostgreSQL.
 * Prérequis : .env configuré avec SUCRIER_AUTH_DSN=pgsql:…
 *
 * Usage : php scripts/db-migrate-sqlite-to-postgresql.php
 */

$root = dirname(__DIR__);
require $root . '/includes/env.php';
require $root . '/includes/auth_db.php';

$targetDsn = sucrier_auth_resolve_dsn_config()['dsn'];
if (!str_starts_with($targetDsn, 'pgsql:')) {
    fwrite(STDERR, "La cible doit être PostgreSQL (SUCRIER_AUTH_DSN=pgsql:… dans .env).\n");
    exit(1);
}

$sqlitePath = $root . '/data/auth.sqlite';
if (!is_file($sqlitePath)) {
    fwrite(STDERR, "Fichier source introuvable : data/auth.sqlite\n");
    exit(1);
}

$sqlite = new PDO('sqlite:' . $sqlitePath, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
$pg = sucrier_auth_pdo();

$rows = $sqlite->query('SELECT * FROM users ORDER BY id ASC')->fetchAll();
if (!is_array($rows) || count($rows) === 0) {
    echo "Aucun compte à migrer.\n";
    exit(0);
}

$inserted = 0;
$skipped = 0;

foreach ($rows as $row) {
    $email = strtolower(trim((string) ($row['email'] ?? '')));
    if ($email === '') {
        continue;
    }
    if (sucrier_auth_find_user_by_email($pg, $email)) {
        $skipped++;
        continue;
    }

    sucrier_auth_create_user($pg, [
        'email' => $email,
        'password_hash' => $row['password_hash'] ?? null,
        'has_google' => !empty($row['has_google']),
        'full_name' => $row['full_name'] ?? null,
        'segment' => ($row['segment'] ?? 'particulier') === 'professionnel' ? 'professionnel' : 'particulier',
        'created_at' => (string) ($row['created_at'] ?? gmdate('c')),
    ]);
    $inserted++;
}

echo "Migration terminée : {$inserted} compte(s) copié(s), {$skipped} déjà présent(s).\n";
