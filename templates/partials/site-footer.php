<footer>
  <div class="footer-grid">
    <div>
      <div class="footer-brand">
        <img src="<?php echo esc_url( get_template_directory_uri() . '/images/logo-editions-sucrier.png' ); ?>" alt="" class="footer-logo-img" width="120" height="120" decoding="async" aria-hidden="true">
        <div class="footer-wordmark">
          <span class="footer-brand-name">Les Editions du Sucrier</span>
          <span class="footer-brand-tagline">Maison d'edition jeunesse - Martinique</span>
        </div>
      </div>
      <p class="footer-desc">Maison d'edition jeunesse martiniquaise dediee a raconter la Caraibe aux plus jeunes a travers des albums illustres.</p>
    </div>

    <div class="footer-col">
      <h4>Navigation</h4>
      <ul>
        <li><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Accueil</a></li>
        <li><a href="<?php echo esc_url( home_url( '/catalogue/' ) ); ?>">Catalogue</a></li>
        <li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Contact</a></li>
        <li><a href="<?php echo esc_url( home_url( '/panier/' ) ); ?>">Panier</a></li>
      </ul>
    </div>

    <div class="footer-col">
      <h4>Contact</h4>
      <div class="footer-contact-item">
        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Fort-de-France, Martinique
      </div>
      <div class="footer-contact-item">
        <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 5.59 5.59l.96-.96a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        05 96 93 27 58
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    <p>&copy; <?php echo esc_html( date_i18n( 'Y' ) ); ?> Les Editions du Sucrier - Tous droits reserves</p>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
