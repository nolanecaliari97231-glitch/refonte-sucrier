<?php

declare(strict_types=1);

/**
 * Configuration applicative non sensible.
 *
 * SECURITE :
 *  - Le hash du mot de passe admin DOIT venir de la variable d'environnement
 *    SUCRIER_ADMIN_PASSWORD_HASH (générée avec `scripts/generate_admin_hash.php`).
 *  - Plus aucun hash n'est versionné dans ce fichier (anciennement présent en
 *    dur, ce qui exposait un hash bcrypt publiquement sur GitHub).
 *  - En l'absence de variable d'environnement, le hash est lu depuis
 *    `data/admin-password.hash` (non versionné, à créer en local pour le dev).
 *  - Si aucune source ne fournit le hash, la connexion admin est désactivée
 *    plutôt que d'autoriser un fallback faible.
 */

$envHash = getenv('SUCRIER_ADMIN_PASSWORD_HASH');
$adminHash = is_string($envHash) ? trim($envHash) : '';

if ($adminHash === '') {
    $hashFile = __DIR__ . DIRECTORY_SEPARATOR . 'admin-password.hash';
    if (is_file($hashFile) && is_readable($hashFile)) {
        $fileHash = trim((string) @file_get_contents($hashFile));
        if ($fileHash !== '' && preg_match('/^\$2[abxy]\$/', $fileHash)) {
            $adminHash = $fileHash;
        }
    }
}

return [
    'site_name' => 'Les Editions du Sucrier',
    'site_tagline' => "Maison d'edition jeunesse - Martinique",
    'site_year' => date('Y'),
    'admin_password_hash' => $adminHash,
];

