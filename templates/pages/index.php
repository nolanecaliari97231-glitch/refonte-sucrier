<?php
get_header();
?>

<main class="page-shell">
  <section class="page-hero">
    <h1><?php bloginfo( 'name' ); ?></h1>
    <p><?php bloginfo( 'description' ); ?></p>
  </section>

  <section class="section-bestsellers">
    <?php if ( have_posts() ) : ?>
      <?php while ( have_posts() ) : the_post(); ?>
        <article class="quick-link-card">
          <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
          <?php the_excerpt(); ?>
        </article>
      <?php endwhile; ?>
    <?php else : ?>
      <p>Aucun contenu pour le moment.</p>
    <?php endif; ?>
  </section>
</main>

<?php
get_footer();
