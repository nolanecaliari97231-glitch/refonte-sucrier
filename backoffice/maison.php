<?php
declare(strict_types=1);

require __DIR__ . '/init.php';

sucrier_require_admin();

$message = null;
$messageType = 'info';
$content = $contenu;
$page = $content['about_house_page'] ?? [];
if (!is_array($page)) {
    $page = [];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!sucrier_validate_csrf_from_post()) {
        http_response_code(403);
        exit('Requete invalide (CSRF).');
    }

    $next = $content;
    $next['about_house_page'] = [
        'chapter_kicker' => trim((string) ($_POST['chapter_kicker'] ?? '')),
        'chapter_title' => trim((string) ($_POST['chapter_title'] ?? '')),
        'chapter_lead' => trim((string) ($_POST['chapter_lead'] ?? '')),
        'motto' => trim((string) ($_POST['motto'] ?? '')),
        'story_title' => trim((string) ($_POST['story_title'] ?? '')),
        'story_p1' => trim((string) ($_POST['story_p1'] ?? '')),
        'story_p2' => trim((string) ($_POST['story_p2'] ?? '')),
        'story_p3' => trim((string) ($_POST['story_p3'] ?? '')),
        'pillars_title' => trim((string) ($_POST['pillars_title'] ?? '')),
        'pillars_intro' => trim((string) ($_POST['pillars_intro'] ?? '')),
        'pillar_1_title' => trim((string) ($_POST['pillar_1_title'] ?? '')),
        'pillar_1_text' => trim((string) ($_POST['pillar_1_text'] ?? '')),
        'pillar_2_title' => trim((string) ($_POST['pillar_2_title'] ?? '')),
        'pillar_2_text' => trim((string) ($_POST['pillar_2_text'] ?? '')),
        'pillar_3_title' => trim((string) ($_POST['pillar_3_title'] ?? '')),
        'pillar_3_text' => trim((string) ($_POST['pillar_3_text'] ?? '')),
        'recognition_text' => trim((string) ($_POST['recognition_text'] ?? '')),
    ];

    if (sucrier_save_content_json($next)) {
        $message = 'Chapitre La Maison enregistre.';
        $messageType = 'success';
        $content = $next;
        $page = $next['about_house_page'];
    } else {
        $message = 'Erreur lors de l\'enregistrement.';
        $messageType = 'error';
    }
}
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Back-office — Chapitre 1 · La Maison</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= e(sucrier_backoffice_asset('admin.css')) ?>?v=20260528-bo-maison">
</head>
<body>
  <div class="admin-shell">
    <header class="admin-header">
      <h1>Chapitre 1 · La Maison</h1>
      <p>Modifier facilement les textes de la page <code>a-propos-maison.html</code>.</p>
      <div class="card-actions">
        <a class="link" href="dashboard.php">Tableau de bord</a>
        <a class="link" href="auteurs.php">Chapitre 2 · Auteurs</a>
        <a class="link" href="partenaires.php">Chapitre 3 · Partenaires</a>
        <a class="link" href="../a-propos-maison.html" target="_blank">Voir la page publique</a>
      </div>
    </header>

    <?php if ($message): ?>
      <p class="section-note" style="color:<?= $messageType === 'success' ? '#1b4332' : '#841a13' ?>"><?= e($message) ?></p>
    <?php endif; ?>

    <form method="post" class="admin-form">
      <input type="hidden" name="csrf_token" value="<?= e(sucrier_get_csrf_token()) ?>">

      <div class="card">
        <h2>En-tete du chapitre</h2>
        <label for="chapter_kicker">Kicker</label>
        <input id="chapter_kicker" name="chapter_kicker" value="<?= e((string) ($page['chapter_kicker'] ?? '')) ?>" placeholder="Chapitre 1 · À propos">
        <label for="chapter_title">Titre</label>
        <input id="chapter_title" name="chapter_title" value="<?= e((string) ($page['chapter_title'] ?? '')) ?>" placeholder="La Maison d'édition">
        <label for="chapter_lead">Introduction courte</label>
        <textarea id="chapter_lead" name="chapter_lead" rows="3"><?= e((string) ($page['chapter_lead'] ?? '')) ?></textarea>
      </div>

      <div class="card">
        <h2>Hero & histoire</h2>
        <label for="motto">Devise</label>
        <input id="motto" name="motto" value="<?= e((string) ($page['motto'] ?? '')) ?>" placeholder="Rêver, jouer, raconter la Caraïbe">
        <label for="story_title">Titre bloc histoire</label>
        <input id="story_title" name="story_title" value="<?= e((string) ($page['story_title'] ?? '')) ?>" placeholder="Notre histoire">
        <label for="story_p1">Histoire — paragraphe 1</label>
        <textarea id="story_p1" name="story_p1" rows="3"><?= e((string) ($page['story_p1'] ?? '')) ?></textarea>
        <label for="story_p2">Histoire — paragraphe 2</label>
        <textarea id="story_p2" name="story_p2" rows="3"><?= e((string) ($page['story_p2'] ?? '')) ?></textarea>
        <label for="story_p3">Histoire — paragraphe 3</label>
        <textarea id="story_p3" name="story_p3" rows="3"><?= e((string) ($page['story_p3'] ?? '')) ?></textarea>
      </div>

      <div class="card">
        <h2>Piliers</h2>
        <label for="pillars_title">Titre section</label>
        <input id="pillars_title" name="pillars_title" value="<?= e((string) ($page['pillars_title'] ?? '')) ?>">
        <label for="pillars_intro">Intro section</label>
        <textarea id="pillars_intro" name="pillars_intro" rows="2"><?= e((string) ($page['pillars_intro'] ?? '')) ?></textarea>
        <div class="row-2">
          <div>
            <label for="pillar_1_title">Pilier 1 — titre</label>
            <input id="pillar_1_title" name="pillar_1_title" value="<?= e((string) ($page['pillar_1_title'] ?? '')) ?>">
            <label for="pillar_1_text">Pilier 1 — texte</label>
            <textarea id="pillar_1_text" name="pillar_1_text" rows="3"><?= e((string) ($page['pillar_1_text'] ?? '')) ?></textarea>
          </div>
          <div>
            <label for="pillar_2_title">Pilier 2 — titre</label>
            <input id="pillar_2_title" name="pillar_2_title" value="<?= e((string) ($page['pillar_2_title'] ?? '')) ?>">
            <label for="pillar_2_text">Pilier 2 — texte</label>
            <textarea id="pillar_2_text" name="pillar_2_text" rows="3"><?= e((string) ($page['pillar_2_text'] ?? '')) ?></textarea>
          </div>
        </div>
        <label for="pillar_3_title">Pilier 3 — titre</label>
        <input id="pillar_3_title" name="pillar_3_title" value="<?= e((string) ($page['pillar_3_title'] ?? '')) ?>">
        <label for="pillar_3_text">Pilier 3 — texte</label>
        <textarea id="pillar_3_text" name="pillar_3_text" rows="3"><?= e((string) ($page['pillar_3_text'] ?? '')) ?></textarea>
      </div>

      <div class="card">
        <h2>Reconnaissances</h2>
        <label for="recognition_text">Texte de reconnaissance</label>
        <textarea id="recognition_text" name="recognition_text" rows="4"><?= e((string) ($page['recognition_text'] ?? '')) ?></textarea>
      </div>

      <div class="card-actions">
        <button type="submit" class="btn-primary">Enregistrer</button>
      </div>
    </form>
  </div>
</body>
</html>
