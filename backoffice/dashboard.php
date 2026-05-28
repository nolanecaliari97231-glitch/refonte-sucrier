<?php
require __DIR__ . '/init.php';

/**
 * Tableau de bord principal:
 * - edition generale du contenu (accueil, catalogue, actualites, contact),
 * - acces aux editeurs specialises (maison, auteurs, partenaires, heros).
 */
sucrier_require_admin();

$saved = isset($_GET['saved']);
$action = $_GET['action'] ?? '';
$books = sucrier_build_admin_catalog_rows($contenu);
$bookCount = count($books);
$readingPicks = $contenu['reading_recommendations'] ?? [];
if (!is_array($readingPicks)) {
    $readingPicks = [];
}
$readingFeaturedId = trim((string) ($readingPicks['featured_product_id'] ?? 'nikou-champion'));
$readingSecondaryIds = $readingPicks['secondary_product_ids'] ?? [];
if (!is_array($readingSecondaryIds)) {
    $readingSecondaryIds = [];
}
$readingProductChoices = sucrier_reading_pick_product_choices($contenu);

$filterGroups = $contenu['catalogue_filter_groups'] ?? [
    ['id' => 'albums', 'label_fr' => 'Albums de jeunesse', 'label_en' => "Children's albums", 'parent' => '', 'is_group' => false],
    ['id' => 'cahiers', 'label_fr' => 'Cahiers d\'activités', 'label_en' => 'Activity workbooks', 'parent' => '', 'is_group' => false],
    ['id' => 'bebe-nikou', 'label_fr' => 'Collection Bébé Nikou', 'label_en' => 'Baby Nikou collection', 'parent' => '', 'is_group' => false],
    ['id' => 'autres-produits', 'label_fr' => 'Nos autres produits', 'label_en' => 'Other products', 'parent' => '', 'is_group' => true],
    ['id' => 'posters', 'label_fr' => 'Posters', 'label_en' => 'Posters', 'parent' => 'autres-produits', 'is_group' => false],
    ['id' => 'bons-points', 'label_fr' => 'Bons points', 'label_en' => 'Reward charts', 'parent' => 'autres-produits', 'is_group' => false],
    ['id' => 'sous-mains', 'label_fr' => 'Sous-mains', 'label_en' => 'Desk pads', 'parent' => 'autres-produits', 'is_group' => false],
    ['id' => 'autres', 'label_fr' => 'Autres', 'label_en' => 'Other', 'parent' => 'autres-produits', 'is_group' => false],
];
if (!is_array($filterGroups)) {
    $filterGroups = [];
}
$filterGroupCount = count($filterGroups);
$assignableFilterGroups = array_values(array_filter($filterGroups, static function (array $group): bool {
    return empty($group['is_group']);
}));
$newsItems = $contenu['news_items'] ?? sucrier_default_news_items();
if (!is_array($newsItems)) {
    $newsItems = sucrier_default_news_items();
}
$newsCount = count($newsItems);
$promoItems = sucrier_promo_codes_list($contenu);
$promoCount = count($promoItems);
$catalogStockMap = sucrier_catalog_stock_map($contenu);
$catalogRegistry = [];
foreach ($books as $bookRow) {
    if (!is_array($bookRow)) {
        continue;
    }
    $id = trim((string) ($bookRow['id'] ?? ''));
    if ($id === '' || sucrier_is_admin_catalog_excluded($id, $contenu)) {
        continue;
    }
    $catalogRegistry[] = [
        'id' => $id,
        'title' => trim((string) ($bookRow['title'] ?? $id)),
    ];
}
foreach ($catalogStockMap as $id => $qty) {
    $id = trim((string) $id);
    if ($id === '' || sucrier_is_admin_catalog_excluded($id, $contenu)) {
        continue;
    }
    $already = false;
    foreach ($catalogRegistry as $row) {
        if (($row['id'] ?? '') === $id) {
            $already = true;
            break;
        }
    }
    if (!$already) {
        $catalogRegistry[] = ['id' => $id, 'title' => $id];
    }
}
$siteBase = '../';
$postalRateDefaults = [
    'dom_martinique_near' => [
        ['max_weight_g' => 500, 'amount_eur' => 15.69],
        ['max_weight_g' => 1000, 'amount_eur' => 19.69],
        ['max_weight_g' => 2000, 'amount_eur' => 22.49],
        ['max_weight_g' => 5000, 'amount_eur' => 28.59],
        ['max_weight_g' => 10000, 'amount_eur' => 47.19],
        ['max_weight_g' => 15000, 'amount_eur' => 69.39],
        ['max_weight_g' => 20000, 'amount_eur' => 89.79],
    ],
    'dom_international' => [
        ['max_weight_g' => 500, 'amount_eur' => 34.59],
        ['max_weight_g' => 1000, 'amount_eur' => 38.69],
        ['max_weight_g' => 2000, 'amount_eur' => 53.29],
        ['max_weight_g' => 5000, 'amount_eur' => 77.89],
        ['max_weight_g' => 10000, 'amount_eur' => 147.39],
        ['max_weight_g' => 15000, 'amount_eur' => 209.29],
        ['max_weight_g' => 20000, 'amount_eur' => 254.99],
        ['max_weight_g' => 30000, 'amount_eur' => 254.99],
    ],
];
$postalRates = contenu_get($contenu, 'ecommerce.postal_rates', []);
if (!is_array($postalRates)) {
    $postalRates = [];
}
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= e(sucrier_backoffice_asset('admin.css')) ?>?v=20260525-bo-login">
  <title>Back-office — Édition du site</title>
