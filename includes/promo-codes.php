<?php

declare(strict_types=1);

/**
 * Codes promo stockés dans data/contenu.json (promo_codes[]).
 * Seuls les codes actifs (enabled + code valide) fonctionnent au panier et au paiement.
 */

/**
 * @return list<array<string, mixed>>
 */
function sucrier_promo_codes_list(array $contenu): array
{
    $list = $contenu['promo_codes'] ?? [];
    if (!is_array($list)) {
        return [];
    }

    return $list;
}

function sucrier_promo_normalize_code(string $code): string
{
    $code = strtoupper(trim($code));
    if ($code === '' || strlen($code) > 32 || !preg_match('/^[A-Z0-9_-]+$/', $code)) {
        return '';
    }

    return $code;
}

/**
 * @param array<string, mixed> $row
 * @return array<string, mixed>|null
 */
function sucrier_promo_normalize_row(array $row): ?array
{
    $code = sucrier_promo_normalize_code((string) ($row['code'] ?? ''));
    if ($code === '') {
        return null;
    }

    $type = strtolower(trim((string) ($row['type'] ?? 'percent')));
    if (!in_array($type, ['percent', 'shipping'], true)) {
        $type = 'percent';
    }

    $value = (int) ($row['value'] ?? 0);
    if ($type === 'shipping') {
        $value = 100;
    } else {
        if ($value < 1) {
            $value = 1;
        }
        if ($value > 100) {
            $value = 100;
        }
    }

    $id = trim((string) ($row['id'] ?? ''));
    if ($id === '' || !preg_match('/^[a-z0-9_-]{2,64}$/i', $id)) {
        try {
            $id = 'promo-' . bin2hex(random_bytes(4));
        } catch (Throwable $e) {
            $id = 'promo-' . uniqid('', false);
        }
    }

    return [
        'id' => $id,
        'code' => $code,
        'type' => $type,
        'value' => $value,
        'label' => mb_substr(trim((string) ($row['label'] ?? '')), 0, 200),
        'label_en' => mb_substr(trim((string) ($row['label_en'] ?? '')), 0, 200),
        'enabled' => !empty($row['enabled']),
        'show_on_home' => !empty($row['show_on_home']),
        'home_message' => mb_substr(trim((string) ($row['home_message'] ?? '')), 0, 400),
    ];
}

/**
 * @return array<string, array<string, mixed>>
 */
function sucrier_promo_enabled_by_code(array $contenu): array
{
    $map = [];
    foreach (sucrier_promo_codes_list($contenu) as $row) {
        if (!is_array($row)) {
            continue;
        }
        $normalized = sucrier_promo_normalize_row($row);
        if ($normalized === null || empty($normalized['enabled'])) {
            continue;
        }
        $map[(string) $normalized['code']] = $normalized;
    }

    return $map;
}

/**
 * Règle checkout (montant SumUp).
 *
 * @return array{type: string, value: int, label: string}|null
 */
function sucrier_promo_checkout_rule(string $code, array $contenu): ?array
{
    $normalized = sucrier_promo_normalize_code($code);
    if ($normalized === '') {
        return null;
    }

    $entry = sucrier_promo_enabled_by_code($contenu)[$normalized] ?? null;
    if ($entry === null) {
        return null;
    }

    return [
        'type' => (string) $entry['type'],
        'value' => (int) $entry['value'],
        'label' => (string) ($entry['label'] ?? ''),
    ];
}

/**
 * Réduction en centimes (arrondi entier).
 */
function sucrier_checkout_promo_discount_cents(int $subtotalCents, int $shippingCents, ?array $rule): int
{
    if ($rule === null || $subtotalCents <= 0) {
        return 0;
    }
    $type = (string) ($rule['type'] ?? '');
    $value = (int) ($rule['value'] ?? 0);
    if ($type === 'percent') {
        return (int) round($subtotalCents * ($value / 100));
    }
    if ($type === 'shipping') {
        return min($shippingCents, $shippingCents);
    }

    return 0;
}

