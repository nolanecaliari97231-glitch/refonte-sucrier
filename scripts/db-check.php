<?php

declare(strict_types=1);

/**
 * Vérifie la connexion base de données (PostgreSQL attendu en test/prod).
 * Usage : php scripts/db-check.php
 */

$root = dirname(__DIR__);
require $root . '/includes/env.php';
require $root . '/includes/auth_db.php';

try {
    $info = sucrier_auth_database_info();
    $pdo = sucrier_auth_pdo();
    $pdo->query('SELECT 1');
    $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();

    echo "OK — connexion base de données\n";
    echo 'Driver      : ' . $info['driver'] . "\n";
    echo 'DSN (masqué): ' . $info['dsn_masked'] . "\n";
    echo 'Utilisateurs: ' . $count . "\n";

    if ($info['driver'] !== 'pgsql') {
        echo "\nNote : SQLite actif (développement local). En test/prod, définissez SUCRIER_AUTH_DSN en pgsql:…\n";
        exit(0);
    }

    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, "Échec connexion base : " . $e->getMessage() . "\n");
    fwrite(STDERR, "Vérifiez SUCRIER_AUTH_DSN, SUCRIER_AUTH_DB_USER, SUCRIER_AUTH_DB_PASSWORD et l'extension PHP pdo_pgsql.\n");
    exit(1);
}
