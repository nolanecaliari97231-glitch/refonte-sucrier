<?php
declare(strict_types=1);

/**
 * Taux de change EUR → devises : source officielle BCE (European Central Bank).
 * @see https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
 */

const SUCRIER_ECB_EUROFXREF_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
const SUCRIER_ECB_OFFICIAL_PAGE = 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html';
const SUCRIER_ECB_CACHE_FILE = __DIR__ . '/../data/cache/ecb-eurofxref.json';
const SUCRIER_ECB_REFRESH_SECONDS = 43200; // 12 h
const SUCRIER_ECB_STALE_MAX_SECONDS = 604800; // 7 j (week-ends / indisponibilité temporaire)
const SUCRIER_ECB_SUPPORTED = ['USD', 'CAD'];

/**
 * @return array{status:int, body:string}
 */
function sucrier_ecb_http_get(string $url): array
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTPHEADER => ['Accept: application/xml,text/xml,*/*'],
        ]);
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        if ($body === false || $error !== '') {
            return ['status' => 502, 'body' => ''];
        }
        return ['status' => $status, 'body' => (string) $body];
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "Accept: application/xml,text/xml,*/*\r\n",
            'timeout' => 12,
            'ignore_errors' => true,
        ],
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ],
    ]);
    $body = @file_get_contents($url, false, $context);
    if ($body === false) {
        return ['status' => 502, 'body' => ''];
    }
    $status = 200;
    $headers = function_exists('http_get_last_response_headers') ? http_get_last_response_headers() : [];
    if (isset($headers[0]) && preg_match('/\s(\d{3})\s/', (string) $headers[0], $m)) {
        $status = (int) $m[1];
    }
    return ['status' => $status, 'body' => (string) $body];
}

/**
 * @return array<string, mixed>|null
 */
function sucrier_ecb_read_cache_file(): ?array
{
    if (!is_readable(SUCRIER_ECB_CACHE_FILE)) {
        return null;
    }
    $raw = file_get_contents(SUCRIER_ECB_CACHE_FILE);
    if (!is_string($raw) || $raw === '') {
        return null;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : null;
}

/**
 * @param array<string, mixed> $payload
 */
function sucrier_ecb_write_cache_file(array $payload): void
{
    $dir = dirname(SUCRIER_ECB_CACHE_FILE);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE);
    if (!is_string($json) || $json === '') {
        return;
    }
    @file_put_contents(SUCRIER_ECB_CACHE_FILE, $json, LOCK_EX);
}

/**
 * @return array{rate_date:string, rates:array<string, float>}|null
 */
function sucrier_ecb_parse_daily_xml(string $xmlBody): ?array
{
    if ($xmlBody === '') {
        return null;
    }

    $previous = libxml_use_internal_errors(true);
    $xml = simplexml_load_string($xmlBody);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);

    if ($xml === false) {
        return null;
    }

    $rateDate = '';
    $rates = [];
    $nodes = $xml->xpath('//*[local-name()="Cube"]');
    if (!is_array($nodes)) {
        return null;
    }

    foreach ($nodes as $node) {
        $attributes = $node->attributes();
        if ($attributes === null) {
            continue;
        }
        if (isset($attributes['time'])) {
            $rateDate = trim((string) $attributes['time']);
        }
        if (!isset($attributes['currency'], $attributes['rate'])) {
            continue;
        }
        $currency = strtoupper(trim((string) $attributes['currency']));
        if (!in_array($currency, SUCRIER_ECB_SUPPORTED, true)) {
            continue;
        }
        $rate = (float) $attributes['rate'];
        if ($rate > 0) {
            $rates[$currency] = $rate;
        }
    }

    foreach (SUCRIER_ECB_SUPPORTED as $code) {
        if (!isset($rates[$code]) || $rates[$code] <= 0) {
            return null;
        }
    }

    if ($rateDate === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $rateDate)) {
        return null;
    }

    return [
        'rate_date' => $rateDate,
        'rates' => $rates,
    ];
}

/**
 * @param array<string, mixed> $cache
 * @return array<string, mixed>|null
 */
function sucrier_ecb_payload_from_cache(array $cache, bool $stale): ?array
{
    $fetchedAt = isset($cache['fetched_at']) ? (string) $cache['fetched_at'] : '';
    $fetchedTs = $fetchedAt !== '' ? strtotime($fetchedAt) : false;
    if ($fetchedTs === false) {
        return null;
    }
    if (time() - $fetchedTs > SUCRIER_ECB_STALE_MAX_SECONDS) {
        return null;
    }

    $rates = is_array($cache['rates'] ?? null) ? $cache['rates'] : [];
    $usd = isset($rates['USD']) ? (float) $rates['USD'] : 0.0;
    $cad = isset($rates['CAD']) ? (float) $rates['CAD'] : 0.0;
    if ($usd <= 0 || $cad <= 0) {
        return null;
    }

    return [
        'ok' => true,
        'source' => 'ecb',
        'stale' => $stale,
        'base' => 'EUR',
        'rates' => [
            'USD' => $usd,
            'CAD' => $cad,
        ],
        'rate_date' => isset($cache['rate_date']) ? (string) $cache['rate_date'] : '',
        'fetched_at' => gmdate('c', $fetchedTs),
        'official_url' => SUCRIER_ECB_OFFICIAL_PAGE,
    ];
}

/**
 * Taux BCE du jour (avec cache fichier côté serveur).
 *
 * @return array<string, mixed>
 */
function sucrier_get_official_exchange_rates(): array
{
    $cache = sucrier_ecb_read_cache_file();
    if (is_array($cache)) {
        $fetchedAt = isset($cache['fetched_at']) ? (string) $cache['fetched_at'] : '';
        $fetchedTs = $fetchedAt !== '' ? strtotime($fetchedAt) : false;
        if ($fetchedTs !== false && time() - $fetchedTs < SUCRIER_ECB_REFRESH_SECONDS) {
            $payload = sucrier_ecb_payload_from_cache($cache, false);
            if ($payload !== null) {
                return $payload;
            }
        }
    }

    $response = sucrier_ecb_http_get(SUCRIER_ECB_EUROFXREF_URL);
    if ($response['status'] >= 200 && $response['status'] < 300 && $response['body'] !== '') {
        $parsed = sucrier_ecb_parse_daily_xml($response['body']);
        if ($parsed !== null) {
            $cacheEntry = [
                'source' => 'ecb',
                'base' => 'EUR',
                'rate_date' => $parsed['rate_date'],
                'rates' => $parsed['rates'],
                'fetched_at' => gmdate('c'),
            ];
            sucrier_ecb_write_cache_file($cacheEntry);
            return [
                'ok' => true,
                'source' => 'ecb',
                'stale' => false,
                'base' => 'EUR',
                'rates' => $parsed['rates'],
                'rate_date' => $parsed['rate_date'],
                'fetched_at' => $cacheEntry['fetched_at'],
                'official_url' => SUCRIER_ECB_OFFICIAL_PAGE,
            ];
        }
    }

    if (is_array($cache)) {
        $payload = sucrier_ecb_payload_from_cache($cache, true);
        if ($payload !== null) {
            return $payload;
        }
    }

    return [
        'ok' => false,
        'error' => 'Taux de change officiels indisponibles. Les prix sont affichés en euros.',
        'source' => 'ecb',
        'official_url' => SUCRIER_ECB_OFFICIAL_PAGE,
    ];
}
