<?php
require __DIR__ . '/includes/bootstrap.php';
$books = $contenu['catalogue_books'] ?? [];
if (!is_array($books)) {
    $books = [];
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= e(contenu_get($contenu, 'catalogue_page.title', 'Catalogue')) ?> - <?= e($config['site_name'] ?? 'Site') ?></title>
<link rel="icon" href="images/logo-footer-noir.png" type="image/png">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header>
  <a href="index.php" class="logo" aria-label="<?= e($config['site_name'] ?? 'Accueil') ?>">
    <span class="logo-mark"><img src="images/logo-editions-sucrier.png" alt="" class="logo-img" width="96" height="96" decoding="async" aria-hidden="true"></span>
    <span class="logo-wordmark"><span class="logo-title"><?= e($config['site_name'] ?? '') ?></span><span class="logo-tagline"><?= e($config['site_tagline'] ?? '') ?></span></span>
  </a>
  <nav>
    <ul>
      <li><a href="catalogue.php">Catalogue</a></li>
      <li><a href="a-propos.php">A propos</a></li>
      <li><a href="contact.php">Contact</a></li>
    </ul>
  </nav>
</header>

<main class="page-shell">
  <section class="page-hero">
    <h1><?= e(contenu_get($contenu, 'catalogue_page.title', 'Catalogue')) ?></h1>
    <p><?= e(contenu_get($contenu, 'catalogue_page.intro', '')) ?></p>
  </section>

  <section class="catalogue-layout">
    <aside class="filters-card">
      <h2>Filtres</h2>
      <div class="filter-group">
        <h3>Collection</h3>
        <label><input type="checkbox"> Nikou</label>
        <label><input type="checkbox"> Bebe Nikou</label>
        <label><input type="checkbox"> Plumes aventureuses</label>
      </div>
    </aside>

    <div class="catalogue-grid">
      <?php foreach ($books as $book): ?>
        <?php
          $id = (string) ($book['id'] ?? '');
          $collection = (string) ($book['collection'] ?? '');
          $title = (string) ($book['title'] ?? '');
          $authors = (string) ($book['authors'] ?? '');
          $price = (string) ($book['price'] ?? '');
          $image = (string) ($book['image'] ?? '');
          $previewImages = (string) ($book['preview_images'] ?? $image);
        ?>
        <article class="catalogue-card" data-product-id="<?= e($id) ?>" data-collection="<?= e($collection) ?>" data-preview-images="<?= e($previewImages) ?>">
          <div class="catalogue-card-media">
            <img src="<?= e($image) ?>" alt="<?= e($title) ?>" class="catalogue-card-image">
            <span class="catalogue-preview-tag">Apercu</span>
          </div>
          <div class="catalogue-card-body">
            <h3><?= e($title) ?></h3>
            <p><?= e($authors) ?></p>
            <div class="catalogue-meta">
              <span><?= e($price) ?></span>
              <button type="button" class="wishlist-btn" data-product-id="<?= e($id) ?>" aria-label="Ajouter <?= e($title) ?> aux favoris"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
              <button type="button" class="add-to-cart-btn">Ajouter</button>
            </div>
          </div>
        </article>
      <?php endforeach; ?>
    </div>
  </section>

  <section class="catalogue-detail-modal" id="catalogue-detail-modal" aria-hidden="true">
    <div class="catalogue-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="catalogue-detail-title">
      <button type="button" class="catalogue-detail-close" aria-label="Fermer la fiche livre">×</button>
      <div class="catalogue-detail-layout">
        <div class="catalogue-detail-gallery">
          <img src="" alt="" class="catalogue-detail-main-image" id="catalogue-detail-main-image">
          <div class="catalogue-detail-thumbs" id="catalogue-detail-thumbs"></div>
        </div>
        <div class="catalogue-detail-content">
          <p class="catalogue-detail-collection" id="catalogue-detail-collection"></p>
          <h2 id="catalogue-detail-title"></h2>
          <p class="catalogue-detail-authors" id="catalogue-detail-authors"></p>
          <p class="catalogue-detail-price book-card-prix" id="catalogue-detail-price" data-price-eur="0">0,00 €</p>
          <details class="catalogue-detail-panel" open>
            <summary>Presentation du livre</summary>
            <p id="catalogue-detail-description"></p>
          </details>
          <details class="catalogue-detail-panel">
            <summary>Fiche technique</summary>
            <ul class="catalogue-detail-specs" id="catalogue-detail-specs"></ul>
          </details>
          <div class="catalogue-detail-reco">
            <h3>Vous pourriez aussi aimer</h3>
            <div class="catalogue-detail-reco-list" id="catalogue-detail-reco-list"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="footer-grid">
    <div>
      <div class="footer-brand">
        <img src="images/logo-footer-noir.png" alt="" class="footer-logo-img" width="120" height="120" decoding="async" aria-hidden="true">
        <div class="footer-wordmark">
          <span class="footer-brand-name"><?= e(contenu_get($contenu, 'footer.brand_name', '')) ?></span>
          <span class="footer-brand-tagline"><?= e(contenu_get($contenu, 'footer.brand_tagline', '')) ?></span>
        </div>
      </div>
      <p class="footer-desc"><?= e(contenu_get($contenu, 'footer.description', '')) ?></p>
    </div>
    <div class="footer-col">
      <h4>Navigation</h4>
      <ul>
        <li><a href="index.php">Accueil</a></li>
        <li><a href="catalogue.php">Catalogue</a></li>
        <li><a href="a-propos.php">A propos</a></li>
        <li><a href="contact.php">Contact</a></li>
      </ul>
    </div>
    <div class="footer-col"><h4>Contact</h4><div class="footer-contact-item"><?= e(contenu_get($contenu, 'footer.ville', '')) ?></div><div class="footer-contact-item"><?= e(contenu_get($contenu, 'footer.telephone', '')) ?></div></div>
  </div>
  <div class="footer-bottom"><p><?= e(contenu_get($contenu, 'footer.copyright', '')) ?></p></div>
</footer>
<script src="app.js"></script>
</body>
</html>
