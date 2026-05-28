<?php
declare(strict_types=1);

require __DIR__ . '/init.php';
require SUCRIER_SITE_ROOT . '/includes/cms-profiles.php';

sucrier_require_admin();

$message = null;
$messageType = 'info';
$data = sucrier_load_authors_data();
$authors = $data['authors'] ?? [];
if (!is_array($authors)) {
    $authors = [];
}
$page = $data['page'] ?? [];
$authorsUploadFs = SUCRIER_SITE_ROOT . '/images/uploads/authors';
$authorsUploadWeb = 'images/uploads/authors';
if (!is_dir($authorsUploadFs)) {
    @mkdir($authorsUploadFs, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!sucrier_validate_csrf_from_post()) {
        http_response_code(403);
        exit('Requete invalide (CSRF).');
    }
    $action = (string) ($_POST['action'] ?? 'save');

    $page = [
        'kicker_fr' => trim((string) ($_POST['page_kicker_fr'] ?? '')),
        'kicker_en' => trim((string) ($_POST['page_kicker_en'] ?? '')),
        'title_fr' => trim((string) ($_POST['page_title_fr'] ?? '')),
        'title_en' => trim((string) ($_POST['page_title_en'] ?? '')),
        'lead_fr' => trim((string) ($_POST['page_lead_fr'] ?? '')),
        'lead_en' => trim((string) ($_POST['page_lead_en'] ?? '')),
    ];

    $count = max(0, (int) ($_POST['author_count'] ?? 0));
    $out = [];
    for ($i = 0; $i < $count; $i++) {
        if (isset($_POST['author_' . $i . '_remove'])) {
            continue;
        }
        $slug = trim((string) ($_POST['author_' . $i . '_slug'] ?? ''));
        if ($slug === '') {
            continue;
        }
        $photoPath = trim((string) ($_POST['author_' . $i . '_photo'] ?? ''));
        $uploadedPhoto = sucrier_upload_image_file(
            'author_' . $i . '_photo_file',
            $authorsUploadFs,
            $authorsUploadWeb
        );
        if ($uploadedPhoto !== null) {
            $photoPath = $uploadedPhoto;
        }
        if (isset($_POST['author_' . $i . '_remove_photo'])) {
            $photoPath = '';
        }
        $out[] = [
            'slug' => $slug,
            'photo' => $photoPath,
            'roles' => trim((string) ($_POST['author_' . $i . '_roles'] ?? 'author')),
            'name_fr' => trim((string) ($_POST['author_' . $i . '_name_fr'] ?? '')),
            'name_en' => trim((string) ($_POST['author_' . $i . '_name_en'] ?? '')),
            'role_fr' => trim((string) ($_POST['author_' . $i . '_role_fr'] ?? '')),
            'role_en' => trim((string) ($_POST['author_' . $i . '_role_en'] ?? '')),
            'bio_fr' => trim((string) ($_POST['author_' . $i . '_bio_fr'] ?? '')),
            'bio_en' => trim((string) ($_POST['author_' . $i . '_bio_en'] ?? '')),
            'hidden' => isset($_POST['author_' . $i . '_hidden']),
        ];
    }

    if ($action === 'add_author') {
        $out[] = [
            'slug' => 'auteur-' . (count($out) + 1),
            'photo' => '',
            'roles' => 'author',
            'name_fr' => 'Nouvel auteur',
            'name_en' => 'New author',
            'role_fr' => 'Auteur',
            'role_en' => 'Author',
            'bio_fr' => '',
            'bio_en' => '',
            'hidden' => false,
        ];
    }

    if (sucrier_save_authors_data(['page' => $page, 'authors' => $out])) {
        $message = 'Auteurs enregistrés.';
        $messageType = 'success';
        $data = sucrier_load_authors_data();
        $authors = $data['authors'] ?? [];
        $page = $data['page'] ?? $page;
    } else {
        $message = 'Erreur lors de l\'enregistrement.';
        $messageType = 'error';
    }
}

