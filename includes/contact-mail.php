<?php
declare(strict_types=1);

/**
 * Charge la configuration SMTP / contact (variables d'environnement, puis data/contact-mail-config.php).
 *
 * @return array{to: string, from: string, site_name: string, smtp: array<string, mixed>}
 */
function sucrier_contact_mail_settings(): array
{
    static $cached = null;
    if (is_array($cached)) {
        return $cached;
    }

    $fileConfig = [];
    $configPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'contact-mail-config.php';
    if (is_file($configPath)) {
        $loaded = require $configPath;
        if (is_array($loaded)) {
            $fileConfig = $loaded;
        }
    }

    $pick = static function (string $envKey, string $fileKey, string $default = '') use ($fileConfig): string {
        $env = getenv($envKey);
        if (is_string($env) && trim($env) !== '') {
            return trim($env);
        }
        if (isset($fileConfig[$fileKey]) && is_string($fileConfig[$fileKey]) && trim($fileConfig[$fileKey]) !== '') {
            return trim($fileConfig[$fileKey]);
        }

        return $default;
    };

    $cached = [
        'to' => sucrier_contact_recipient_email($pick('SUCRIER_CONTACT_TO', 'contact_to', '')),
        'from' => $pick('SUCRIER_CONTACT_FROM', 'contact_from', 'leseditionsdusucrier@gmail.com'),
        'site_name' => $pick('SUCRIER_SITE_NAME', 'site_name', 'Les Editions du Sucrier'),
        'smtp' => [
            'host' => $pick('SUCRIER_SMTP_HOST', 'smtp_host', ''),
            'port' => (int) ($pick('SUCRIER_SMTP_PORT', 'smtp_port', '587') ?: 587),
            'username' => $pick('SUCRIER_SMTP_USERNAME', 'smtp_username', ''),
            'password' => $pick('SUCRIER_SMTP_PASSWORD', 'smtp_password', ''),
            'encryption' => strtolower($pick('SUCRIER_SMTP_ENCRYPTION', 'smtp_encryption', 'tls')),
        ],
    ];

    return $cached;
}

function sucrier_contact_recipient_email(string $override = ''): string
{
    if ($override !== '' && filter_var($override, FILTER_VALIDATE_EMAIL)) {
        return $override;
    }

    $contentPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'contenu.json';
    if (is_file($contentPath)) {
        $raw = file_get_contents($contentPath);
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                $fromContent = trim((string) ($decoded['ecommerce']['support_email'] ?? ''));
                if ($fromContent !== '' && filter_var($fromContent, FILTER_VALIDATE_EMAIL)) {
                    return $fromContent;
                }
            }
        }
    }

    return 'leseditionsdusucrier@gmail.com';
}

function sucrier_contact_smtp_ready(array $smtp): bool
{
    return trim((string) ($smtp['host'] ?? '')) !== ''
        && trim((string) ($smtp['username'] ?? '')) !== ''
        && (string) ($smtp['password'] ?? '') !== '';
}

function sucrier_contact_build_confirmation_body(
    string $siteName,
    string $safeName,
    string $safeContactType,
    string $safeMessage,
    string $recipientEmail
): string {
    return implode("\n", [
        'Bonjour ' . $safeName . ',',
        '',
        'Nous avons bien recu votre message via le formulaire de contact de ' . $siteName . '.',
        'Vous trouverez ci-dessous la copie de votre demande.',
        'Notre equipe vous repondra a l\'adresse ' . $recipientEmail . ' sous 24 a 48 h ouvrees.',
        '',
        '--- Copie de votre message ---',
        'Type de demande : ' . $safeContactType,
        '',
        $safeMessage,
        '',
        '---',
        'Les Editions du Sucrier',
        'Fort-de-France, Martinique',
    ]);
}

/**
 * @return array{ok: bool, delivered: bool, copy_sent: bool, dev: bool, method: string, message: string}
 */
