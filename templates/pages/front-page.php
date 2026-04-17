<?php get_header(); ?>

<main>
  <section class="hero">
    <div class="hero-texte">
      <span class="hero-tag">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="4"/></svg>
        Maison d'edition caribeenne
      </span>
      <h1>Bienvenue sur le nouveau site des <em>Editions du Sucrier</em></h1>
      <p class="hero-desc">Base fonctionnelle du site: explore le catalogue, teste le panier et envoie un message depuis la page contact.</p>
      <div class="hero-ctas">
        <a href="<?php echo esc_url( home_url( '/catalogue/' ) ); ?>" class="btn-primary">Voir le catalogue</a>
        <a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>" class="btn-outline">Nous contacter</a>
      </div>
    </div>

    <div class="hero-image">
      <div class="hero-image-placeholder">
        <div class="hero-showcase">
          <img src="<?php echo esc_url( get_template_directory_uri() . '/images/nikou-gambadeur.png' ); ?>" alt="" class="hero-nikou" width="380" height="480" decoding="async" aria-hidden="true">
          <figure class="hero-book">
            <img src="<?php echo esc_url( get_template_directory_uri() . '/images/nikou-champion.png' ); ?>" alt="Couverture Nikou champion" class="hero-book-cover" width="600" height="800" decoding="async">
          </figure>
        </div>
      </div>
    </div>
  </section>

  <section class="section-bestsellers">
    <div class="section-header">
      <div>
        <h2 class="section-titre">Demarrage du site</h2>
        <p class="section-sous-titre">Pages creees a partir de tes wireframes</p>
      </div>
    </div>
    <div class="quick-links-grid">
      <a class="quick-link-card" href="<?php echo esc_url( home_url( '/catalogue/' ) ); ?>">
        <h3>Catalogue</h3>
        <p>Vue produits avec filtres et grille de livres.</p>
      </a>
      <a class="quick-link-card" href="<?php echo esc_url( home_url( '/panier/' ) ); ?>">
        <h3>Panier</h3>
        <p>Recapitulatif des articles, total et paiement.</p>
      </a>
      <a class="quick-link-card" href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">
        <h3>Contact</h3>
        <p>Informations de contact + formulaire de message.</p>
      </a>
    </div>
  </section>
</main>

<?php get_footer(); ?>
