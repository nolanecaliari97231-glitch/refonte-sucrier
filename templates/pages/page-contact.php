<?php get_header(); ?>

<main class="page-shell">
  <section class="page-hero">
    <h1>Contact</h1>
    <p>Une question sur nos livres ou une commande?</p>
  </section>

  <section class="contact-layout">
    <div class="contact-content">
      <h2>Parlons de ton projet</h2>
      <p>Nous repondons en general sous 24 a 48h.</p>

      <ul class="contact-list">
        <li><strong>Adresse:</strong> Fort-de-France, Martinique</li>
        <li><strong>Telephone:</strong> 05 96 93 27 58</li>
        <li><strong>Email:</strong> contact@editionsdusucrier.fr</li>
      </ul>
    </div>

    <form class="contact-form" action="#" method="post">
      <label for="name">Nom</label>
      <input id="name" name="name" type="text" required>

      <label for="email">Email</label>
      <input id="email" name="email" type="email" required>

      <label for="message">Message</label>
      <textarea id="message" name="message" rows="6" required></textarea>

      <button type="submit" class="btn-primary">Envoyer le message</button>
    </form>
  </section>
</main>

<?php get_footer(); ?>
