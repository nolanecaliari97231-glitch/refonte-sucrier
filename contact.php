<?php
require __DIR__ . '/includes/bootstrap.php';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= e(contenu_get($contenu, 'contact_page.title', 'Contact')) ?> - <?= e($config['site_name'] ?? 'Site') ?></title>
<link rel="icon" href="images/logo-footer-noir.png" type="image/png">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head>
<body>

<header>
  <a href="index.php" class="logo" aria-label="<?= e($config['site_name'] ?? 'Accueil') ?> - Accueil">
    <span class="logo-mark">
      <img src="images/logo-editions-sucrier.png" alt="" class="logo-img" width="96" height="96" decoding="async" aria-hidden="true">
    </span>
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
  <div class="header-icons">
    <a href="catalogue.php" class="icon-btn">Favoris</a>
    <a href="panier.html" class="icon-btn">Panier <span class="panier-badge">0</span></a>
    <a href="contact.php" class="icon-btn" aria-label="Contact">Compte</a>
  </div>
</header>

<main class="page-shell">
  <section class="page-hero">
    <h1><?= e(contenu_get($contenu, 'contact_page.title', 'Contact')) ?></h1>
    <p><?= e(contenu_get($contenu, 'contact_page.intro', '')) ?></p>
  </section>

  <section class="contact-layout">
    <div class="contact-content">
      <h2><?= e(contenu_get($contenu, 'contact_page.bloc_titre', 'Nous ecrire')) ?></h2>
      <p><?= e(contenu_get($contenu, 'contact_page.bloc_texte', '')) ?></p>
      <ul class="contact-list">
        <li><strong><?= e(contenu_get($contenu, 'contact_page.adresse_label', 'Adresse')) ?></strong><br><?= e(contenu_get($contenu, 'contact_page.adresse_texte', '')) ?></li>
        <li><strong><?= e(contenu_get($contenu, 'contact_page.telephone_label', 'Telephone')) ?></strong> <?= e(contenu_get($contenu, 'contact_page.telephone', '')) ?></li>
      </ul>
      <p><a href="index.php" class="voir-tout">← <?= e(contenu_get($contenu, 'contact_page.retour_texte', 'Retour')) ?></a></p>
    </div>

    <form class="contact-form" action="#" method="get" onsubmit="alert('Maquette : formulaire non connecte.'); return false;">
      <label for="name">Nom</label>
      <input id="name" name="name" type="text" required autocomplete="name">
      <label for="contact-type">Type de demande</label>
      <select id="contact-type" name="contact-type" required>
        <option value="">Selectionnez votre profil</option>
        <option value="libraire">Libraire</option>
        <option value="parent">Parent</option>
        <option value="enseignant">Enseignant(e)</option>
        <option value="mediatheque">Mediatheque / Bibliotheque</option>
        <option value="auteur">Auteur / Illustrateur</option>
        <option value="presse">Presse / Partenariat</option>
        <option value="autre">Autre</option>
      </select>
      <label for="message">Message</label>
      <textarea id="message" name="message" rows="6" required></textarea>
      <button type="submit" class="btn-primary">Envoyer le message</button>
    </form>
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
    <div class="footer-col">
      <h4>Collections</h4>
      <ul>
        <li><a href="catalogue.php">Voir le catalogue</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Contact</h4>
      <div class="footer-contact-item"><?= e(contenu_get($contenu, 'footer.ville', '')) ?></div>
      <div class="footer-contact-item"><?= e(contenu_get($contenu, 'footer.telephone', '')) ?></div>
    </div>
  </div>
  <div class="footer-bottom">
    <p><?= e(contenu_get($contenu, 'footer.copyright', '')) ?></p>
    <div class="footer-links">
      <a href="#"><?= e(contenu_get($contenu, 'footer.mentions_legales', 'Mentions legales')) ?></a>
      <a href="#"><?= e(contenu_get($contenu, 'footer.confidentialite', 'Politique de confidentialite')) ?></a>
      <a href="#"><?= e(contenu_get($contenu, 'footer.cgv', 'CGV')) ?></a>
    </div>
  </div>
</footer>
<script src="app.js"></script>
</body>
</html>
