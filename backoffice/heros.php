<?php
declare(strict_types=1);

require __DIR__ . '/init.php';
require SUCRIER_SITE_ROOT . '/includes/cms-profiles.php';

sucrier_require_admin();

$message = null;
$messageType = 'info';
$data = sucrier_load_heroes_data();
$heroes = $data['heroes'] ?? [];
if (!is_array($heroes)) {
    $heroes = [];
}
$displayOrder = $data['display_order'] ?? [];
if (!is_array($displayOrder)) {
    $displayOrder = [];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!sucrier_validate_csrf_from_post()) {
        http_response_code(403);
        exit('Requete invalide (CSRF).');
    }
    $action = (string) ($_POST['action'] ?? 'save');
    $orderRaw = trim((string) ($_POST['display_order'] ?? ''));
    $displayOrder = array_values(array_filter(array_map('trim', preg_split('/[\s,]+/', $orderRaw) ?: [])));

    
    $count = max(0, (int) ($_POST['hero_count'] ?? 0));
    $out = [];
    for ($i = 0; $i < $count; $i++) {
        if (isset($_POST['hero_' . $i . '_remove'])) {
            continue;
        }
        $id = trim((string) ($_POST['hero_' . $i . '_id'] ?? ''));
        if ($id === '') {
            continue;
        }
        $out[] = [
            'id' => $id,
            'name_fr' => trim((string) ($_POST['hero_' . $i . '_name_fr'] ?? '')),
            'name_en' => trim((string) ($_POST['hero_' . $i . '_name_en'] ?? '')),
            'tagline_fr' => trim((string) ($_POST['hero_' . $i . '_tagline_fr'] ?? '')),
            'tagline_en' => trim((string) ($_POST['hero_' . $i . '_tagline_en'] ?? '')),
            'portrait' => trim((string) ($_POST['hero_' . $i . '_portrait'] ?? '')),
            'card_class' => trim((string) ($_POST['hero_' . $i . '_card_class'] ?? '')),
            'image_fit' => trim((string) ($_POST['hero_' . $i . '_image_fit'] ?? 'contain')),
            'image_position' => trim((string) ($_POST['hero_' . $i . '_image_position'] ?? 'center center')),
            'related_books' => trim((string) ($_POST['hero_' . $i . '_related_books'] ?? '')),
            'intro_fr' => trim((string) ($_POST['hero_' . $i . '_intro_fr'] ?? '')),
            'intro_en' => trim((string) ($_POST['hero_' . $i . '_intro_en'] ?? '')),
            'traits_fr' => trim((string) ($_POST['hero_' . $i . '_traits_fr'] ?? '')),
            'traits_en' => trim((string) ($_POST['hero_' . $i . '_traits_en'] ?? '')),
            'school_use_fr' => trim((string) ($_POST['hero_' . $i . '_school_use_fr'] ?? '')),
            'school_use_en' => trim((string) ($_POST['hero_' . $i . '_school_use_en'] ?? '')),
        ];
    }

    if ($action === 'add_hero') {
        $out[] = [
            'id' => 'heros-' . (count($out) + 1),
            'name_fr' => 'Nouveau héros',
            'name_en' => 'New hero',
            'tagline_fr' => '',
            'tagline_en' => '',
            'portrait' => '',
            'card_class' => '',
            'image_fit' => 'contain',
            'image_position' => 'center center',
            'related_books' => '',
            'intro_fr' => '',
            'intro_en' => '',
            'traits_fr' => '',
            'traits_en' => '',
            'school_use_fr' => '',
            'school_use_en' => '',
        ];
    }

    if ($displayOrder === []) {
        $displayOrder = array_map(static fn(array $h): string => (string) ($h['id'] ?? ''), $out);
    }

    if (sucrier_save_heroes_data(['display_order' => $displayOrder, 'heroes' => $out])) {
        $message = 'Héros enregistrés.';
        $messageType = 'success';
        $data = sucrier_load_heroes_data();
        $heroes = $data['heroes'] ?? [];
        $displayOrder = $data['display_order'] ?? [];
    } else {
        $message = 'Erreur lors de l\'enregistrement.';
        $messageType = 'error';
    }
}

