<?php
require __DIR__ . '/init.php';

if (!empty($_SESSION['is_admin'])) {
    header('Location: dashboard.php');
    exit;
}

$error = '';
$expectedHash = (string) ($config['admin_password_hash'] ?? '');
if ($expectedHash === '') {
    $error =
        'Mot de passe administrateur non configuré sur ce serveur. '
        . 'Exécutez : php scripts/setup_admin_password.php "votre-mot-de-passe" '
        . '(local) ou définissez SUCRIER_ADMIN_PASSWORD_HASH sur l\'hébergeur (production).';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $expectedHash !== '') {
    if (!sucrier_validate_csrf_from_post()) {
        http_response_code(403);
        $error = 'Session invalide. Merci de recharger la page.';
    } elseif (!sucrier_throttle_login_attempts()) {
        http_response_code(429);
        $error = 'Trop de tentatives. Réessayez dans quelques minutes.';
    } else {
    $password = $_POST['password'] ?? '';

    if (password_verify((string) $password, $expectedHash)) {
        session_regenerate_id(true);
        sucrier_mark_admin_session();
        sucrier_reset_login_attempts();
        header('Location: dashboard.php');
        exit;
    }

    sucrier_record_failed_login_attempt();
    $error = 'Mot de passe invalide.';
    }
}
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= e(sucrier_backoffice_asset('admin.css')) ?>?v=20260525-bo-login">
  <title>Back-office — Connexion</title>
</head>
<body class="admin-login-page">
  <main class="admin-login-shell">
  <div class="card admin-login-card">
    <div class="admin-login-brand">
      <img src="../images/logo-editions-sucrier.webp" alt="" class="admin-login-logo" width="96" height="96" decoding="async" aria-hidden="true">
      <div class="admin-login-brand-text">
        <strong>Les Editions du Sucrier</strong>
        <span>Back-office éditorial</span>
      </div>
    </div>
    <h1>Espace de gestion</h1>
    <p class="admin-login-subtitle">Modifiez le site public sans toucher au code.</p>
    <?php if ($error !== ''): ?>
      <p class="error admin-login-error"><?= e($error) ?></p>
    <?php endif; ?>
    <form method="post" action="" class="admin-login-form">
      <input type="hidden" name="csrf_token" value="<?= e(sucrier_get_csrf_token()) ?>">
      <label for="password">Mot de passe</label>
      <div class="password-field">
        <input id="password" name="password" type="password" required>
        <button type="button" class="password-toggle" aria-label="Afficher le mot de passe" title="Afficher le mot de passe">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M1.5 12s3.9-6.5 10.5-6.5S22.5 12 22.5 12s-3.9 6.5-10.5 6.5S1.5 12 1.5 12Z"></path><circle cx="12" cy="12" r="3.1"></circle></svg>
        </button>
      </div>
      <button type="submit" class="primary admin-login-submit"<?= $expectedHash === '' ? ' disabled' : '' ?>>Se connecter</button>
    </form>
    <p class="hint admin-login-hint"><a href="guide.php">Guide d'utilisation</a> · Mot de passe configuré sur le serveur.</p>
  </div>
  </main>
  <script>
    (function () {
      var input = document.getElementById("password");
      var toggleBtn = document.querySelector(".password-toggle");
      if (!input || !toggleBtn) return;
      toggleBtn.addEventListener("click", function () {
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        toggleBtn.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
        toggleBtn.setAttribute("title", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
      });
    })();
  </script>
</body>
</html>