$authorCount = count($authors);
$csrf = sucrier_get_csrf_token();
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Back-office — Auteurs / Illustrateurs</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= e(sucrier_backoffice_asset('admin.css')) ?>?v=20260526-bo-authors">
</head>
<body>
  <div class="admin-shell">
    <header class="admin-header">
      <h1>Auteurs / Illustrateurs</h1>
      <p>Fiches auteur, grille <code>a-propos-auteurs.html</code> et pages <code>auteur.html</code>.</p>
      <div class="card-actions">
        <a class="link" href="dashboard.php">Tableau de bord</a>
        <a class="link" href="../a-propos-auteurs.html" target="_blank">Voir la page publique</a>
      </div>
    </header>

    <?php if ($message): ?>
      <p class="section-note" style="color:<?= $messageType === 'success' ? '#1b4332' : '#841a13' ?>"><?= e($message) ?></p>
    <?php endif; ?>

    <form method="post" class="admin-form">
      <input type="hidden" name="csrf_token" value="<?= e($csrf) ?>">
      <input type="hidden" name="action" value="save">

      <div class="card">
        <h2>En-tête de la page</h2>
        <div class="row-2">
          <div>
            <label for="page_kicker_fr">Chapô (FR)</label>
            <input id="page_kicker_fr" name="page_kicker_fr" value="<?= e((string) ($page['kicker_fr'] ?? '')) ?>">
          </div>
          <div>
            <label for="page_kicker_en">Chapô (EN)</label>
            <input id="page_kicker_en" name="page_kicker_en" value="<?= e((string) ($page['kicker_en'] ?? '')) ?>">
          </div>
        </div>
        <div class="row-2">
          <div>
            <label for="page_title_fr">Titre (FR)</label>
            <input id="page_title_fr" name="page_title_fr" value="<?= e((string) ($page['title_fr'] ?? '')) ?>">
          </div>
          <div>
            <label for="page_title_en">Titre (EN)</label>
            <input id="page_title_en" name="page_title_en" value="<?= e((string) ($page['title_en'] ?? '')) ?>">
          </div>
        </div>
        <label for="page_lead_fr">Introduction (FR)</label>
        <textarea id="page_lead_fr" name="page_lead_fr" rows="2"><?= e((string) ($page['lead_fr'] ?? '')) ?></textarea>
        <label for="page_lead_en">Introduction (EN)</label>
        <textarea id="page_lead_en" name="page_lead_en" rows="2"><?= e((string) ($page['lead_en'] ?? '')) ?></textarea>
      </div>

      <div class="card">
        <h2>Fiches (<?= (int) $authorCount ?>)</h2>
        <p class="section-note">Rôles : <code>author</code>, <code>illustrator</code> (séparés par un espace). Slug = identifiant URL (<code>auteur.html?slug=…</code>).</p>
        <input type="hidden" name="author_count" value="<?= (int) $authorCount ?>">
        <?php for ($i = 0; $i < $authorCount; $i++): ?>
          <?php $a = is_array($authors[$i] ?? null) ? $authors[$i] : []; ?>
          <details class="book-accordion" <?= $i < 2 ? 'open' : '' ?>>
            <summary><span><?= e((string) ($a['name_fr'] ?? 'Auteur ' . ($i + 1))) ?></span><span class="book-sub"><?= e((string) ($a['slug'] ?? '')) ?></span></summary>
            <div class="book-body">
              <div class="row-2">
                <div>
                  <label for="author_<?= $i ?>_slug">Slug (identifiant)</label>
                  <input id="author_<?= $i ?>_slug" name="author_<?= $i ?>_slug" value="<?= e((string) ($a['slug'] ?? '')) ?>" required>
                </div>
                <div>
                  <label for="author_<?= $i ?>_roles">Rôles</label>
                  <input id="author_<?= $i ?>_roles" name="author_<?= $i ?>_roles" value="<?= e((string) ($a['roles'] ?? 'author')) ?>" placeholder="author illustrator">
                </div>
              </div>
              <label for="author_<?= $i ?>_photo">Photo (chemin)</label>
              <input id="author_<?= $i ?>_photo" name="author_<?= $i ?>_photo" value="<?= e((string) ($a['photo'] ?? '')) ?>">
              <label for="author_<?= $i ?>_photo_file">Ou importer une photo (PNG/JPG/WEBP/GIF)</label>
              <input id="author_<?= $i ?>_photo_file" name="author_<?= $i ?>_photo_file" type="file" accept="image/png,image/jpeg,image/webp,image/gif">
              <label class="checkbox-row">
                <input type="checkbox" name="author_<?= $i ?>_remove_photo" value="1">
                Supprimer la photo actuelle
              </label>
              <div class="row-2">
                <div>
                  <label for="author_<?= $i ?>_name_fr">Nom (FR)</label>
                  <input id="author_<?= $i ?>_name_fr" name="author_<?= $i ?>_name_fr" value="<?= e((string) ($a['name_fr'] ?? '')) ?>">
                </div>
                <div>
                  <label for="author_<?= $i ?>_name_en">Nom (EN)</label>
                  <input id="author_<?= $i ?>_name_en" name="author_<?= $i ?>_name_en" value="<?= e((string) ($a['name_en'] ?? '')) ?>">
                </div>
              </div>
              <div class="row-2">
                <div>
                  <label for="author_<?= $i ?>_role_fr">Fonction courte (FR)</label>
                  <input id="author_<?= $i ?>_role_fr" name="author_<?= $i ?>_role_fr" value="<?= e((string) ($a['role_fr'] ?? '')) ?>">
                </div>
                <div>
                  <label for="author_<?= $i ?>_role_en">Fonction courte (EN)</label>
                  <input id="author_<?= $i ?>_role_en" name="author_<?= $i ?>_role_en" value="<?= e((string) ($a['role_en'] ?? '')) ?>">
                </div>
              </div>
              <label for="author_<?= $i ?>_bio_fr">Biographie (FR)</label>
              <textarea id="author_<?= $i ?>_bio_fr" name="author_<?= $i ?>_bio_fr" rows="4"><?= e((string) ($a['bio_fr'] ?? '')) ?></textarea>
              <label for="author_<?= $i ?>_bio_en">Biographie (EN)</label>
              <textarea id="author_<?= $i ?>_bio_en" name="author_<?= $i ?>_bio_en" rows="4"><?= e((string) ($a['bio_en'] ?? '')) ?></textarea>
              <label class="checkbox-row">
                <input type="checkbox" name="author_<?= $i ?>_hidden" value="1" <?= !empty($a['hidden']) ? 'checked' : '' ?>>
                Masquer de la grille publique (fiche auteur reste accessible par URL)
              </label>
              <label class="checkbox-row">
                <input type="checkbox" name="author_<?= $i ?>_remove" value="1">
                Supprimer cette fiche
              </label>
            </div>
          </details>
        <?php endfor; ?>
      </div>

      <div class="card-actions">
        <button type="submit" class="btn-primary">Enregistrer</button>
        <button type="submit" name="action" value="add_author" class="btn-secondary">Ajouter un auteur</button>
      </div>
    </form>
  </div>
</body>
</html>
