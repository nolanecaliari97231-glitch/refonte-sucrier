<?php
declare(strict_types=1);
require __DIR__ . '/init.php';
sucrier_require_admin();

/**
 * Back-office  Gestion des partenaires
 *
 * Lit / crit le fichier data/partners.json
 * Sections supportes :
 *   - institutional       (Partenaires institutionnels)
 *   - labels              (Labels & distinctions reus)
 *   - associations        (Associations & rseaux partenaires)
 *   - bookshops_<region>  (Librairies par pays : martinique, guadeloupe,
 *                          france, canada, chypre, senegal, ...)
 */

$dataFile = SUCRIER_SITE_ROOT . '/data/partners.json';
$uploadDir = SUCRIER_SITE_ROOT . '/images/partners';

function load_partners(string $file): array {
    if (!is_file($file)) return ['sections' => []];
    $raw = @file_get_contents($file);
    if ($raw === false) return ['sections' => []];
    $j = json_decode($raw, true);
    return is_array($j) ? $j : ['sections' => []];
}

function save_partners(string $file, array $data): bool {
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) return false;
    return @file_put_contents($file, $json) !== false;
}

function slugify(string $s): string {
    $s = strtolower(trim($s));
    $s = preg_replace('/[^a-z0-9]+/u', '-', $s);
    return trim($s, '-');
}

