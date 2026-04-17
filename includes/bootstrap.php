<?php

$config = require __DIR__ . '/../data/config.php';

$contenuPath = __DIR__ . '/../data/contenu.json';
$contenuRaw = is_file($contenuPath) ? file_get_contents($contenuPath) : '{}';
$contenu = json_decode($contenuRaw ?: '{}', true);

if (!is_array($contenu)) {
    $contenu = [];
}

function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function contenu_get(array $data, string $path, string $default = ''): string
{
    $current = $data;
    $segments = explode('.', $path);

    foreach ($segments as $segment) {
        if (!is_array($current) || !array_key_exists($segment, $current)) {
            return $default;
        }
        $current = $current[$segment];
    }

    return is_scalar($current) ? (string) $current : $default;
}