/**
 * Liste publique pour le panier (sans flags internes).
 *
 * @return list<array{code: string, type: string, value: int, label: string, label_en: string}>
 */
function sucrier_public_promo_codes_active(array $contenu): array
{
    $out = [];
    foreach (sucrier_promo_enabled_by_code($contenu) as $entry) {
        $out[] = [
            'code' => (string) $entry['code'],
            'type' => (string) $entry['type'],
            'value' => (int) $entry['value'],
            'label' => (string) ($entry['label'] ?? ''),
            'label_en' => (string) ($entry['label_en'] ?? ''),
        ];
    }

    return $out;
}

/**
 * Bandeau accueil : premier code actif avec show_on_home.
 *
 * @return array<string, string>|null
 */
function sucrier_public_home_promo(array $contenu): ?array
{
    foreach (sucrier_promo_codes_list($contenu) as $row) {
        if (!is_array($row)) {
            continue;
        }
        $normalized = sucrier_promo_normalize_row($row);
        if ($normalized === null || empty($normalized['enabled']) || empty($normalized['show_on_home'])) {
            continue;
        }

        $message = trim((string) ($normalized['home_message'] ?? ''));
        if ($message === '') {
            $message = trim((string) ($normalized['label'] ?? ''));
        }
        if ($message === '') {
            $message = 'Profitez de notre offre avec le code ci-dessous.';
        }

        return [
            'code' => (string) $normalized['code'],
            'message' => $message,
            'message_en' => trim((string) ($normalized['label_en'] ?? '')) ?: $message,
        ];
    }

    return null;
}

/**
 * @return array<string, mixed>
 */
function sucrier_promo_default_new_row(): array
{
    try {
        $id = 'promo-' . bin2hex(random_bytes(4));
    } catch (Throwable $e) {
        $id = 'promo-' . uniqid('', false);
    }

    return [
        'id' => $id,
        'code' => '',
        'type' => 'percent',
        'value' => 10,
        'label' => '',
        'label_en' => '',
        'enabled' => false,
        'show_on_home' => false,
        'home_message' => '',
    ];
}

/**
 * Construit la liste promo_codes depuis le formulaire back-office.
 *
 * @return list<array<string, mixed>>
 */
function sucrier_promo_codes_from_post(array $post, string $action): array
{
    $promoCount = max(0, (int) ($post['promo_count'] ?? 0));
    $promoOut = [];
    $seenCodes = [];
    $homeAssigned = false;

    for ($p = 0; $p < $promoCount; $p++) {
        if (isset($post['promo_' . $p . '_remove'])) {
            continue;
        }

        $row = [
            'id' => trim((string) ($post['promo_' . $p . '_id'] ?? '')),
            'code' => (string) ($post['promo_' . $p . '_code'] ?? ''),
            'type' => (string) ($post['promo_' . $p . '_type'] ?? 'percent'),
            'value' => (int) ($post['promo_' . $p . '_value'] ?? 0),
            'label' => (string) ($post['promo_' . $p . '_label'] ?? ''),
            'label_en' => (string) ($post['promo_' . $p . '_label_en'] ?? ''),
            'enabled' => isset($post['promo_' . $p . '_enabled']),
            'show_on_home' => isset($post['promo_' . $p . '_show_on_home']),
            'home_message' => (string) ($post['promo_' . $p . '_home_message'] ?? ''),
        ];

        $normalized = sucrier_promo_normalize_row($row);
        if ($normalized === null) {
            continue;
        }

        if (isset($seenCodes[$normalized['code']])) {
            continue;
        }
        $seenCodes[$normalized['code']] = true;

        if (!empty($normalized['show_on_home'])) {
            if ($homeAssigned || empty($normalized['enabled'])) {
                $normalized['show_on_home'] = false;
            } else {
                $homeAssigned = true;
            }
        }

        $promoOut[] = $normalized;
    }

    if ($action === 'add_promo_code') {
        $promoOut[] = sucrier_promo_default_new_row();
    }

    return $promoOut;
}
