<?php
declare(strict_types=1);

function sucrier_is_local_dev(): bool
{
    if (getenv('SUCRIER_CONTACT_DEV') === '1') {
        return true;
    }

    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === '') {
        return PHP_SAPI === 'cli-server';
    }

    return $host === 'localhost'
        || str_starts_with($host, 'localhost:')
        || str_starts_with($host, '127.0.0.1');
}

function sucrier_save_contact_outbox(string $subject, string $body, array $meta): bool
{
    $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'contact-outbox';
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        return false;
    }

    $filename = sprintf(
        'contact-%s-%s.txt',
        date('Ymd-His'),
        bin2hex(random_bytes(4))
    );
    $path = $dir . DIRECTORY_SEPARATOR . $filename;

    $lines = [
        'Date: ' . date(DATE_ATOM),
        'Subject: ' . $subject,
    ];
    foreach ($meta as $key => $value) {
        $lines[] = $key . ': ' . $value;
    }
    $lines[] = '';
    $lines[] = $body;

    return file_put_contents($path, implode("\n", $lines) . "\n", LOCK_EX) !== false;
}

function sucrier_smtp_send_mail(array $config, array $message): bool
{
    $host = trim((string) ($config['host'] ?? ''));
    $port = (int) ($config['port'] ?? 587);
    $username = (string) ($config['username'] ?? '');
    $password = (string) ($config['password'] ?? '');
    $encryption = strtolower(trim((string) ($config['encryption'] ?? 'tls')));
    $timeout = (int) ($config['timeout'] ?? 10);

    $from = trim((string) ($message['from'] ?? ''));
    $fromName = trim((string) ($message['from_name'] ?? ''));
    $to = trim((string) ($message['to'] ?? ''));
    $replyTo = trim((string) ($message['reply_to'] ?? ''));
    $replyToName = trim((string) ($message['reply_to_name'] ?? ''));
    $subject = (string) ($message['subject'] ?? '');
    $body = (string) ($message['body'] ?? '');

    if ($host === '' || $port <= 0 || $username === '' || $password === '') {
        throw new RuntimeException('Configuration SMTP incomplete.');
    }
    if (!filter_var($from, FILTER_VALIDATE_EMAIL) || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Adresses email SMTP invalides.');
    }

    $transport = ($encryption === 'ssl')
        ? 'ssl://' . $host
        : $host;

    $socket = @stream_socket_client(
        $transport . ':' . $port,
        $errno,
        $errstr,
        $timeout,
        STREAM_CLIENT_CONNECT
    );
    if (!is_resource($socket)) {
        throw new RuntimeException('Connexion SMTP impossible: ' . $errstr . ' (' . $errno . ')');
    }

    stream_set_timeout($socket, $timeout);

    try {
        sucrier_smtp_expect($socket, [220]);
        sucrier_smtp_send($socket, 'EHLO localhost', [250]);

        if ($encryption === 'tls') {
            sucrier_smtp_send($socket, 'STARTTLS', [220]);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('Activation TLS SMTP impossible.');
            }
            sucrier_smtp_send($socket, 'EHLO localhost', [250]);
        }

        sucrier_smtp_send($socket, 'AUTH LOGIN', [334]);
        sucrier_smtp_send($socket, base64_encode($username), [334]);
        sucrier_smtp_send($socket, base64_encode($password), [235]);

        sucrier_smtp_send($socket, 'MAIL FROM:<' . $from . '>', [250]);
        sucrier_smtp_send($socket, 'RCPT TO:<' . $to . '>', [250, 251]);
        sucrier_smtp_send($socket, 'DATA', [354]);

        $headers = [
            'Date: ' . date(DATE_RFC2822),
            'From: ' . sucrier_smtp_format_address($fromName, $from),
            'To: ' . sucrier_smtp_format_address('', $to),
            'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
        ];

        if ($replyTo !== '' && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
            $headers[] = 'Reply-To: ' . sucrier_smtp_format_address($replyToName, $replyTo);
        }

        $payload = implode("\r\n", $headers) . "\r\n\r\n" . sucrier_smtp_escape_data($body) . "\r\n.";
        sucrier_smtp_send($socket, $payload, [250]);
        sucrier_smtp_send($socket, 'QUIT', [221]);
    } finally {
        fclose($socket);
    }

    return true;
}

function sucrier_smtp_send($socket, string $command, array $expectedCodes): void
{
    fwrite($socket, $command . "\r\n");
    sucrier_smtp_expect($socket, $expectedCodes);
}

function sucrier_smtp_expect($socket, array $expectedCodes): void
{
    $response = '';
    $code = 0;

    while (!feof($socket)) {
        $line = fgets($socket, 512);
        if ($line === false) {
            break;
        }
        $response .= $line;

        if (preg_match('/^(\d{3})([ -])/', $line, $matches) !== 1) {
            continue;
        }

        $code = (int) $matches[1];
        $continuation = $matches[2] === '-';
        if (!$continuation) {
            break;
        }
    }

    if ($code === 0 || !in_array($code, $expectedCodes, true)) {
        throw new RuntimeException('Reponse SMTP invalide: ' . trim($response));
    }
}

function sucrier_smtp_format_address(string $name, string $email): string
{
    $safeName = trim(preg_replace('/[\r\n]+/', ' ', $name) ?? '');
    $safeEmail = trim(preg_replace('/[\r\n]+/', '', $email) ?? '');

    if ($safeName === '') {
        return '<' . $safeEmail . '>';
    }

    return '=?UTF-8?B?' . base64_encode($safeName) . '?= <' . $safeEmail . '>';
}

function sucrier_smtp_escape_data(string $body): string
{
    $normalized = str_replace(["\r\n", "\r"], "\n", $body);
    $lines = explode("\n", $normalized);
    foreach ($lines as &$line) {
        if (isset($line[0]) && $line[0] === '.') {
            $line = '.' . $line;
        }
    }
    unset($line);

    return implode("\r\n", $lines);
}
