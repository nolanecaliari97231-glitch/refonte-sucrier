<?php

declare(strict_types=1);

/**
 * Charge le fichier .env à la racine du projet (non versionné).
 * Les variables déjà définies dans l'environnement ne sont pas écrasées.
 */
function sucrier_load_dotenv(): void
{
    static $loaded = false;
    if ($loaded) {
        return;
    }
    $loaded = true;

    $path = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
    if (!is_readable($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        $eq = strpos($line, '=');
        if ($eq === false) {
            continue;
        }
        $key = trim(substr($line, 0, $eq));
        if ($key === '' || getenv($key) !== false) {
            continue;
        }
        $value = trim(substr($line, $eq + 1));
        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"'))
            || (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }
        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
    }
}

sucrier_load_dotenv();
