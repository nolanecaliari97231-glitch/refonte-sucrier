<?php get_header(); ?>

<main class="page-shell">
  <section class="page-hero">
    <h1>Panier</h1>
    <p>Recapitulatif de la commande</p>
  </section>

  <section class="cart-layout">
    <div class="cart-list">
      <article class="cart-item">
        <img src="<?php echo esc_url( get_template_directory_uri() . '/images/nikou-champion.png' ); ?>" alt="Nikou champion">
        <div class="cart-item-info">
          <h3>Nikou champion</h3>
          <p>Quantite: 1</p>
        </div>
        <strong>12,00 EUR</strong>
      </article>

      <article class="cart-item">
        <img src="<?php echo esc_url( get_template_directory_uri() . '/images/tice-et-metice.png' ); ?>" alt="Tice et Metice">
        <div class="cart-item-info">
          <h3>Tice et Metice</h3>
          <p>Quantite: 1</p>
        </div>
        <strong>13,00 EUR</strong>
      </article>
    </div>

    <aside class="cart-summary">
      <h2>Resume</h2>
      <p><span>Sous-total</span><span>25,00 EUR</span></p>
      <p><span>Livraison</span><span>4,90 EUR</span></p>
      <p class="total"><span>Total</span><span>29,90 EUR</span></p>
      <button class="btn-primary">Passer au paiement</button>
    </aside>
  </section>
</main>

<?php get_footer(); ?>
