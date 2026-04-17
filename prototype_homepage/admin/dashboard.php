<?php
session_start();
require __DIR__ . '/../includes/bootstrap.php';

if (empty($_SESSION['is_admin'])) {
    header('Location: login.php');
    exit;
}

$saved = isset($_GET['saved']);
$action = $_GET['action'] ?? '';
$books = $contenu['catalogue_books'] ?? [];
if (!is_array($books)) {
    $books = [];
}
$bookCount = count($books);
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="admin.css">
  <title>Admin - Edition contenu</title>
</head>
<body>
  <div class="admin-shell">
  <header class="admin-header">
    <h1>Mini-admin - Les Editions du Sucrier</h1>
    <p>Interface simplifiee pour modifier les contenus sans toucher au code.</p>
  </header>
  <?php if ($saved): ?>
    <div class="success">
      <?php if ($action === 'reset_catalogue'): ?>
        Catalogue reinitialise aux valeurs par defaut.
      <?php elseif ($action === 'add_book'): ?>
        Nouveau livre ajoute.
      <?php elseif ($action === 'restore_backup'): ?>
        Retour arriere effectue: sauvegarde precedente restauree.
      <?php else: ?>
        Modifications enregistrees avec succes.
      <?php endif; ?>
    </div>
  <?php endif; ?>

  <form method="post" action="save.php" enctype="multipart/form-data" class="admin-grid">
    <div class="card">
      <h2>Page Accueil</h2>
      <div class="row-2">
        <div>
          <label for="home_hero_tag">Tag hero</label>
          <input id="home_hero_tag" name="home_hero_tag" value="<?= e(contenu_get($contenu, 'home_page.hero_tag')) ?>">
        </div>
        <div>
          <label for="home_hero_title">Titre hero</label>
          <input id="home_hero_title" name="home_hero_title" value="<?= e(contenu_get($contenu, 'home_page.hero_title')) ?>">
        </div>
      </div>
      <label for="home_hero_intro">Texte hero</label>
      <textarea id="home_hero_intro" name="home_hero_intro"><?= e(contenu_get($contenu, 'home_page.hero_intro')) ?></textarea>
      <div class="row-2">
        <div>
          <label for="home_cta_primary_text">Texte bouton principal</label>
          <input id="home_cta_primary_text" name="home_cta_primary_text" value="<?= e(contenu_get($contenu, 'home_page.cta_primary_text')) ?>">
        </div>
        <div>
          <label for="home_cta_secondary_text">Texte bouton secondaire</label>
          <input id="home_cta_secondary_text" name="home_cta_secondary_text" value="<?= e(contenu_get($contenu, 'home_page.cta_secondary_text')) ?>">
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Page A propos</h2>
      <div class="row-2">
        <div>
          <label for="about_title">Titre de la page</label>
          <input id="about_title" name="about_title" value="<?= e(contenu_get($contenu, 'about_page.title')) ?>">
        </div>
        <div>
          <label for="about_intro">Sous-titre</label>
          <input id="about_intro" name="about_intro" value="<?= e(contenu_get($contenu, 'about_page.intro')) ?>">
        </div>
      </div>
      <label for="about_p1">Paragraphe 1</label>
      <textarea id="about_p1" name="about_p1"><?= e(contenu_get($contenu, 'about_page.paragraphe_1')) ?></textarea>
      <label for="about_p2">Paragraphe 2</label>
      <textarea id="about_p2" name="about_p2"><?= e(contenu_get($contenu, 'about_page.paragraphe_2')) ?></textarea>
    </div>

    <div class="card">
      <h2>Page Catalogue</h2>
      <p class="section-note">Concue pour beaucoup de livres : chaque livre est dans un menu deroulant.</p>
      <label for="catalogue_title">Titre de la page</label>
      <input id="catalogue_title" name="catalogue_title" value="<?= e(contenu_get($contenu, 'catalogue_page.title')) ?>">
      <label for="catalogue_intro">Introduction</label>
      <textarea id="catalogue_intro" name="catalogue_intro"><?= e(contenu_get($contenu, 'catalogue_page.intro')) ?></textarea>
    </div>

    <div class="card">
      <h2>Livres du catalogue (<?= $bookCount ?>)</h2>
      <input type="hidden" name="book_count" value="<?= $bookCount ?>">
      <div class="books-wrap">
      <?php for ($i = 0; $i < $bookCount; $i++): ?>
        <?php
          $bookTitle = (string) (($books[$i]['title'] ?? 'Livre ' . ($i + 1)));
          $bookCollection = (string) (($books[$i]['collection'] ?? ''));
        ?>
        <details class="book-accordion" <?= $i === 0 ? 'open' : '' ?>>
          <summary>
            <span>Livre <?= $i + 1 ?> - <?= e($bookTitle) ?></span>
            <span class="book-sub"><?= e($bookCollection) ?></span>
          </summary>
          <div class="book-body">
            <div class="row-2">
              <div>
                <label for="book_<?= $i ?>_collection">Collection</label>
                <input id="book_<?= $i ?>_collection" name="book_<?= $i ?>_collection" value="<?= e((string) (($books[$i]['collection'] ?? ''))) ?>">
              </div>
              <div>
                <label for="book_<?= $i ?>_title">Titre</label>
                <input id="book_<?= $i ?>_title" name="book_<?= $i ?>_title" value="<?= e((string) (($books[$i]['title'] ?? ''))) ?>">
              </div>
            </div>
            <div class="row-2">
              <div>
                <label for="book_<?= $i ?>_authors">Auteurs</label>
                <input id="book_<?= $i ?>_authors" name="book_<?= $i ?>_authors" value="<?= e((string) (($books[$i]['authors'] ?? ''))) ?>">
              </div>
              <div>
                <label for="book_<?= $i ?>_price">Prix</label>
                <input id="book_<?= $i ?>_price" name="book_<?= $i ?>_price" value="<?= e((string) (($books[$i]['price'] ?? ''))) ?>">
              </div>
            </div>
            <label for="book_<?= $i ?>_image">Image principale (ex: images/nikou-champion.png)</label>
            <input id="book_<?= $i ?>_image" name="book_<?= $i ?>_image" value="<?= e((string) (($books[$i]['image'] ?? ''))) ?>">
            <label for="book_<?= $i ?>_image_file">Ou televerser une image principale</label>
            <input id="book_<?= $i ?>_image_file" name="book_<?= $i ?>_image_file" type="file" accept="image/*">
            <label class="checkbox-row" for="book_<?= $i ?>_remove_image">
              <input id="book_<?= $i ?>_remove_image" name="book_<?= $i ?>_remove_image" type="checkbox" value="1">
              Supprimer l'image principale
            </label>

            <label for="book_<?= $i ?>_preview_images">Images apercu (chemins separes par des virgules)</label>
            <input id="book_<?= $i ?>_preview_images" name="book_<?= $i ?>_preview_images" value="<?= e((string) (($books[$i]['preview_images'] ?? ''))) ?>">
            <label for="book_<?= $i ?>_preview_files">Ou televerser jusqu'a 3 images d'apercu</label>
            <input id="book_<?= $i ?>_preview_files" name="book_<?= $i ?>_preview_files[]" type="file" accept="image/*" multiple>
            <label class="checkbox-row" for="book_<?= $i ?>_remove_previews">
              <input id="book_<?= $i ?>_remove_previews" name="book_<?= $i ?>_remove_previews" type="checkbox" value="1">
              Supprimer les images d'apercu
            </label>
            <label class="checkbox-row" for="book_<?= $i ?>_remove_book">
              <input id="book_<?= $i ?>_remove_book" name="book_<?= $i ?>_remove_book" type="checkbox" value="1">
              Supprimer ce livre du catalogue
            </label>
          </div>
        </details>
      <?php endfor; ?>
      </div>
    </div>

    <div class="card">
      <h2>Page Contact</h2>
      <label for="contact_title">Titre de la page</label>
      <input id="contact_title" name="contact_title" value="<?= e(contenu_get($contenu, 'contact_page.title')) ?>">

      <label for="contact_intro">Texte d'introduction</label>
      <textarea id="contact_intro" name="contact_intro"><?= e(contenu_get($contenu, 'contact_page.intro')) ?></textarea>

      <label for="contact_bloc_titre">Titre du bloc de gauche</label>
      <input id="contact_bloc_titre" name="contact_bloc_titre" value="<?= e(contenu_get($contenu, 'contact_page.bloc_titre')) ?>">

      <label for="contact_bloc_texte">Texte du bloc de gauche</label>
      <textarea id="contact_bloc_texte" name="contact_bloc_texte"><?= e(contenu_get($contenu, 'contact_page.bloc_texte')) ?></textarea>

      <label for="contact_adresse_texte">Adresse</label>
      <textarea id="contact_adresse_texte" name="contact_adresse_texte"><?= e(contenu_get($contenu, 'contact_page.adresse_texte')) ?></textarea>

      <label for="contact_telephone">Telephone</label>
      <input id="contact_telephone" name="contact_telephone" value="<?= e(contenu_get($contenu, 'contact_page.telephone')) ?>">
    </div>

    <div class="card">
      <h2>Footer</h2>
      <label for="footer_description">Description</label>
      <textarea id="footer_description" name="footer_description"><?= e(contenu_get($contenu, 'footer.description')) ?></textarea>

      <label for="footer_ville">Ville</label>
      <input id="footer_ville" name="footer_ville" value="<?= e(contenu_get($contenu, 'footer.ville')) ?>">

      <label for="footer_tel">Telephone footer</label>
      <input id="footer_tel" name="footer_tel" value="<?= e(contenu_get($contenu, 'footer.telephone')) ?>">
    </div>

    <div class="actions">
      <button type="submit" class="primary">Enregistrer</button>
      <button type="submit" name="action" value="add_book">Ajouter un livre</button>
      <button type="submit" name="action" value="reset_catalogue" class="danger" onclick="return confirm('Reinitialiser le catalogue aux valeurs par defaut ?');">Reinitialiser catalogue</button>
      <button type="submit" name="action" value="restore_backup" onclick="return confirm('Restaurer la sauvegarde precedente et annuler la derniere modification ?');">Retour arriere (Ctrl+Z)</button>
      <button type="reset">Annuler les changements non enregistres</button>
      <a class="link" href="../index.php" target="_blank" rel="noopener">Voir la page accueil</a>
      <a class="link" href="../a-propos.php" target="_blank" rel="noopener">Voir la page a propos</a>
      <a class="link" href="../catalogue.php" target="_blank" rel="noopener">Voir la page catalogue</a>
      <a class="link" href="../contact.php" target="_blank" rel="noopener">Voir la page contact</a>
      <a class="link" href="logout.php">Se deconnecter</a>
    </div>
  </form>
  </div>
</body>
</html>