function sucrier_contact_deliver_messages(array $settings, array $payload): array
{
    $siteName = (string) $settings['site_name'];
    $to = (string) $settings['to'];
    $from = (string) $settings['from'];
    $smtp = (array) ($settings['smtp'] ?? []);

    $safeName = (string) $payload['safe_name'];
    $safeEmail = (string) $payload['safe_email'];
    $safeContactType = (string) $payload['safe_contact_type'];
    $safeMessage = (string) $payload['safe_message'];
    $subject = (string) $payload['subject'];
    $body = (string) $payload['body'];

    $copySubject = sprintf('[%s] Copie de votre message — nous vous repondrons bientot', $siteName);
    $copyBody = sucrier_contact_build_confirmation_body(
        $siteName,
        $safeName,
        $safeContactType,
        $safeMessage,
        $safeEmail
    );

    $outboxMeta = [
        'To' => $to,
        'Nom' => $safeName,
        'Email' => $safeEmail,
        'Type' => $safeContactType,
    ];

    if (sucrier_contact_smtp_ready($smtp)) {
        try {
            $mailBase = [
                'from' => $from,
                'from_name' => $siteName,
                'reply_to' => $safeEmail,
                'reply_to_name' => $safeName,
            ];
            sucrier_smtp_send_mail($smtp, array_merge($mailBase, [
                'to' => $to,
                'subject' => $subject,
                'body' => $body,
            ]));
            sucrier_smtp_send_mail($smtp, array_merge($mailBase, [
                'to' => $safeEmail,
                'reply_to' => $to,
                'reply_to_name' => $siteName,
                'subject' => $copySubject,
                'body' => $copyBody,
            ]));

            return [
                'ok' => true,
                'delivered' => true,
                'copy_sent' => true,
                'dev' => false,
                'method' => 'smtp',
                'message' => 'Message envoye. Une copie a ete envoyee a votre adresse email : verifiez votre boite de reception (et les indesirables).',
            ];
        } catch (Throwable $e) {
            error_log('Contact SMTP error: ' . $e->getMessage());
            sucrier_save_contact_outbox($subject, $body, $outboxMeta);

            return [
                'ok' => false,
                'delivered' => false,
                'copy_sent' => false,
                'dev' => false,
                'method' => 'smtp',
                'message' => "L'envoi du message a echoue. Reessayez plus tard ou contactez-nous par telephone.",
            ];
        }
    }

    if (sucrier_is_local_dev()) {
        sucrier_save_contact_outbox($subject, $body, $outboxMeta);
        sucrier_save_contact_outbox($copySubject, $copyBody, array_merge($outboxMeta, [
            'To' => $safeEmail,
            'Copie' => 'confirmation visiteur',
        ]));

        return [
            'ok' => true,
            'delivered' => false,
            'copy_sent' => false,
            'dev' => true,
            'method' => 'outbox',
            'message' => 'Mode developpement : message enregistre localement (SMTP non configure). Sur le serveur de production, configurez SMTP pour un envoi reel.',
        ];
    }

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: ' . $siteName . ' <' . $from . '>',
        'Reply-To: ' . $safeName . ' <' . $safeEmail . '>',
    ];
    $copyHeaders = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: ' . $siteName . ' <' . $from . '>',
        'Reply-To: ' . $siteName . ' <' . $to . '>',
    ];

    $sentMain = @mail($to, $subject, $body, implode("\r\n", $headers));
    $sentCopy = @mail($safeEmail, $copySubject, $copyBody, implode("\r\n", $copyHeaders));

    if ($sentMain && $sentCopy) {
        return [
            'ok' => true,
            'delivered' => true,
            'copy_sent' => true,
            'dev' => false,
            'method' => 'mail',
            'message' => 'Message envoye. Une copie a ete envoyee a votre adresse email : verifiez votre boite de reception (et les indesirables).',
        ];
    }

    sucrier_save_contact_outbox($subject, $body, $outboxMeta);

    return [
        'ok' => false,
        'delivered' => false,
        'copy_sent' => false,
        'dev' => false,
        'method' => 'none',
        'message' => "L'envoi du message a echoue (SMTP non configure sur le serveur). Merci de nous appeler ou de reessayer plus tard.",
    ];
}
