<?php
require __DIR__ . '/includes/bootstrap.php';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= e($config['site_name'] ?? 'Site') ?></title>
<link rel="icon" href="images/logo-footer-noir.png" type="image/png">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header>
  <a href="index.php" class="logo" aria-label="<?= e($config['site_name'] ?? 'Accueil') ?>">
    <span class="logo-mark"><img src="images/logo-editions-sucrier.png" alt="" class="logo-img" width="96" height="96" decoding="async" aria-hidden="true"></span>
    <span class="logo-wordmark">
      <span class="logo-title"><?= e($config['site_name'] ?? '') ?></span>
      <span class="logo-tagline"><?= e($config['site_tagline'] ?? '') ?></span>
    </span>
  </a>
  <nav>
    <ul>
      <li><a href="catalogue.php">Catalogue</a></li>
      <li><a href="a-propos.php">A propos</a></li>
      <li><a href="contact.php">Contact</a></li>
    </ul>
  </nav>
</header>

<section class="hero">
  <div class="hero-texte">
    <span class="hero-tag"><?= e(contenu_get($contenu, 'home_page.hero_tag', 'Maison d edition')) ?></span>
    <h1><?= e(contenu_get($contenu, 'home_page.hero_title', 'Bienvenue')) ?></h1>
    <p class="hero-desc"><?= e(contenu_get($contenu, 'home_page.hero_intro', '')) ?></p>
    <div class="hero-ctas">
      <a href="<?= e(contenu_get($contenu, 'home_page.cta_primary_link', 'catalogue.php')) ?>" class="btn-primary"><?= e(contenu_get($contenu, 'home_page.cta_primary_text', 'Explorer')) ?></a>
      <a href="<?= e(contenu_get($contenu, 'home_page.cta_secondary_link', 'a-propos.php')) ?>" class="btn-outline"><?= e(contenu_get($contenu, 'home_page.cta_secondary_text', 'A propos')) ?></a>
    </div>
  </div>
  <div class="hero-image">
    <div class="hero-image-placeholder">
      <div class="hero-showcase">
        <img src="images/nikou-gambadeur.png" alt="" class="hero-nikou" width="380" height="480" decoding="async" aria-hidden="true">
      </div>
    </div>
  </div>
</section>

<section class="page-placeholder">
  <p>Cette page d'accueil est maintenant reliee au mini-admin pour les textes principaux.</p>
  <p><a class="voir-tout" href="admin/login.php">Modifier les textes depuis l'admin</a></p>
</section>

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
</body>
</html>