$heroCount = count($heroes);
$orderLine = implode(', ', $displayOrder);
$csrf = sucrier_get_csrf_token();
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Back-office — Univers Héros</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= e(sucrier_backoffice_asset('admin.css')) ?>?v=20260526-bo-heroes">
</head>
<body>
  <div class="admin-shell">
    <header class="admin-header">
      <h1>Univers Héros</h1>
      <p>Cartes accueil, page <code>heros.html</code> et fiches détaillées.</p>
      <div class="card-actions">
        <a class="link" href="dashboard.php">Tableau de bord</a>
        <a class="link" href="../heros.html" target="_blank">Voir la page publique</a>
      </div>
    </header>

    <?php if ($message): ?>
      <p class="section-note" style="color:<?= $messageType === 'success' ? '#1b4332' : '#841a13' ?>"><?= e($message) ?></p>
    <?php endif; ?>

    <form method="post" class="admin-form">
      <input type="hidden" name="csrf_token" value="<?= e($csrf) ?>">
      <input type="hidden" name="action" value="save">

      <div class="card">
        <h2>Ordre d'affichage</h2>
        <label for="display_order">IDs séparés par des virgules</label>
        <input id="display_order" name="display_order" value="<?= e($orderLine) ?>" placeholder="nikou, bebe-nikou, exocette, …">
      </div>

      <div class="card">
        <h2>Héros (<?= (int) $heroCount ?>)</h2>
        <p class="section-note">Traits : séparer par <code>|</code>. Livres liés : IDs catalogue séparés par des virgules.</p>
        <input type="hidden" name="hero_count" value="<?= (int) $heroCount ?>">
        <?php for ($i = 0; $i < $heroCount; $i++): ?>
          <?php $h = is_array($heroes[$i] ?? null) ? $heroes[$i] : []; ?>
          <details class="book-accordion" <?= $i === 0 ? 'open' : '' ?>>
            <summary><span><?= e((string) ($h['name_fr'] ?? 'Héros ' . ($i + 1))) ?></span><span class="book-sub"><?= e((string) ($h['id'] ?? '')) ?></span></summary>
            <div class="book-body">
              <label for="hero_<?= $i ?>_id">Identifiant (URL ?id=…)</label>
              <input id="hero_<?= $i ?>_id" name="hero_<?= $i ?>_id" value="<?= e((string) ($h['id'] ?? '')) ?>" required>
              <div class="row-2">
                <div>
                  <label for="hero_<?= $i ?>_name_fr">Nom (FR)</label>
                  <input id="hero_<?= $i ?>_name_fr" name="hero_<?= $i ?>_name_fr" value="<?= e((string) ($h['name_fr'] ?? '')) ?>">
                </div>
                <div>
                  <label for="hero_<?= $i ?>_name_en">Nom (EN)</label>
                  <input id="hero_<?= $i ?>_name_en" name="hero_<?= $i ?>_name_en" value="<?= e((string) ($h['name_en'] ?? '')) ?>">
                </div>
              </div>
              <div class="row-2">
                <div>
                  <label for="hero_<?= $i ?>_tagline_fr">Accroche (FR)</label>
                  <input id="hero_<?= $i ?>_tagline_fr" name="hero_<?= $i ?>_tagline_fr" value="<?= e((string) ($h['tagline_fr'] ?? '')) ?>">
                </div>
                <div>
                  <label for="hero_<?= $i ?>_tagline_en">Accroche (EN)</label>
                  <input id="hero_<?= $i ?>_tagline_en" name="hero_<?= $i ?>_tagline_en" value="<?= e((string) ($h['tagline_en'] ?? '')) ?>">
                </div>
              </div>
              <label for="hero_<?= $i ?>_portrait">Portrait (chemin image)</label>
              <input id="hero_<?= $i ?>_portrait" name="hero_<?= $i ?>_portrait" value="<?= e((string) ($h['portrait'] ?? '')) ?>">
              <div class="row-2">
                <div>
                  <label for="hero_<?= $i ?>_card_class">Classe CSS carte</label>
                  <input id="hero_<?= $i ?>_card_class" name="hero_<?= $i ?>_card_class" value="<?= e((string) ($h['card_class'] ?? '')) ?>" placeholder="heros-card--nikou">
                </div>
                <div>
                  <label for="hero_<?= $i ?>_related_books">Livres liés (IDs)</label>
                  <input id="hero_<?= $i ?>_related_books" name="hero_<?= $i ?>_related_books" value="<?= e((string) ($h['related_books'] ?? '')) ?>">
                </div>
              </div>
              <label for="hero_<?= $i ?>_intro_fr">Présentation (FR)</label>
              <textarea id="hero_<?= $i ?>_intro_fr" name="hero_<?= $i ?>_intro_fr" rows="3"><?= e((string) ($h['intro_fr'] ?? '')) ?></textarea>
              <label for="hero_<?= $i ?>_intro_en">Présentation (EN)</label>
              <textarea id="hero_<?= $i ?>_intro_en" name="hero_<?= $i ?>_intro_en" rows="3"><?= e((string) ($h['intro_en'] ?? '')) ?></textarea>
              <label for="hero_<?= $i ?>_traits_fr">Traits (FR, séparés par |)</label>
              <input id="hero_<?= $i ?>_traits_fr" name="hero_<?= $i ?>_traits_fr" value="<?= e((string) ($h['traits_fr'] ?? '')) ?>">
              <label for="hero_<?= $i ?>_traits_en">Traits (EN, séparés par |)</label>
              <input id="hero_<?= $i ?>_traits_en" name="hero_<?= $i ?>_traits_en" value="<?= e((string) ($h['traits_en'] ?? '')) ?>">
              <label for="hero_<?= $i ?>_school_use_fr">Usage scolaire (FR)</label>
              <textarea id="hero_<?= $i ?>_school_use_fr" name="hero_<?= $i ?>_school_use_fr" rows="2"><?= e((string) ($h['school_use_fr'] ?? '')) ?></textarea>
              <label for="hero_<?= $i ?>_school_use_en">Usage scolaire (EN)</label>
              <textarea id="hero_<?= $i ?>_school_use_en" name="hero_<?= $i ?>_school_use_en" rows="2"><?= e((string) ($h['school_use_en'] ?? '')) ?></textarea>
              <label class="checkbox-row">
                <input type="checkbox" name="hero_<?= $i ?>_remove" value="1">
                Supprimer ce héros
              </label>
            </div>
          </details>
        <?php endfor; ?>
      </div>

      <div class="card-actions">
        <button type="submit" class="btn-primary">Enregistrer</button>
        <button type="submit" name="action" value="add_hero" class="btn-secondary">Ajouter un héros</button>
      </div>
    </form>
  </div>
</body>
</html>
