<?php
require __DIR__ . '/init.php';
sucrier_send_security_headers();
sucrier_start_secure_session();
$_SESSION = [];
session_destroy();

header('Location: login.php');
exit;
