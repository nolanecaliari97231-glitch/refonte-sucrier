<?php
session_start();
require __DIR__ . '/../includes/bootstrap.php';

if (!empty($_SESSION['is_admin'])) {
    header('Location: dashboard.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';
    $expected = (string) ($config['admin_password'] ?? '');

    if ($expected !== '' && hash_equals($expected, $password)) {
        $_SESSION['is_admin'] = true;
        header('Location: dashboard.php');
        exit;
    }

    $error = 'Mot de passe invalide.';
}
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin - Connexion</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 560px; margin: 50px auto; padding: 16px; }
    .card { border: 1px solid #ddd; border-radius: 10px; padding: 20px; }
    label { display: block; margin-bottom: 6px; }
    input { width: 100%; padding: 10px; margin-bottom: 12px; }
    button { padding: 10px 14px; cursor: pointer; }
    .error { color: #b42318; margin-bottom: 8px; }
    .hint { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Connexion admin</h1>
    <?php if ($error !== ''): ?>
      <p class="error"><?= e($error) ?></p>
    <?php endif; ?>
    <form method="post" action="">
      <label for="password">Mot de passe</label>
      <input id="password" name="password" type="password" required>
      <button type="submit">Se connecter</button>
    </form>
    <p class="hint">Astuce: le mot de passe est dans <code>data/config.php</code>.</p>
  </div>
</body>
</html>