$message = null;
$messageType = 'info';
$data = load_partners($dataFile);
if (!isset($data['sections']) || !is_array($data['sections'])) {
    $data['sections'] = [];
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!sucrier_validate_csrf_from_post()) {
        http_response_code(403);
        exit('Requete invalide (CSRF).');
    }
    $action = (string) ($_POST['action'] ?? '');

    if ($action === 'add_item') {
        $sectionKey = (string) ($_POST['section'] ?? '');
        $name = trim((string) ($_POST['name'] ?? ''));
        $url = trim((string) ($_POST['url'] ?? ''));
        if ($sectionKey === '' || $name === '') {
            $message = 'Nom et section obligatoires.';
            $messageType = 'error';
        } else {
            $logo = '';
            // upload eventuel
            if (!empty($_FILES['logo']['name']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
                $ext = strtolower(pathinfo($_FILES['logo']['name'], PATHINFO_EXTENSION));
                $allowed = ['png','jpg','jpeg','webp','gif','svg'];
                if (!in_array($ext, $allowed, true)) {
                    $message = 'Format de logo non support (' . htmlspecialchars($ext) . ').';
                    $messageType = 'error';
                } else {
                    if (!is_dir($uploadDir)) @mkdir($uploadDir, 0775, true);
                    $slug = slugify($name) ?: ('partner-' . time());
                    $filename = $slug . '.' . $ext;
                    $destFs = $uploadDir . '/' . $filename;
                    if (move_uploaded_file($_FILES['logo']['tmp_name'], $destFs)) {
                        $logo = 'images/partners/' . $filename;
                    } else {
                        $message = 'Echec de l\'upload du logo.';
                        $messageType = 'error';
                    }
                }
            }
            if ($messageType !== 'error') {
                $id = slugify($name);
                if ($id === '') $id = 'partner-' . time();
                if (!isset($data['sections'][$sectionKey])) {
                    $data['sections'][$sectionKey] = ['title_fr' => $sectionKey, 'items' => []];
                }
                if (!isset($data['sections'][$sectionKey]['items']) || !is_array($data['sections'][$sectionKey]['items'])) {
                    $data['sections'][$sectionKey]['items'] = [];
                }
                $data['sections'][$sectionKey]['items'][] = [
                    'id' => $id,
                    'name' => $name,
                    'logo' => $logo,
                    'url' => $url,
                ];
                if (save_partners($dataFile, $data)) {
                    $message = 'Partenaire  "' . htmlspecialchars($name) . '"  ajout.';
                    $messageType = 'success';
                } else {
                    $message = 'Erreur d\'criture du fichier.';
                    $messageType = 'error';
                }
            }
        }
    }

    elseif ($action === 'delete_item') {
        $sectionKey = (string) ($_POST['section'] ?? '');
        $itemId = (string) ($_POST['item_id'] ?? '');
        if (isset($data['sections'][$sectionKey]['items'])) {
            $before = count($data['sections'][$sectionKey]['items']);
            $data['sections'][$sectionKey]['items'] = array_values(array_filter(
                $data['sections'][$sectionKey]['items'],
                static fn($it) => ($it['id'] ?? '') !== $itemId
            ));
            if (count($data['sections'][$sectionKey]['items']) < $before) {
                if (save_partners($dataFile, $data)) {
                    $message = 'Partenaire supprim.';
                    $messageType = 'success';
                }
            }
        }
    }

    elseif ($action === 'update_item') {
        $sectionKey = (string) ($_POST['section'] ?? '');
        $itemId = (string) ($_POST['item_id'] ?? '');
        $newName = trim((string) ($_POST['name'] ?? ''));
        $newUrl = trim((string) ($_POST['url'] ?? ''));
        if (isset($data['sections'][$sectionKey]['items'])) {
            foreach ($data['sections'][$sectionKey]['items'] as &$it) {
                if (($it['id'] ?? '') === $itemId) {
                    if ($newName !== '') $it['name'] = $newName;
                    $it['url'] = $newUrl;
                    // logo upload
                    if (!empty($_FILES['logo']['name']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
                        $ext = strtolower(pathinfo($_FILES['logo']['name'], PATHINFO_EXTENSION));
                        $allowed = ['png','jpg','jpeg','webp','gif','svg'];
                        if (in_array($ext, $allowed, true)) {
                            if (!is_dir($uploadDir)) @mkdir($uploadDir, 0775, true);
                            $slug = slugify($newName ?: $it['name']) ?: $itemId;
                            $filename = $slug . '.' . $ext;
                            $destFs = $uploadDir . '/' . $filename;
                            if (move_uploaded_file($_FILES['logo']['tmp_name'], $destFs)) {
                                $it['logo'] = 'images/partners/' . $filename;
                            }
                        }
                    }
                    break;
                }
            }
            unset($it);
            if (save_partners($dataFile, $data)) {
                $message = 'Partenaire mis  jour.';
                $messageType = 'success';
            }
        }
    }

    elseif ($action === 'add_section') {
        $key = slugify((string) ($_POST['section_key'] ?? ''));
        $titleFr = trim((string) ($_POST['title_fr'] ?? ''));
        $titleEn = trim((string) ($_POST['title_en'] ?? ''));
        $code = strtoupper(trim((string) ($_POST['code'] ?? '')));
        if ($key === '' || $titleFr === '') {
            $message = 'Identifiant et titre franais obligatoires.';
            $messageType = 'error';
        } elseif (isset($data['sections'][$key])) {
            $message = 'Cette section existe dj.';
            $messageType = 'error';
        } else {
            $data['sections'][$key] = [
                'title_fr' => $titleFr,
                'title_en' => $titleEn ?: $titleFr,
                'code' => $code,
                'items' => [],
            ];
            if (save_partners($dataFile, $data)) {
                $message = 'Section  "' . htmlspecialchars($titleFr) . '"  cre.';
                $messageType = 'success';
            }
        }
    }

    elseif ($action === 'delete_section') {
        $key = (string) ($_POST['section_key'] ?? '');
        if (isset($data['sections'][$key])) {
            unset($data['sections'][$key]);
            if (save_partners($dataFile, $data)) {
                $message = 'Section supprime.';
                $messageType = 'success';
            }
        }
    }

    elseif ($action === 'update_section') {
        $sectionKey = (string) ($_POST['section'] ?? '');
        if (isset($data['sections'][$sectionKey]) && is_array($data['sections'][$sectionKey])) {
            $data['sections'][$sectionKey]['title_fr'] = trim((string) ($_POST['title_fr'] ?? ''));
            $data['sections'][$sectionKey]['title_en'] = trim((string) ($_POST['title_en'] ?? ''));
            $data['sections'][$sectionKey]['intro_fr'] = trim((string) ($_POST['intro_fr'] ?? ''));
            $data['sections'][$sectionKey]['intro_en'] = trim((string) ($_POST['intro_en'] ?? ''));
            if (save_partners($dataFile, $data)) {
                $message = 'Textes de section enregistrés.';
                $messageType = 'success';
            }
        }
    }

    // recharge donnes pour rendu jour
    $data = load_partners($dataFile);
}

$csrf = sucrier_get_csrf_token();
$sections = $data['sections'] ?? [];

function section_label(string $key, array $section): string {
    if (!empty($section['title_fr'])) return $section['title_fr'];
    return $key;
}
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Back-office  Partenaires</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= e(sucrier_backoffice_asset('admin.css')) ?>?v=20260525-bo-login">
  <style>
    .partner-section { margin-bottom: 28px; padding: 18px 20px; border: 1px solid #e5e0d4; border-radius: 12px; background: #fffdf8; }
    .partner-section h3 { margin: 0 0 8px; color: #2D6A4F; font-family: 'DM Sans', sans-serif; }
    .partner-section .section-key { font-size: 0.78rem; color: #8a8478; font-weight: 500; }
    .partner-list { list-style: none; padding: 0; margin: 14px 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
    .partner-card { border: 1px solid #e5e0d4; border-radius: 8px; padding: 10px; background: #fff; display: flex; flex-direction: column; gap: 8px; }
    .partner-card-row { display: flex; align-items: center; gap: 10px; }
    .partner-card-logo { width: 56px; height: 48px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #faf6ed; border-radius: 6px; overflow: hidden; }
    .partner-card-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .partner-card-logo .no-logo { font-size: 0.65rem; color: #aaa; text-align: center; padding: 4px; }
    .partner-card-name { flex: 1; font-weight: 600; font-size: 0.88rem; }
    .partner-card-actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .partner-card-actions form { display: inline-flex; }
    .partner-card-actions button, .partner-card-actions .btn-link { font-size: 0.74rem; padding: 5px 10px; border-radius: 6px; border: 1px solid #d4cfc3; background: #fff; cursor: pointer; color: #333; text-decoration: none; }
    .partner-card-actions button.delete { color: #b94a3a; border-color: #e8c7c0; }
    .partner-card-actions button.delete:hover { background: #fae8e5; }
    .add-partner-form { display: grid; grid-template-columns: 2fr 2fr 2fr auto; gap: 8px; align-items: end; margin-top: 10px; padding: 12px; background: #f6f1e6; border-radius: 8px; }
    .add-partner-form label { font-size: 0.74rem; font-weight: 600; color: #555; display: block; margin-bottom: 3px; }
    .add-partner-form input { width: 100%; padding: 8px 10px; border: 1px solid #d4cfc3; border-radius: 6px; font-size: 0.88rem; }
    .add-partner-form button { padding: 9px 16px; background: #2D6A4F; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .add-partner-form button:hover { background: #1e4d3a; }
    .new-section-form { margin-top: 24px; padding: 16px; background: #fff8e7; border: 1px dashed #d4a017; border-radius: 10px; }
    .new-section-form h3 { margin: 0 0 12px; color: #8a6b00; }
    .new-section-form .row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap: 8px; align-items: end; }
    .toast-msg { padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-weight: 500; }
    .toast-msg.success { background: #d8f3dc; color: #1b4332; border: 1px solid #95d5b2; }
    .toast-msg.error { background: #fae8e5; color: #841a13; border: 1px solid #f3b8b0; }
    .toast-msg.info { background: #e9f1ff; color: #1a3d6e; border: 1px solid #b8d2ff; }
    details.edit-fold { margin-top: 6px; }
    details.edit-fold summary { cursor: pointer; font-size: 0.78rem; color: #555; padding: 4px 0; }
    details.edit-fold .edit-fields { display: grid; gap: 8px; margin-top: 8px; }
    .topbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
    .topbar .help { color: #6b6457; font-size: 0.88rem; max-width: 640px; }
  </style>
</head>
<body>
  <div class="admin-shell">
    <header class="admin-header">
      <div class="topbar">
        <div>
          <h1>Partenaires  gestion</h1>
          <p class="help">Ajoutez, modifiez ou supprimez les partenaires de chaque rubrique. Les changements sont sauvegards dans <code>data/partners.json</code>.</p>
        </div>
        <div class="card-actions">
          <a class="link" href="dashboard.php"> Tableau de bord</a>
          <a class="link" href="../a-propos-partenaires.html" target="_blank">Voir la page publique</a>
        </div>
      </div>
    </header>

    <?php if ($message): ?>
      <div class="toast-msg <?= htmlspecialchars($messageType) ?>"><?= htmlspecialchars($message) ?></div>
    <?php endif; ?>

    <?php foreach ($sections as $key => $section): ?>
      <section class="partner-section">
        <h3><?= htmlspecialchars(section_label($key, $section)) ?>
          <span class="section-key">(<?= htmlspecialchars($key) ?>)</span>
        </h3>
        <details class="edit-fold" style="margin:8px 0 12px;">
          <summary>Modifier titres et introductions de section</summary>
          <form method="post" class="edit-fields" style="display:grid;gap:8px;margin-top:8px;">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf) ?>">
            <input type="hidden" name="action" value="update_section">
            <input type="hidden" name="section" value="<?= htmlspecialchars($key) ?>">
            <label style="font-size:0.74rem;color:#555;">Titre FR
              <input type="text" name="title_fr" value="<?= htmlspecialchars((string) ($section['title_fr'] ?? '')) ?>" style="width:100%;padding:6px 8px;border:1px solid #d4cfc3;border-radius:6px;">
            </label>
            <label style="font-size:0.74rem;color:#555;">Titre EN
              <input type="text" name="title_en" value="<?= htmlspecialchars((string) ($section['title_en'] ?? '')) ?>" style="width:100%;padding:6px 8px;border:1px solid #d4cfc3;border-radius:6px;">
            </label>
            <label style="font-size:0.74rem;color:#555;">Introduction FR
              <textarea name="intro_fr" rows="2" style="width:100%;padding:6px 8px;border:1px solid #d4cfc3;border-radius:6px;"><?= htmlspecialchars((string) ($section['intro_fr'] ?? '')) ?></textarea>
            </label>
            <label style="font-size:0.74rem;color:#555;">Introduction EN
              <textarea name="intro_en" rows="2" style="width:100%;padding:6px 8px;border:1px solid #d4cfc3;border-radius:6px;"><?= htmlspecialchars((string) ($section['intro_en'] ?? '')) ?></textarea>
            </label>
            <button type="submit" style="padding:6px 12px;background:#2D6A4F;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.78rem;width:max-content;">Enregistrer les textes</button>
          </form>
        </details>

        <ul class="partner-list">
          <?php foreach (($section['items'] ?? []) as $item): ?>
            <li class="partner-card">
              <div class="partner-card-row">
                <div class="partner-card-logo">
                  <?php if (!empty($item['logo'])): ?>
                    <img src="../<?= htmlspecialchars($item['logo']) ?>" alt="">
                  <?php else: ?>
                    <span class="no-logo">Pas de logo</span>
                  <?php endif; ?>
                </div>
                <div class="partner-card-name"><?= htmlspecialchars($item['name']) ?></div>
              </div>
              <div class="partner-card-actions">
                <form method="post" enctype="multipart/form-data" style="display:none" data-edit-form-id="<?= htmlspecialchars($item['id']) ?>"></form>
                <details class="edit-fold">
                  <summary>Modifier</summary>
                  <form method="post" enctype="multipart/form-data" class="edit-fields">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf) ?>">
                    <input type="hidden" name="action" value="update_item">
                    <input type="hidden" name="section" value="<?= htmlspecialchars($key) ?>">
                    <input type="hidden" name="item_id" value="<?= htmlspecialchars($item['id']) ?>">
                    <label style="font-size:0.74rem;color:#555;">Nom
                      <input type="text" name="name" value="<?= htmlspecialchars($item['name']) ?>" required style="width:100%;padding:6px 8px;border:1px solid #d4cfc3;border-radius:6px;">
                    </label>
                    <label style="font-size:0.74rem;color:#555;">URL (optionnel)
                      <input type="url" name="url" value="<?= htmlspecialchars($item['url'] ?? '') ?>" placeholder="https://..." style="width:100%;padding:6px 8px;border:1px solid #d4cfc3;border-radius:6px;">
                    </label>
                    <label style="font-size:0.74rem;color:#555;">Remplacer le logo (optionnel)
                      <input type="file" name="logo" accept="image/*" style="width:100%;font-size:0.78rem;">
                    </label>
                    <button type="submit" style="padding:6px 12px;background:#2D6A4F;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.78rem;">Enregistrer</button>
                  </form>
                </details>
                <form method="post" onsubmit="return confirm('Supprimer ce partenaire ?');">
                  <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf) ?>">
                  <input type="hidden" name="action" value="delete_item">
                  <input type="hidden" name="section" value="<?= htmlspecialchars($key) ?>">
                  <input type="hidden" name="item_id" value="<?= htmlspecialchars($item['id']) ?>">
                  <button type="submit" class="delete">Supprimer</button>
                </form>
              </div>
            </li>
          <?php endforeach; ?>
        </ul>

        <form method="post" enctype="multipart/form-data" class="add-partner-form">
          <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf) ?>">
          <input type="hidden" name="action" value="add_item">
          <input type="hidden" name="section" value="<?= htmlspecialchars($key) ?>">
          <div>
            <label>Nom du partenaire *</label>
            <input type="text" name="name" required placeholder="Ex. Librairie Untel">
          </div>
          <div>
            <label>URL (optionnel)</label>
            <input type="url" name="url" placeholder="https://...">
          </div>
          <div>
            <label>Logo (optionnel)</label>
            <input type="file" name="logo" accept="image/*">
          </div>
          <button type="submit">+ Ajouter</button>
        </form>

        <?php if ($key !== 'institutional' && $key !== 'labels' && $key !== 'associations'): ?>
        <form method="post" onsubmit="return confirm('Supprimer toute cette section et tous ses partenaires ?');" style="margin-top:10px;">
          <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf) ?>">
          <input type="hidden" name="action" value="delete_section">
          <input type="hidden" name="section_key" value="<?= htmlspecialchars($key) ?>">
          <button type="submit" style="font-size:0.74rem;padding:5px 10px;border:1px solid #e8c7c0;background:#fff;color:#b94a3a;border-radius:6px;cursor:pointer;"> Supprimer cette section</button>
        </form>
        <?php endif; ?>
      </section>
    <?php endforeach; ?>

    <section class="new-section-form">
      <h3>+ Crer une nouvelle section</h3>
      <p style="margin:0 0 10px;color:#6b6457;font-size:0.88rem;">Utile pour ajouter un nouveau pays / type de partenaire (ex. <code>bookshops_haiti</code>).</p>
      <form method="post" class="row">
        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrf) ?>">
        <input type="hidden" name="action" value="add_section">
        <div>
          <label>Identifiant (ex. bookshops_haiti) *</label>
          <input type="text" name="section_key" required placeholder="bookshops_xxx">
        </div>
        <div>
          <label>Titre franais *</label>
          <input type="text" name="title_fr" required placeholder="Hati">
        </div>
        <div>
          <label>Titre anglais</label>
          <input type="text" name="title_en" placeholder="Haiti">
        </div>
        <div>
          <label>Code pays (2 lettres)</label>
          <input type="text" name="code" maxlength="6" placeholder="HT">
        </div>
        <button type="submit">Crer</button>
      </form>
    </section>
  </div>
</body>
</html>
