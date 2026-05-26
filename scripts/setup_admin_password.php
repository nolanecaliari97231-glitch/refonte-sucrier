<?php

declare(strict_types=1);

/**
 * Enregistre le mot de passe back-office de façon sécurisée (bcrypt uniquement).
 *
 * Usage (ne jamais committer le mot de passe en clair) :
 *   php scripts/setup_admin_password.php "VotreMotDePasseFort"
 *
 * Écrit :
 *   - data/admin-password.hash (local, gitignoré)
 *   - SUCRIER_ADMIN_PASSWORD_HASH dans .env (gitignoré)
 *
 * En production (Hostinger, etc.) : copier la même valeur de hash dans la
 * variable d'environnement SUCRIER_ADMIN_PASSWORD_HASH du panneau d'hébergement.
 */

$root = dirname(__DIR__);
$password = $argc >= 2 ? (string) $argv[1] : '';

if ($password === '') {
    fwrite(STDERR, "Usage: php scripts/setup_admin_password.php \"votre-mot-de-passe\"\n");
    exit(1);
}

if (strlen($password) < 12) {
    fwrite(STDERR, "Mot de passe trop court : minimum 12 caractères.\n");
    exit(1);
}

$hash = password_hash($password, PASSWORD_DEFAULT);
if ($hash === false) {
    fwrite(STDERR, "Impossible de générer le hash.\n");
    exit(1);
}

$hashFile = $root . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'admin-password.hash';
if (file_put_contents($hashFile, $hash . PHP_EOL, LOCK_EX) === false) {
    fwrite(STDERR, "Échec d'écriture : {$hashFile}\n");
    exit(1);
}

$envPath = $root . DIRECTORY_SEPARATOR . '.env';
$envUpdated = false;
if (is_file($envPath) && is_readable($envPath) && is_writable($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES);
    if ($lines !== false) {
        $found = false;
        foreach ($lines as $i => $line) {
            if (preg_match('/^\s*SUCRIER_ADMIN_PASSWORD_HASH\s*=/', $line)) {
                $lines[$i] = 'SUCRIER_ADMIN_PASSWORD_HASH=' . $hash;
                $found = true;
                break;
            }
        }
        if (!$found) {
            $insertAt = 0;
            foreach ($lines as $i => $line) {
                if (str_contains($line, 'Backoffice') || str_contains($line, 'backoffice')) {
                    $insertAt = $i + 1;
                    break;
                }
            }
            array_splice($lines, $insertAt, 0, ['SUCRIER_ADMIN_PASSWORD_HASH=' . $hash]);
        }
        $envUpdated = file_put_contents($envPath, implode(PHP_EOL, $lines) . PHP_EOL, LOCK_EX) !== false;
    }
}

echo "Hash bcrypt enregistré dans data/admin-password.hash\n";
if ($envUpdated) {
    echo "Variable SUCRIER_ADMIN_PASSWORD_HASH mise à jour dans .env\n";
} elseif (is_file($envPath)) {
    echo "Ajoutez manuellement dans .env :\nSUCRIER_ADMIN_PASSWORD_HASH={$hash}\n";
} else {
    echo "Créez un fichier .env (copie de .env.example) puis ajoutez :\n";
    echo "SUCRIER_ADMIN_PASSWORD_HASH={$hash}\n";
}

echo "\nProduction : définissez la même valeur sur l'hébergeur (variable d'environnement).\n";
echo "Ne commitez jamais le mot de passe en clair ni le fichier .env.\n";