</head>
<body>
  <div class="admin-shell">
  <header class="admin-header">
    <h1>Back-office — Les Éditions du Sucrier</h1>
    <p>Gérez textes, images, catalogue, actualités et fiches pédagogiques. Les changements apparaissent sur le site public après enregistrement.</p>
    <div class="card-actions">
      <a class="link" href="guide.php">Guide d'utilisation</a>
      <a class="link" href="maison.php">Chapitre 1 · La Maison</a>
      <a class="link" href="auteurs.php">Auteurs / Illustrateurs</a>
      <a class="link" href="heros.php">Univers Héros</a>
      <a class="link" href="partenaires.php">Gérer les partenaires</a>
    </div>
  </header>
  <?php if ($saved): ?>
    <div class="success">
      <?php if ($action === 'reset_catalogue'): ?>
        Catalogue reinitialise aux valeurs par defaut.
      <?php elseif ($action === 'add_book'): ?>
        Nouveau produit ajoute.
      <?php elseif ($action === 'add_news'): ?>
        Nouvelle actualite ajoutee.
      <?php elseif ($action === 'add_filter_group'): ?>
        Nouveau rayon catalogue ajoute.
      <?php elseif ($action === 'add_promo_code'): ?>
        Nouveau code promo ajoute (cochez « Actif » et enregistrez pour l'activer).
      <?php elseif ($action === 'restore_backup'): ?>
        Retour arriere effectue: sauvegarde precedente restauree.
      <?php else: ?>
        Modifications enregistrees avec succes.
      <?php endif; ?>
    </div>
  <?php endif; ?>

  <form method="post" action="save.php" enctype="multipart/form-data" class="admin-grid">
    <input type="hidden" name="csrf_token" value="<?= e(sucrier_get_csrf_token()) ?>">
    <div class="card">
      <h2>Page Accueil</h2>
      <div class="row-2">
        <div>
          <label for="home_hero_tag">Tag hero</label>
          <input id="home_hero_tag" name="home_hero_tag" value="<?= e(contenu_get($contenu, 'home_page.hero_tag')) ?>">
        </div>
        <div>
          <label for="home_hero_title">Titre hero</label>
          <input id="home_hero_title" name="home_hero_title" value="<?= e(contenu_get($contenu, 'home_page.hero_title')) ?>">
        </div>
      </div>
      <label for="home_hero_intro">Texte hero</label>
      <textarea id="home_hero_intro" name="home_hero_intro"><?= e(contenu_get($contenu, 'home_page.hero_intro')) ?></textarea>
      <label for="home_hero_motto">Devise / phrase d'accroche</label>
      <input id="home_hero_motto" name="home_hero_motto" value="<?= e(contenu_get($contenu, 'home_page.hero_motto')) ?>">
      <div class="row-2">
        <div>
          <label for="home_hero_image">Image personnage hero (chemin)</label>
          <input id="home_hero_image" name="home_hero_image" value="<?= e(contenu_get($contenu, 'home_page.hero_image', 'images/catalog/nikou-gambadeur.webp')) ?>">
          <label for="home_hero_image_file">Ou téléverser</label>
          <input id="home_hero_image_file" name="home_hero_image_file" type="file" accept="image/*">
        </div>
        <div>
          <label for="home_hero_book_cover">Couverture livre hero (chemin)</label>
          <input id="home_hero_book_cover" name="home_hero_book_cover" value="<?= e(contenu_get($contenu, 'home_page.hero_book_cover', 'images/catalog/nikou-champion-cover.webp')) ?>">
          <label for="home_hero_book_cover_file">Ou téléverser</label>
          <input id="home_hero_book_cover_file" name="home_hero_book_cover_file" type="file" accept="image/*">
        </div>
      </div>
      <label for="home_hero_background_image">Image de fond hero (optionnel, chemin)</label>
      <input id="home_hero_background_image" name="home_hero_background_image" value="<?= e(contenu_get($contenu, 'home_page.hero_background_image')) ?>">
      <label for="home_hero_background_file">Ou téléverser fond</label>
      <input id="home_hero_background_file" name="home_hero_background_file" type="file" accept="image/*">
      <div class="row-2">
        <div>
          <label for="home_cta_primary_text">Texte bouton principal</label>
          <input id="home_cta_primary_text" name="home_cta_primary_text" value="<?= e(contenu_get($contenu, 'home_page.cta_primary_text')) ?>">
        </div>
        <div>
          <label for="home_cta_primary_link">Lien bouton principal</label>
          <input id="home_cta_primary_link" name="home_cta_primary_link" value="<?= e(contenu_get($contenu, 'home_page.cta_primary_link')) ?>">
        </div>
      </div>
      <div class="row-2">
        <div>
          <label for="home_cta_secondary_text">Texte bouton secondaire</label>
          <input id="home_cta_secondary_text" name="home_cta_secondary_text" value="<?= e(contenu_get($contenu, 'home_page.cta_secondary_text')) ?>">
        </div>
        <div>
          <label for="home_cta_secondary_link">Lien bouton secondaire</label>
          <input id="home_cta_secondary_link" name="home_cta_secondary_link" value="<?= e(contenu_get($contenu, 'home_page.cta_secondary_link')) ?>">
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Codes promo</h2>
      <p class="admin-hint">
        Aucun code ne fonctionne tant qu'il n'est pas renseigné, coché <strong>Actif</strong> et enregistré.
        Le montant au paiement SumUp est toujours recalculé côté serveur.
      </p>
      <input type="hidden" name="promo_count" value="<?= $promoCount ?>">
      <?php if ($promoCount === 0): ?>
        <p class="section-note">Aucun code promo pour le moment.</p>
      <?php endif; ?>
      <?php for ($p = 0; $p < $promoCount; $p++): ?>
        <?php
          $promo = $promoItems[$p] ?? [];
          if (!is_array($promo)) {
              $promo = [];
          }
          $promoId = (string) ($promo['id'] ?? ('promo-' . ($p + 1)));
          $promoCode = (string) ($promo['code'] ?? '');
          $promoType = (string) ($promo['type'] ?? 'percent');
          $promoValue = (int) ($promo['value'] ?? 10);
          $promoEnabled = !empty($promo['enabled']);
          $promoShowHome = !empty($promo['show_on_home']);
        ?>
        <details class="book-accordion" <?= $p === 0 ? 'open' : '' ?>>
          <summary>
            Code promo <?= $p + 1 ?>
            — <?= $promoCode !== '' ? e($promoCode) : 'brouillon' ?>
            <?= $promoEnabled ? ' (actif)' : ' (inactif)' ?>
          </summary>
          <div class="book-body">
            <input type="hidden" name="promo_<?= $p ?>_id" value="<?= e($promoId) ?>">
            <div class="row-2">
              <div>
                <label for="promo_<?= $p ?>_code">Code (majuscules, lettres/chiffres)</label>
                <input id="promo_<?= $p ?>_code" name="promo_<?= $p ?>_code" value="<?= e($promoCode) ?>" placeholder="Ex: ETE2026" maxlength="32" autocapitalize="characters" autocomplete="off">
              </div>
              <div>
                <label for="promo_<?= $p ?>_type">Type de remise</label>
                <select id="promo_<?= $p ?>_type" name="promo_<?= $p ?>_type">
                  <option value="percent"<?= $promoType === 'percent' ? ' selected' : '' ?>>Pourcentage sur le panier</option>
                  <option value="shipping"<?= $promoType === 'shipping' ? ' selected' : '' ?>>Livraison offerte</option>
                </select>
              </div>
            </div>
            <div class="row-2">
              <div>
                <label for="promo_<?= $p ?>_value">Valeur (% si pourcentage)</label>
                <input id="promo_<?= $p ?>_value" name="promo_<?= $p ?>_value" type="number" min="1" max="100" value="<?= $promoType === 'shipping' ? 100 : max(1, min(100, $promoValue)) ?>">
              </div>
              <div>
                <label class="admin-checkbox">
                  <input type="checkbox" name="promo_<?= $p ?>_enabled" value="1"<?= $promoEnabled ? ' checked' : '' ?>>
                  Actif (les clients peuvent l'utiliser)
                </label>
                <label class="admin-checkbox">
                  <input type="checkbox" name="promo_<?= $p ?>_show_on_home" value="1"<?= $promoShowHome ? ' checked' : '' ?>>
                  Afficher sur la page d'accueil
                </label>
              </div>
            </div>
            <label for="promo_<?= $p ?>_label">Message panier (après application)</label>
            <input id="promo_<?= $p ?>_label" name="promo_<?= $p ?>_label" value="<?= e((string) ($promo['label'] ?? '')) ?>" placeholder="Ex: 10% de remise sur votre commande">
            <label for="promo_<?= $p ?>_label_en">Message panier (anglais, optionnel)</label>
            <input id="promo_<?= $p ?>_label_en" name="promo_<?= $p ?>_label_en" value="<?= e((string) ($promo['label_en'] ?? '')) ?>">
            <label for="promo_<?= $p ?>_home_message">Texte bandeau accueil (si affiché sur l'accueil)</label>
            <textarea id="promo_<?= $p ?>_home_message" name="promo_<?= $p ?>_home_message" rows="2" placeholder="Ex: -10% sur tout le catalogue avec le code"><?= e((string) ($promo['home_message'] ?? '')) ?></textarea>
            <button type="submit" name="promo_<?= $p ?>_remove" value="1" class="danger" onclick="return confirm('Supprimer ce code promo ?');">Supprimer ce code</button>
          </div>
        </details>
      <?php endfor; ?>
    </div>

    <div class="card">
      <h2>Conseils de lecture (accueil)</h2>
      <p class="admin-hint">Choisissez les livres du catalogue à afficher sur la page d'accueil. Le texte et la couverture sont repris automatiquement de la fiche produit.</p>
      <label for="reading_featured_product_id">Coup de cœur principal</label>
      <select id="reading_featured_product_id" name="reading_featured_product_id">
        <option value="">— Aucun —</option>
        <?php foreach ($readingProductChoices as $choice): ?>
          <option value="<?= e($choice['id']) ?>"<?= $readingFeaturedId === $choice['id'] ? ' selected' : '' ?>>
            <?= e($choice['title']) ?>
          </option>
        <?php endforeach; ?>
      </select>
      <?php for ($r = 0; $r < 4; $r++): ?>
        <?php $secondaryId = trim((string) ($readingSecondaryIds[$r] ?? '')); ?>
        <label for="reading_secondary_product_id_<?= $r ?>">Livre secondaire <?= $r + 1 ?></label>
        <select id="reading_secondary_product_id_<?= $r ?>" name="reading_secondary_product_id[]">
          <option value="">— Aucun —</option>
          <?php foreach ($readingProductChoices as $choice): ?>
            <option value="<?= e($choice['id']) ?>"<?= $secondaryId === $choice['id'] ? ' selected' : '' ?>>
              <?= e($choice['title']) ?>
            </option>
          <?php endforeach; ?>
        </select>
      <?php endfor; ?>
    </div>

    <div class="card">
      <h2>Page A propos</h2>
      <p class="section-note">
        Chapitres À propos :
        <a href="maison.php">Chapitre 1 · La Maison</a> ·
        <a href="auteurs.php">Chapitre 2 · Auteurs / Illustrateurs</a> ·
        <a href="partenaires.php">Chapitre 3 · Partenaires</a>
      </p>
      <div class="row-2">
        <div>
          <label for="about_title">Titre de la page</label>
          <input id="about_title" name="about_title" value="<?= e(contenu_get($contenu, 'about_page.title')) ?>">
        </div>
        <div>
          <label for="about_intro">Sous-titre</label>
          <input id="about_intro" name="about_intro" value="<?= e(contenu_get($contenu, 'about_page.intro')) ?>">
        </div>
      </div>
      <label for="about_p1">Paragraphe 1</label>
      <textarea id="about_p1" name="about_p1"><?= e(contenu_get($contenu, 'about_page.paragraphe_1')) ?></textarea>
      <label for="about_p2">Paragraphe 2</label>
      <textarea id="about_p2" name="about_p2"><?= e(contenu_get($contenu, 'about_page.paragraphe_2')) ?></textarea>
      <label for="about_p3">Paragraphe 3 / devise</label>
      <textarea id="about_p3" name="about_p3"><?= e(contenu_get($contenu, 'about_page.paragraphe_3')) ?></textarea>
      <label for="about_p4">Paragraphe 4</label>
      <textarea id="about_p4" name="about_p4"><?= e(contenu_get($contenu, 'about_page.paragraphe_4')) ?></textarea>
      <label for="about_p5">Paragraphe 5</label>
      <textarea id="about_p5" name="about_p5"><?= e(contenu_get($contenu, 'about_page.paragraphe_5')) ?></textarea>
    </div>

    <div class="card">
      <h2>Page Actualités</h2>
      <p class="section-note">Cartes affichées sur actualites.html</p>
      <label for="news_title">Titre de la page</label>
      <input id="news_title" name="news_title" value="<?= e(contenu_get($contenu, 'news_page.title', 'Actualités')) ?>">
      <label for="news_intro">Introduction</label>
      <textarea id="news_intro" name="news_intro"><?= e(contenu_get($contenu, 'news_page.intro')) ?></textarea>
      <input type="hidden" name="news_count" value="<?= $newsCount ?>">
      <?php for ($n = 0; $n < $newsCount; $n++): ?>
        <?php $news = $newsItems[$n] ?? []; ?>
        <details class="book-accordion" <?= $n === 0 ? 'open' : '' ?>>
          <summary>Actualité <?= $n + 1 ?> — <?= e((string) ($news['title'] ?? '')) ?></summary>
          <div class="book-body">
            <label for="news_<?= $n ?>_title">Titre</label>
            <input id="news_<?= $n ?>_title" name="news_<?= $n ?>_title" value="<?= e((string) ($news['title'] ?? '')) ?>">
            <div class="row-2">
              <div>
                <label for="news_<?= $n ?>_date">Date / lieu</label>
                <input id="news_<?= $n ?>_date" name="news_<?= $n ?>_date" value="<?= e((string) ($news['date'] ?? '')) ?>">
              </div>
              
              <div>
                <label for="news_<?= $n ?>_tag_label">Libellé du tag</label>
                <input id="news_<?= $n ?>_tag_label" name="news_<?= $n ?>_tag_label" value="<?= e((string) ($news['tag_label'] ?? '')) ?>">
              </div>
            </div>
            <label for="news_<?= $n ?>_tag">Type (nouveau, evenement…)</label>
            <input id="news_<?= $n ?>_tag" name="news_<?= $n ?>_tag" value="<?= e((string) ($news['tag'] ?? 'nouveau')) ?>">
            <label for="news_<?= $n ?>_image">Image (chemin)</label>
            <input id="news_<?= $n ?>_image" name="news_<?= $n ?>_image" value="<?= e((string) ($news['image'] ?? '')) ?>">
            <label for="news_<?= $n ?>_image_file">Ou téléverser image</label>
            <input id="news_<?= $n ?>_image_file" name="news_<?= $n ?>_image_file" type="file" accept="image/*">
            <label for="news_<?= $n ?>_link">Lien optionnel</label>
            <input id="news_<?= $n ?>_link" name="news_<?= $n ?>_link" value="<?= e((string) ($news['link'] ?? '')) ?>">
            <input type="hidden" name="news_<?= $n ?>_id" value="<?= e((string) ($news['id'] ?? '')) ?>">
            <label class="checkbox-row"><input type="checkbox" name="news_<?= $n ?>_remove" value="1"> Supprimer cette actualité</label>
          </div>
        </details>
      <?php endfor; ?>
    </div>

    <div class="card">
      <h2>Page Catalogue</h2>
      <p class="section-note">Concue pour beaucoup de livres : chaque livre est dans un menu deroulant.</p>
      <label for="catalogue_title">Titre de la page</label>
      <input id="catalogue_title" name="catalogue_title" value="<?= e(contenu_get($contenu, 'catalogue_page.title')) ?>">
      <label for="catalogue_intro">Introduction</label>
      <textarea id="catalogue_intro" name="catalogue_intro"><?= e(contenu_get($contenu, 'catalogue_page.intro')) ?></textarea>
    </div>

    <div class="card">
      <h2>Rayons du catalogue (filtres)</h2>
      <p class="section-note">Cases a cocher sur la page catalogue. Pour un nouveau jeu, ajoutez un rayon puis choisissez-le sur la fiche produit.</p>
      <input type="hidden" name="filter_group_count" value="<?= $filterGroupCount ?>">
      <?php for ($f = 0; $f < $filterGroupCount; $f++): ?>
        <?php
          $fg = is_array($filterGroups[$f] ?? null) ? $filterGroups[$f] : [];
          $fgId = (string) ($fg['id'] ?? ('rayon-' . ($f + 1)));
        ?>
        <details class="book-accordion" <?= $f < 3 ? 'open' : '' ?>>
          <summary><span><?= e($fgId) ?></span><span class="book-sub"><?= e((string) ($fg['label_fr'] ?? '')) ?></span></summary>
          <div class="book-body">
            <div class="row-2">
              <div>
                <label for="filter_<?= $f ?>_id">Identifiant technique</label>
                <input id="filter_<?= $f ?>_id" name="filter_<?= $f ?>_id" value="<?= e($fgId) ?>">
              </div>
              <div>
                <label for="filter_<?= $f ?>_parent">Parent (vide = niveau principal)</label>
                <input id="filter_<?= $f ?>_parent" name="filter_<?= $f ?>_parent" value="<?= e((string) ($fg['parent'] ?? '')) ?>" placeholder="ex: autres-produits">
              </div>
            </div>
            <div class="row-2">
              <div>
                <label for="filter_<?= $f ?>_label_fr">Libelle FR</label>
                <input id="filter_<?= $f ?>_label_fr" name="filter_<?= $f ?>_label_fr" value="<?= e((string) ($fg['label_fr'] ?? '')) ?>">
              </div>
              <div>
                <label for="filter_<?= $f ?>_label_en">Libelle EN</label>
                <input id="filter_<?= $f ?>_label_en" name="filter_<?= $f ?>_label_en" value="<?= e((string) ($fg['label_en'] ?? '')) ?>">
              </div>
            </div>
            <label class="checkbox-row" for="filter_<?= $f ?>_is_group">
              <input id="filter_<?= $f ?>_is_group" name="filter_<?= $f ?>_is_group" type="checkbox" value="1" <?= !empty($fg['is_group']) ? 'checked' : '' ?>>
              Regroupement seulement (sans produits directs)
            </label>
            <label class="checkbox-row" for="filter_<?= $f ?>_remove">
              <input id="filter_<?= $f ?>_remove" name="filter_<?= $f ?>_remove" type="checkbox" value="1">
              Supprimer ce rayon
            </label>
          </div>
        </details>
      <?php endfor; ?>
      <button type="submit" name="action" value="add_filter_group" class="secondary">Ajouter un rayon</button>
    </div>

    <div class="card">
      <h2>Stocks du catalogue</h2>
      <p class="hint">Indiquez la quantité disponible par produit. Laissez vide pour « stock non suivi » (disponible). Mettez <strong>0</strong> pour afficher une rupture de stock sur la fiche produit et bloquer l’ajout au panier.</p>
      <div class="stock-table-wrap">
        <table class="stock-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Identifiant</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($catalogRegistry as $product): ?>
              <?php
                $pid = (string) ($product['id'] ?? '');
                $stockValue = array_key_exists($pid, $catalogStockMap) ? (string) $catalogStockMap[$pid] : '';
              ?>
              <tr>
                <td><?= e((string) ($product['title'] ?? $pid)) ?></td>
                <td><code><?= e($pid) ?></code></td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    name="stock_qty[<?= e($pid) ?>]"
                    value="<?= e($stockValue) ?>"
                    placeholder="—"
                    class="stock-qty-input"
                    aria-label="Stock pour <?= e((string) ($product['title'] ?? $pid)) ?>"
                  >
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h2>Produits du catalogue (<?= $bookCount ?>)</h2>
      <p class="section-note">Tous les articles du site (livres, peluches, stickers, posters…). Cochez les pastilles catalogue, masquez les champs inutiles sur la fiche produit et renommez les libellés si besoin (ex. peluche : « Présentation » au lieu de « Nombre de pages »).</p>
      <input type="hidden" name="book_count" value="<?= $bookCount ?>">
      <div class="books-wrap">
      <?php for ($i = 0; $i < $bookCount; $i++): ?>
        <?php
          $bookTitle = (string) (($books[$i]['title'] ?? 'Produit ' . ($i + 1)));
          $bookCollection = (string) (($books[$i]['collection'] ?? ''));
        ?>
        <details class="book-accordion" <?= $i === 0 ? 'open' : '' ?>>
          <summary>
            <span>Produit <?= $i + 1 ?> — <?= e($bookTitle) ?></span>
            <span class="book-sub"><?= e($bookCollection) ?></span>
          </summary>
          <div class="book-body">
            <label for="book_<?= $i ?>_catalog_category">Rayon catalogue (filtre du site)</label>
            <select id="book_<?= $i ?>_catalog_category" name="book_<?= $i ?>_catalog_category">
              <option value="">— Automatique selon le titre —</option>
              <?php foreach ($assignableFilterGroups as $assignable): ?>
                <?php
                  $assignId = (string) ($assignable['id'] ?? '');
                  $assignLabel = (string) ($assignable['label_fr'] ?? $assignId);
                  $selectedCategory = (string) (($books[$i]['catalog_category'] ?? ''));
                ?>
                <option value="<?= e($assignId) ?>" <?= $selectedCategory === $assignId ? 'selected' : '' ?>><?= e($assignLabel) ?></option>
              <?php endforeach; ?>
            </select>
            <div class="row-2">
              <div>
                <label for="book_<?= $i ?>_collection">Collection</label>
                <input id="book_<?= $i ?>_collection" name="book_<?= $i ?>_collection" value="<?= e((string) (($books[$i]['collection'] ?? ''))) ?>">
              </div>
              <div>
                <label for="book_<?= $i ?>_title">Titre</label>
                <input id="book_<?= $i ?>_title" name="book_<?= $i ?>_title" value="<?= e((string) (($books[$i]['title'] ?? ''))) ?>">
              </div>
            </div>
            <div class="row-2">
              <div>
                <label for="book_<?= $i ?>_authors">Auteurs</label>
                <input id="book_<?= $i ?>_authors" name="book_<?= $i ?>_authors" value="<?= e((string) (($books[$i]['authors'] ?? ''))) ?>">
              </div>
              <div>
                <label for="book_<?= $i ?>_price">Prix</label>
                <input id="book_<?= $i ?>_price" name="book_<?= $i ?>_price" value="<?= e((string) (($books[$i]['price'] ?? ''))) ?>">
              </div>
            </div>
            <div class="row-2">
              <div>
                <label for="book_<?= $i ?>_weight_g">Poids (grammes)</label>
                <input id="book_<?= $i ?>_weight_g" name="book_<?= $i ?>_weight_g" value="<?= e((string) (($books[$i]['weight_g'] ?? ''))) ?>" placeholder="ex: 320">
              </div>
              <div>
                <label for="book_<?= $i ?>_id">Identifiant technique (slug)</label>
                <input id="book_<?= $i ?>_id" name="book_<?= $i ?>_id" value="<?= e((string) (($books[$i]['id'] ?? ''))) ?>">
              </div>
            </div>
            <label for="book_<?= $i ?>_display_order">Position dans le catalogue (1 = premier)</label>
            <input
              id="book_<?= $i ?>_display_order"
              name="book_<?= $i ?>_display_order"
              type="number"
              min="1"
              step="1"
              value="<?= e((string) (max(1, (int) (($books[$i]['display_order'] ?? 0) ?: ($i + 1)))) ) ?>"
            >
            <input type="hidden" name="book_<?= $i ?>_display_order_original" value="<?= e((string) (max(1, (int) (($books[$i]['display_order'] ?? 0) ?: ($i + 1)))) ) ?>">
            <?php
              $bookStockId = (string) (($books[$i]['id'] ?? ''));
              $bookStockVal = $bookStockId !== '' && array_key_exists($bookStockId, $catalogStockMap)
                ? (string) $catalogStockMap[$bookStockId]
                : (isset($books[$i]['stock_qty']) ? (string) $books[$i]['stock_qty'] : '');
            ?>
            <label for="book_<?= $i ?>_stock_qty">Stock disponible (modifier dans « Stocks du catalogue »)</label>
            <input id="book_<?= $i ?>_stock_qty" type="number" min="0" step="1" value="<?= e($bookStockVal) ?>" placeholder="—" readonly>
            <label for="book_<?= $i ?>_image">Image principale (ex: images/catalog/nikou-champion-cover.webp)</label>
            <input id="book_<?= $i ?>_image" name="book_<?= $i ?>_image" value="<?= e((string) (($books[$i]['image'] ?? ''))) ?>">
            <label for="book_<?= $i ?>_image_file">Ou televerser une image principale</label>
            <input id="book_<?= $i ?>_image_file" name="book_<?= $i ?>_image_file" type="file" accept="image/*">
            <label class="checkbox-row" for="book_<?= $i ?>_remove_image">
              <input id="book_<?= $i ?>_remove_image" name="book_<?= $i ?>_remove_image" type="checkbox" value="1">
              Supprimer l'image principale
            </label>

            <label for="book_<?= $i ?>_preview_images">Images apercu (chemins separes par des virgules)</label>
            <input id="book_<?= $i ?>_preview_images" name="book_<?= $i ?>_preview_images" value="<?= e((string) (($books[$i]['preview_images'] ?? ''))) ?>">
            <label for="book_<?= $i ?>_preview_files">Ou televerser jusqu'a 3 images d'apercu</label>
            <input id="book_<?= $i ?>_preview_files" name="book_<?= $i ?>_preview_files[]" type="file" accept="image/*" multiple>
            <label class="checkbox-row" for="book_<?= $i ?>_remove_previews">
              <input id="book_<?= $i ?>_remove_previews" name="book_<?= $i ?>_remove_previews" type="checkbox" value="1">
              Supprimer les images d'apercu
            </label>
            <label for="book_<?= $i ?>_description">Description (fiche produit)</label>
            <textarea id="book_<?= $i ?>_description" name="book_<?= $i ?>_description" rows="4"><?= e((string) (($books[$i]['description'] ?? ''))) ?></textarea>
            <div class="row-2">
              <div>
                <label for="book_<?= $i ?>_isbn">ISBN</label>
                <input id="book_<?= $i ?>_isbn" name="book_<?= $i ?>_isbn" value="<?= e((string) (($books[$i]['isbn'] ?? ''))) ?>">
              </div>
              <div>
                <label for="book_<?= $i ?>_format">Format (ex. 21 × 29,7 cm)</label>
                <input id="book_<?= $i ?>_format" name="book_<?= $i ?>_format" value="<?= e((string) (($books[$i]['format'] ?? ''))) ?>">
              </div>
            </div>
            <div class="row-2">
              <div>
                <label for="book_<?= $i ?>_pages">Nombre de pages</label>
                <input id="book_<?= $i ?>_pages" name="book_<?= $i ?>_pages" value="<?= e((string) (($books[$i]['pages'] ?? ''))) ?>" placeholder="32 pages">
              </div>
              <div>
                <label for="book_<?= $i ?>_age_range">Âge conseillé</label>
                <input id="book_<?= $i ?>_age_range" name="book_<?= $i ?>_age_range" value="<?= e((string) (($books[$i]['age_range'] ?? ''))) ?>" placeholder="Dès 3 ans">
              </div>
            </div>
            <div class="row-2">
              <div>
                <label for="book_<?= $i ?>_languages">Langues</label>
                <input id="book_<?= $i ?>_languages" name="book_<?= $i ?>_languages" value="<?= e((string) (($books[$i]['languages'] ?? ''))) ?>" placeholder="FR, CR, ES, EN">
              </div>
              <div>
                <label for="book_<?= $i ?>_publication_date">Date de parution</label>
                <input id="book_<?= $i ?>_publication_date" name="book_<?= $i ?>_publication_date" value="<?= e((string) (($books[$i]['publication_date'] ?? ''))) ?>" placeholder="2025">
              </div>
            </div>
            <label class="checkbox-row" for="book_<?= $i ?>_coming_soon">
              <input id="book_<?= $i ?>_coming_soon" name="book_<?= $i ?>_coming_soon" type="checkbox" value="1" <?= !empty($books[$i]['coming_soon']) ? 'checked' : '' ?>>
              Bientôt disponible (masquer le bouton d'achat)
            </label>
            <fieldset class="admin-fieldset">
              <legend>Pastilles sur la page catalogue</legend>
              <label class="checkbox-row" for="book_<?= $i ?>_badge_new">
                <input id="book_<?= $i ?>_badge_new" name="book_<?= $i ?>_badge_new" type="checkbox" value="1" <?= !empty($books[$i]['badge_new']) ? 'checked' : '' ?>>
                Nouveauté
              </label>
              <label class="checkbox-row" for="book_<?= $i ?>_badge_bestseller">
                <input id="book_<?= $i ?>_badge_bestseller" name="book_<?= $i ?>_badge_bestseller" type="checkbox" value="1" <?= !empty($books[$i]['badge_bestseller']) ? 'checked' : '' ?>>
                Best-seller
              </label>
              <label class="checkbox-row" for="book_<?= $i ?>_badge_award">
                <input id="book_<?= $i ?>_badge_award" name="book_<?= $i ?>_badge_award" type="checkbox" value="1" <?= !empty($books[$i]['badge_award']) ? 'checked' : '' ?>>
                Prix littéraire
              </label>
            </fieldset>
            <fieldset class="admin-fieldset">
              <legend>Fiche produit — champs à masquer</legend>
              <p class="admin-hint">Si coché, le champ n'apparaît plus sur la fiche publique (laisser la valeur vide pour ne rien afficher).</p>
              <label class="checkbox-row" for="book_<?= $i ?>_hide_isbn">
                <input id="book_<?= $i ?>_hide_isbn" name="book_<?= $i ?>_hide_isbn" type="checkbox" value="1" <?= !empty($books[$i]['hide_isbn']) ? 'checked' : '' ?>>
                Masquer ISBN
              </label>
              <label class="checkbox-row" for="book_<?= $i ?>_hide_format">
                <input id="book_<?= $i ?>_hide_format" name="book_<?= $i ?>_hide_format" type="checkbox" value="1" <?= !empty($books[$i]['hide_format']) ? 'checked' : '' ?>>
                Masquer le format / dimensions
              </label>
              <label class="checkbox-row" for="book_<?= $i ?>_hide_pages">
                <input id="book_<?= $i ?>_hide_pages" name="book_<?= $i ?>_hide_pages" type="checkbox" value="1" <?= !empty($books[$i]['hide_pages']) ? 'checked' : '' ?>>
                Masquer le champ « pages » (ou équivalent)
              </label>
              <label class="checkbox-row" for="book_<?= $i ?>_hide_publication_date">
                <input id="book_<?= $i ?>_hide_publication_date" name="book_<?= $i ?>_hide_publication_date" type="checkbox" value="1" <?= !empty($books[$i]['hide_publication_date']) ? 'checked' : '' ?>>
                Masquer la date de parution
              </label>
              <label class="checkbox-row" for="book_<?= $i ?>_hide_languages">
                <input id="book_<?= $i ?>_hide_languages" name="book_<?= $i ?>_hide_languages" type="checkbox" value="1" <?= !empty($books[$i]['hide_languages']) ? 'checked' : '' ?>>
                Masquer les langues disponibles
              </label>
            </fieldset>
            <fieldset class="admin-fieldset">
              <legend>Libellés de la fiche technique (optionnel)</legend>
              <p class="admin-hint">Laissez vide pour les libellés par défaut. Ex. peluche : « Dimensions » et « Présentation ».</p>
              <div class="row-2">
                <div>
                  <label for="book_<?= $i ?>_label_isbn">Libellé ISBN</label>
                  <input id="book_<?= $i ?>_label_isbn" name="book_<?= $i ?>_label_isbn" value="<?= e((string) ($books[$i]['label_isbn'] ?? '')) ?>" placeholder="ISBN :">
                </div>
                <div>
                  <label for="book_<?= $i ?>_label_format">Libellé format</label>
                  <input id="book_<?= $i ?>_label_format" name="book_<?= $i ?>_label_format" value="<?= e((string) ($books[$i]['label_format'] ?? '')) ?>" placeholder="Format :">
                </div>
              </div>
              <div class="row-2">
                <div>
                  <label for="book_<?= $i ?>_label_pages">Libellé champ pages</label>
                  <input id="book_<?= $i ?>_label_pages" name="book_<?= $i ?>_label_pages" value="<?= e((string) ($books[$i]['label_pages'] ?? '')) ?>" placeholder="Nombre de pages :">
                </div>
                <div>
                  <label for="book_<?= $i ?>_label_publication_date">Libellé date de parution</label>
                  <input id="book_<?= $i ?>_label_publication_date" name="book_<?= $i ?>_label_publication_date" value="<?= e((string) ($books[$i]['label_publication_date'] ?? '')) ?>" placeholder="Date de parution :">
                </div>
              </div>
            </fieldset>
            <label for="book_<?= $i ?>_pedagogical_file">Fiche pédagogique (chemin PDF/TXT)</label>
            <input id="book_<?= $i ?>_pedagogical_file" name="book_<?= $i ?>_pedagogical_file" value="<?= e((string) (($books[$i]['pedagogical_file'] ?? ''))) ?>">
            <label for="book_<?= $i ?>_pedagogical_upload">Ou téléverser fiche (PDF ou TXT, comptes pro)</label>
            <input id="book_<?= $i ?>_pedagogical_upload" name="book_<?= $i ?>_pedagogical_upload" type="file" accept=".pdf,.txt,application/pdf,text/plain">
            <label class="checkbox-row" for="book_<?= $i ?>_remove_pedagogical">
              <input id="book_<?= $i ?>_remove_pedagogical" name="book_<?= $i ?>_remove_pedagogical" type="checkbox" value="1">
              Supprimer la fiche pédagogique
            </label>
            <label class="checkbox-row" for="book_<?= $i ?>_remove_book">
              <input id="book_<?= $i ?>_remove_book" name="book_<?= $i ?>_remove_book" type="checkbox" value="1">
              Retirer ce produit du catalogue
            </label>
          </div>
        </details>
      <?php endfor; ?>
      </div>
    </div>

    <div class="card">
      <h2>Page Contact</h2>
      <label for="contact_title">Titre de la page</label>
      <input id="contact_title" name="contact_title" value="<?= e(contenu_get($contenu, 'contact_page.title')) ?>">

      <label for="contact_intro">Texte d'introduction</label>
      <textarea id="contact_intro" name="contact_intro"><?= e(contenu_get($contenu, 'contact_page.intro')) ?></textarea>

      <label for="contact_bloc_titre">Titre du bloc de gauche</label>
      <input id="contact_bloc_titre" name="contact_bloc_titre" value="<?= e(contenu_get($contenu, 'contact_page.bloc_titre')) ?>">

      <label for="contact_bloc_texte">Texte du bloc de gauche</label>
      <textarea id="contact_bloc_texte" name="contact_bloc_texte"><?= e(contenu_get($contenu, 'contact_page.bloc_texte')) ?></textarea>

      <label for="contact_adresse_texte">Adresse</label>
      <textarea id="contact_adresse_texte" name="contact_adresse_texte"><?= e(contenu_get($contenu, 'contact_page.adresse_texte')) ?></textarea>

      <label for="contact_telephone">Telephone</label>
      <input id="contact_telephone" name="contact_telephone" value="<?= e(contenu_get($contenu, 'contact_page.telephone')) ?>">
      <div class="row-2">
        <div>
          <label for="contact_adresse_label">Label adresse</label>
          <input id="contact_adresse_label" name="contact_adresse_label" value="<?= e(contenu_get($contenu, 'contact_page.adresse_label')) ?>">
        </div>
        <div>
          <label for="contact_telephone_label">Label telephone</label>
          <input id="contact_telephone_label" name="contact_telephone_label" value="<?= e(contenu_get($contenu, 'contact_page.telephone_label')) ?>">
        </div>
      </div>
      <label for="contact_retour_texte">Texte lien retour</label>
      <input id="contact_retour_texte" name="contact_retour_texte" value="<?= e(contenu_get($contenu, 'contact_page.retour_texte')) ?>">
    </div>

    <div class="card">
      <h2>E-commerce et panier</h2>
      <p class="section-note">Ces textes servent au bloc panier et aux informations de paiement/livraison visibles par les clients.</p>
      <label for="ecom_cart_note">Note panier (paiement/livraison)</label>
      <textarea id="ecom_cart_note" name="ecom_cart_note"><?= e(contenu_get($contenu, 'ecommerce.cart_note', 'Paiement securise (CB, Visa, Mastercard).')) ?></textarea>
      <label for="ecom_shipping_note">Texte frais de livraison</label>
      <textarea id="ecom_shipping_note" name="ecom_shipping_note"><?= e(contenu_get($contenu, 'ecommerce.shipping_note', 'Frais de livraison calcules selon le poids total du panier et le bareme postal.')) ?></textarea>
      <div class="row-2">
        <div>
          <label for="ecom_support_email">Email support commandes</label>
          <input id="ecom_support_email" name="ecom_support_email" value="<?= e(contenu_get($contenu, 'ecommerce.support_email')) ?>" placeholder="contact@...">
        </div>
        <div>
          <label for="ecom_support_phone">Telephone support commandes</label>
          <input id="ecom_support_phone" name="ecom_support_phone" value="<?= e(contenu_get($contenu, 'ecommerce.support_phone')) ?>">
        </div>
      </div>
      <h3 style="margin-top:14px;">Barème postal (modifiable)</h3>
      <p class="section-note">Tarifs Colissimo au départ du siège (Martinique). Mettez à jour ces montants dès que La Poste publie une nouvelle grille.</p>
      <?php
      $postalZoneLabels = [
          'dom_martinique_near' => 'Caraïbes / USA (départ Martinique)',
          'dom_international' => 'France métropole et autres pays',
      ];
      foreach ($postalRateDefaults as $zoneKey => $rows):
          $zoneRows = $postalRates[$zoneKey] ?? [];
          if (!is_array($zoneRows)) $zoneRows = [];
      ?>
        <h4><?= e($postalZoneLabels[$zoneKey] ?? $zoneKey) ?></h4>
        <div class="row-2">
          <?php foreach ($rows as $idx => $row):
              $saved = $zoneRows[$idx] ?? [];
              $weightVal = (int) ($saved['max_weight_g'] ?? $row['max_weight_g']);
              $amountVal = (float) ($saved['amount_eur'] ?? $row['amount_eur']);
          ?>
            <div>
              <label for="ecom_rate_<?= e($zoneKey) ?>_<?= $idx ?>">Jusqu'à <?= e((string) $row['max_weight_g']) ?> g (€)</label>
              <input
                id="ecom_rate_<?= e($zoneKey) ?>_<?= $idx ?>"
                name="ecom_rate_<?= e($zoneKey) ?>_<?= $idx ?>"
                type="text"
                value="<?= e(number_format($amountVal, 2, '.', '')) ?>"
              >
              <input type="hidden" name="ecom_rate_weight_<?= e($zoneKey) ?>_<?= $idx ?>" value="<?= e((string) $weightVal) ?>">
            </div>
          <?php endforeach; ?>
        </div>
      <?php endforeach; ?>
    </div>

    <div class="card">
      <h2>Footer</h2>
      <div class="row-2">
        <div>
          <label for="footer_brand_name">Nom entreprise</label>
          <input id="footer_brand_name" name="footer_brand_name" value="<?= e(contenu_get($contenu, 'footer.brand_name')) ?>">
        </div>
        <div>
          <label for="footer_brand_tagline">Sous-titre entreprise</label>
          <input id="footer_brand_tagline" name="footer_brand_tagline" value="<?= e(contenu_get($contenu, 'footer.brand_tagline')) ?>">
        </div>
      </div>
      <label for="footer_description">Description</label>
      <textarea id="footer_description" name="footer_description"><?= e(contenu_get($contenu, 'footer.description')) ?></textarea>

      <label for="footer_ville">Ville</label>
      <input id="footer_ville" name="footer_ville" value="<?= e(contenu_get($contenu, 'footer.ville')) ?>">

      <label for="footer_tel">Telephone footer</label>
      <input id="footer_tel" name="footer_tel" value="<?= e(contenu_get($contenu, 'footer.telephone')) ?>">
      <label for="footer_copyright">Copyright</label>
      <input id="footer_copyright" name="footer_copyright" value="<?= e(contenu_get($contenu, 'footer.copyright')) ?>">
      <div class="row-2">
        <div>
          <label for="footer_mentions_legales">Libelle lien mentions legales</label>
          <input id="footer_mentions_legales" name="footer_mentions_legales" value="<?= e(contenu_get($contenu, 'footer.mentions_legales')) ?>">
        </div>
        <div>
          <label for="footer_confidentialite">Libelle lien confidentialite</label>
          <input id="footer_confidentialite" name="footer_confidentialite" value="<?= e(contenu_get($contenu, 'footer.confidentialite')) ?>">
        </div>
      </div>
      <label for="footer_cgv">Libelle lien CGV</label>
      <input id="footer_cgv" name="footer_cgv" value="<?= e(contenu_get($contenu, 'footer.cgv')) ?>">
    </div>

    <div class="actions">
      <button type="submit" class="primary">Enregistrer</button>
      <button type="submit" name="action" value="add_book">Ajouter un produit</button>
      <button type="submit" name="action" value="add_news">Ajouter une actualité</button>
      <button type="submit" name="action" value="add_promo_code">Ajouter un code promo</button>
      <button type="submit" name="action" value="reset_catalogue" class="danger" onclick="return confirm('Reinitialiser le catalogue aux valeurs par defaut ?');">Reinitialiser catalogue</button>
      <button type="submit" name="action" value="restore_backup" onclick="return confirm('Restaurer la sauvegarde precedente et annuler la derniere modification ?');">Retour arriere (Ctrl+Z)</button>
      <button type="reset">Annuler les changements non enregistres</button>
      <a class="link" href="../index.html" target="_blank" rel="noopener">Voir l'accueil (site)</a>
      <a class="link" href="../catalogue.html" target="_blank" rel="noopener">Voir le catalogue</a>
      <a class="link" href="../actualites.html" target="_blank" rel="noopener">Voir les actualités</a>
      <a class="link" href="../contact.html" target="_blank" rel="noopener">Voir le contact</a>
      <a class="link" href="guide.php">Guide d'utilisation</a>
      <a class="link" href="logout.php">Se deconnecter</a>
    </div>
  </form>
  </div>
</body>
</html>
