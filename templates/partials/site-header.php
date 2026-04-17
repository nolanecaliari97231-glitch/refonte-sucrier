<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header">
  <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="logo" aria-label="Les Editions du Sucrier - Accueil">
    <span class="logo-mark">
      <img src="<?php echo esc_url( get_template_directory_uri() . '/images/logo-editions-sucrier.png' ); ?>" alt="" class="logo-img" width="96" height="96" decoding="async" aria-hidden="true">
    </span>
    <span class="logo-wordmark">
      <span class="logo-title">Les Editions du Sucrier</span>
      <span class="logo-tagline">Maison d'edition jeunesse - Martinique</span>
    </span>
  </a>

  <nav class="main-nav" aria-label="Navigation principale">
    <ul>
      <li><a href="<?php echo esc_url( home_url( '/catalogue/' ) ); ?>">Catalogue</a></li>
      <li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Contact</a></li>
      <li><a href="<?php echo esc_url( home_url( '/panier/' ) ); ?>">Panier</a></li>
    </ul>
  </nav>

  <div class="header-icons">
    <a href="<?php echo esc_url( home_url( '/catalogue/' ) ); ?>" class="icon-btn" aria-label="Voir le catalogue">
      <svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      Catalogue
    </a>
    <a href="<?php echo esc_url( home_url( '/panier/' ) ); ?>" class="icon-btn" aria-label="Voir le panier">
      <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      Panier
      <span class="panier-badge">0</span>
    </a>
  </div>
</header>
