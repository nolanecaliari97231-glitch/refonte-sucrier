<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/security.php';
require_once __DIR__ . '/../includes/mailer.php';
require_once __DIR__ . '/../includes/contact-mail.php';

sucrier_harden_error_reporting();
sucrier_send_security_headers(true);
sucrier_start_secure_session();
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    sucrier_json_safe_error(405, 'Methode non autorisee.');
}

if (!sucrier_check_request_origin()) {
    sucrier_json_safe_error(403, 'Requete refusee.', 'contact-send: origin mismatch');
}

$contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
if ($contentType !== '' && strpos($contentType, 'application/json') !== 0) {
    sucrier_json_safe_error(415, 'Content-Type invalide.');
}

if (!sucrier_throttle_consume('contact_send', 5, 300)) {
    sucrier_json_safe_error(429, 'Trop de tentatives. Reessayez plus tard.', 'contact-send: throttled');
}

$rawInput = file_get_contents('php://input');
if (!is_string($rawInput) || strlen($rawInput) > 20000) {
    sucrier_json_safe_error(413, 'Payload trop volumineux.');
}
$payload = json_decode($rawInput, true);
if (!is_array($payload)) {
    sucrier_json_safe_error(400, 'Payload invalide.');
}

$name = trim((string) ($payload['name'] ?? ''));
$email = strtolower(trim((string) ($payload['email'] ?? '')));
$contactType = trim((string) ($payload['contactType'] ?? ''));
$message = trim((string) ($payload['message'] ?? ''));

if ($name === '' || $contactType === '' || $message === '') {
    sucrier_json_safe_error(422, 'Veuillez remplir tous les champs requis.');
}

if (mb_strlen($name) > 120 || mb_strlen($contactType) > 80 || mb_strlen($message) > 5000) {
    sucrier_json_safe_error(422, 'Champs trop longs.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 254) {
    sucrier_json_safe_error(422, 'Adresse email invalide.');
}

if (mb_strlen($message) < 10) {
    sucrier_json_safe_error(422, 'Message trop court (10 caracteres minimum).');
}

$allowedContactTypes = ['general', 'commande', 'librairie', 'professionnel', 'presse', 'autre'];
$contactTypeKey = strtolower($contactType);
if (!in_array($contactTypeKey, $allowedContactTypes, true)) {
    // Whitelist : on garde la valeur affichable mais on rejette toute tentative
    // d'injection via un type inattendu plus long ou contenant des caractères
    // de contrôle.
    if (!preg_match('/^[\p{L}\p{N}\s\'\-]{1,80}$/u', $contactType)) {
        sucrier_json_safe_error(422, 'Type de demande invalide.');
    }
}

$settings = sucrier_contact_mail_settings();
$to = (string) $settings['to'];
$from = (string) $settings['from'];
$siteName = (string) $settings['site_name'];

if (!filter_var($to, FILTER_VALIDATE_EMAIL) || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
    sucrier_json_safe_error(500, 'Configuration email serveur invalide.', 'contact-send: from/to invalid');
}

$safeName = preg_replace('/[\r\n]+/', ' ', $name) ?: 'Utilisateur';
$safeEmail = preg_replace('/[\r\n]+/', '', $email) ?: '';
$safeContactType = preg_replace('/[\r\n]+/', ' ', $contactType) ?: 'Autre';
$safeMessage = str_replace(["\r\n", "\r"], "\n", $message);

$subject = sprintf('[%s] Nouveau message contact (%s)', $siteName, $safeContactType);
$body = implode("\n", [
    'Nouveau message depuis le formulaire de contact',
    '',
    'Nom: ' . $safeName,
    'Email: ' . $safeEmail,
    'Type de demande: ' . $safeContactType,
    '',
    'Message:',
    $safeMessage,
]);

$result = sucrier_contact_deliver_messages($settings, [
    'safe_name' => $safeName,
    'safe_email' => $safeEmail,
    'safe_contact_type' => $safeContactType,
    'safe_message' => $safeMessage,
    'subject' => $subject,
    'body' => $body,
]);

if (!$result['ok']) {
    sucrier_json_safe_error(
        500,
        "L'envoi du message a echoue. Reessayez plus tard ou contactez-nous par telephone.",
        'contact-send: delivery failed (' . ($result['method'] ?? 'unknown') . ')'
    );
}

echo json_encode([
    'ok' => true,
    'delivered' => $result['delivered'],
    'copySent' => $result['copy_sent'],
    'dev' => $result['dev'],
    'message' => $result['message'],
]);
