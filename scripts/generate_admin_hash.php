<?php
declare(strict_types=1);

if ($argc < 2) {
    fwrite(STDERR, "Usage: php scripts/generate_admin_hash.php \"your-strong-password\"\n");
    fwrite(STDERR, "Pour enregistrer en local + .env : php scripts/setup_admin_password.php \"your-strong-password\"\n");
    exit(1);
}

$password = (string) $argv[1];
if (strlen($password) < 12) {
    fwrite(STDERR, "Password too short. Use at least 12 characters.\n");
    exit(1);
}

echo password_hash($password, PASSWORD_DEFAULT) . PHP_EOL;
