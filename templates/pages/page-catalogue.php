<?php get_header(); ?>

<main class="page-shell">
  <section class="page-hero">
    <h1>Catalogue</h1>
    <p>Selection jeunesse des Editions du Sucrier</p>
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
      <div class="filter-group">
        <h3>Age</h3>
        <label><input type="checkbox"> 3-5 ans</label>
        <label><input type="checkbox"> 6-8 ans</label>
        <label><input type="checkbox"> 9 ans et +</label>
      </div>
    </aside>

    <div class="catalogue-grid">
      <article class="catalogue-card">
        <img src="<?php echo esc_url( get_template_directory_uri() . '/images/nikou-champion.png' ); ?>" alt="Nikou champion">
        <div class="catalogue-card-body">
          <h3>Nikou champion</h3>
          <p>L. Ramassamy - W. Deroche</p>
          <div class="catalogue-meta">
            <span>12,00 EUR</span>
            <button>Ajouter</button>
          </div>
        </div>
      </article>

      <article class="catalogue-card">
        <img src="<?php echo esc_url( get_template_directory_uri() . '/images/circuit-ferme.png' ); ?>" alt="Circuit ferme">
        <div class="catalogue-card-body">
          <h3>Circuit ferme</h3>
          <p>J.-F. Silva - O. J. F. Junior</p>
          <div class="catalogue-meta">
            <span>14,00 EUR</span>
            <button>Ajouter</button>
          </div>
        </div>
      </article>

      <article class="catalogue-card">
        <img src="<?php echo esc_url( get_template_directory_uri() . '/images/exocette.png' ); ?>" alt="Exocette">
        <div class="catalogue-card-body">
          <h3>Exocette</h3>
          <p>Renata - W. Deroche</p>
          <div class="catalogue-meta">
            <span>15,00 EUR</span>
            <button>Ajouter</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</main>

<?php get_footer(); ?>
