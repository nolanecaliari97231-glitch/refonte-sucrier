<?php
require __DIR__ . '/init.php';
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= e(sucrier_backoffice_asset('admin.css')) ?>?v=20260526-bo-guide">
  <title>Guide d'utilisation — Back-office Sucrier</title>
</head>
<body>
  <div class="admin-shell">
    <header class="admin-header">
      <h1>Guide d'utilisation</h1>
      <p>Pour modifier le site public sans toucher au code.</p>
    </header>

    <div class="card">
      <h2>Connexion au back-office</h2>
      <h3>Usage quotidien (où taper le mot de passe)</h3>
      <p>Vous vous connectez <strong>uniquement dans le navigateur</strong>, sur la page de connexion — pas dans un fichier, pas dans le terminal :</p>
      <ul>
        <li><strong>En local</strong> (serveur PHP sur votre PC) :<br>
          <code>http://localhost:8000/backoffice/login.php</code><br>
          (adapter le port si vous utilisez un autre, ex. <code>:8080</code>)</li>
        <li><strong>En ligne</strong> (site hébergé) :<br>
          <code>https://www.votre-domaine.tld/backoffice/login.php</code></li>
      </ul>
      <ol>
        <li>Ouvrir cette URL (espace séparé du site public).</li>
        <li>Saisir le <strong>mot de passe administrateur</strong> dans le champ prévu.</li>
        <li>Cliquer sur <strong>Se connecter</strong> → vous arrivez sur le tableau de bord.</li>
        <li>Après chaque modification du contenu, cliquer sur <strong>Enregistrer</strong> en bas de page.</li>
      </ol>
      <p class="admin-hint">La session expire après une période d'inactivité : reconnectez-vous si demandé. Utilisez <strong>Déconnexion</strong> sur un ordinateur partagé.</p>

      <h3>Comment le mot de passe est stocké (sécurité)</h3>
      <p>Le mot de passe <strong>n'est jamais enregistré en clair</strong> sur le serveur. Seul un <strong>hash bcrypt</strong> (chaîne illisible) est conservé, dans :</p>
      <ul>
        <li>le fichier <code>.env</code> → variable <code>SUCRIER_ADMIN_PASSWORD_HASH</code></li>
        <li>et/ou le fichier <code>data/admin-password.hash</code> (secours en local)</li>
      </ul>
      <p>Ces fichiers sont <strong>exclus de Git</strong> : ils ne doivent pas être envoyés sur GitHub. Sur l'hébergeur, seule la variable d'environnement compte en production.</p>

      <h3>Première installation ou nouveau PC</h3>
      <p>Si la connexion affiche « mot de passe non configuré » ou si vous clonez le projet sur un autre ordinateur, il faut <strong>enregistrer le hash une fois</strong> via le terminal (pas sur la page web) :</p>
      <ol>
        <li>Ouvrir un terminal dans le <strong>dossier racine du projet</strong> (là où se trouvent <code>app.js</code>, <code>data/</code>, <code>backoffice/</code>).</li>
        <li>Exécuter (remplacer par votre mot de passe, entre guillemets) :<br>
          <code>php scripts/setup_admin_password.php "VotreMotDePasse"</code></li>
        <li>Le script met à jour <code>.env</code> et <code>data/admin-password.hash</code>.</li>
        <li>Se connecter ensuite sur <code>/backoffice/login.php</code> avec ce même mot de passe.</li>
      </ol>
      <p class="admin-hint">Mot de passe conseillé : au moins 12 caractères, lettres, chiffres et symboles. Le script refuse les mots de passe trop courts.</p>

      <h3>Changer le mot de passe plus tard</h3>
      <p><strong>Étape 1 — En local (votre PC)</strong></p>
      <ol>
        <li>À la racine du projet, lancer la même commande avec le <strong>nouveau</strong> mot de passe :<br>
          <code>php scripts/setup_admin_password.php "NouveauMotDePasse"</code></li>
        <li>Vérifier la connexion sur <code>/backoffice/login.php</code> avec le nouveau mot de passe.</li>
      </ol>
      <p><strong>Étape 2 — En production (site en ligne)</strong></p>
      <ol>
        <li>Relancer la commande ci-dessus en local : le terminal affiche une ligne de hash (commence par <code>$2y$10$...</code>).</li>
        <li>Sur Hostinger (ou autre hébergeur) : panneau → <strong>Variables d'environnement</strong> (ou fichier <code>.env</code> sur le serveur).</li>
        <li>Mettre à jour <code>SUCRIER_ADMIN_PASSWORD_HASH</code> avec <strong>cette nouvelle valeur de hash</strong> (coller toute la ligne, sans guillemets autour du hash si l'interface l'ajoute déjà).</li>
        <li>Enregistrer et, si l'hébergeur le demande, <strong>redémarrer</strong> PHP / l'application.</li>
        <li>Tester <code>https://www.votre-domaine.tld/backoffice/login.php</code> avec le <strong>nouveau</strong> mot de passe.</li>
      </ol>
      <p class="admin-hint">Sur l'hébergeur, ne mettez jamais le mot de passe en clair : uniquement le <strong>hash</strong> dans <code>SUCRIER_ADMIN_PASSWORD_HASH</code>. Le mot de passe en clair ne sert que dans la commande <code>setup_admin_password.php</code> sur votre machine.</p>

      <h3>Commande utile (afficher seulement le hash)</h3>
      <p>Si vous avez déjà un hash et voulez seulement l'afficher pour le copier en production :</p>
      <p><code>php scripts/generate_admin_hash.php "VotreMotDePasse"</code></p>
      <p>Puis copier la ligne affichée dans <code>SUCRIER_ADMIN_PASSWORD_HASH</code>. Pour enregistrer automatiquement en local, préférez <code>setup_admin_password.php</code>.</p>

      <h3>Dépannage connexion</h3>
      <ul>
        <li><strong>« Mot de passe invalide »</strong> : vérifiez les majuscules / symboles ; si vous venez de changer le mot de passe, relancez le script setup en local et mettez à jour le hash sur l'hébergeur.</li>
        <li><strong>« Mot de passe non configuré »</strong> : exécutez <code>php scripts/setup_admin_password.php "..."</code> en local, ou définissez <code>SUCRIER_ADMIN_PASSWORD_HASH</code> en production.</li>
        <li><strong>« Trop de tentatives »</strong> : attendez quelques minutes (protection anti-bruteforce), puis réessayez.</li>
        <li><strong>Local : serveur non démarré</strong> : lancer par exemple <code>php -S localhost:8000 router.php</code> à la racine du projet avant d'ouvrir <code>/backoffice/login.php</code>.</li>
      </ul>
    </div>

    <div class="card">
      <h2>Accueil et visuels</h2>
      <p>Section « Page Accueil » : textes, boutons, image Nikou, couverture du livre, fond optionnel. Vous pouvez téléverser une image ou indiquer un chemin du type <code>images/mon-fichier.webp</code>.</p>
    </div>

    <div class="card">
      <h2>Auteurs et héros</h2>
      <p><strong><a href="auteurs.php">Auteurs / Illustrateurs</a></strong> : fiches biographiques, grille et pages <code>auteur.html</code>.</p>
      <p><strong><a href="heros.php">Univers Héros</a></strong> : personnages (Nikou, Exocette…), accueil et page <code>heros.html</code>.</p>
      <p><strong><a href="partenaires.php">Partenaires</a></strong> : logos et textes des sections partenaires.</p>
    </div>

    <div class="card">
      <h2>Catalogue et fiches produit</h2>
      <p>Tous les produits du site (livres, peluches, stickers, posters…) sont listés dans <strong>Produits du catalogue</strong>. Vous pouvez les modifier comme un livre : titre, auteurs, prix, images, description, rayon, stock.</p>
      <p><strong>Pastilles catalogue</strong> : cochez Nouveauté, Best-seller ou Prix littéraire sur les produits de votre choix (affichage sur la page catalogue uniquement).</p>
      <p><strong>Fiche technique</strong> : masquez ISBN, format, pages, date ou langues si un produit n’a pas besoin de ces infos. Vous pouvez aussi <strong>renommer les libellés</strong> (ex. peluche : « Dimensions » et « Présentation » au lieu de « Format » et « Nombre de pages »).</p>
      <p>La <strong>fiche pédagogique</strong> (PDF) reste réservée aux comptes « professionnel » lorsqu’elle est renseignée.</p>
    </div>

    <div class="card">
      <h2>Actualités</h2>
      <p>Section « Page Actualités » : cartes affichées sur <code>actualites.html</code>. Bouton « Ajouter une actualité » puis enregistrer.</p>
    </div>

    <div class="card">
      <h2>Codes promo</h2>
      <p>Section « Codes promo » du tableau de bord. Tant qu'aucun code n'est coché <strong>Actif</strong> et enregistré, aucun client ne peut en bénéficier.</p>
      <ol>
        <li>« Ajouter un code promo » → saisir le code (ex. <code>ETE2026</code>), le type (% ou livraison offerte), le message panier.</li>
        <li>Cocher <strong>Actif</strong>, puis <strong>Enregistrer</strong>.</li>
        <li>Pour l'afficher sur l'accueil : cocher <strong>Afficher sur la page d'accueil</strong> et remplir le texte du bandeau (un seul code mis en avant à la fois).</li>
      </ol>
      <p>Le montant payé via SumUp est toujours recalculé côté serveur : le client ne peut pas tricher sur la remise.</p>
    </div>

    <div class="card">
      <h2>Sécurité</h2>
      <ul>
        <li>Ne partagez pas le mot de passe administrateur (ni par e-mail, ni dans un chat).</li>
        <li>Ne commitez jamais <code>.env</code>, <code>data/admin-password.hash</code> ni un mot de passe en clair sur Git.</li>
        <li>Après une fuite ou un partage accidentel du mot de passe : changez-le immédiatement avec <code>setup_admin_password.php</code> et mettez à jour le hash en production.</li>
        <li>« Retour arrière » (tableau de bord) restaure la version précédente du contenu.</li>
        <li>Le site public se met à jour dès l'enregistrement (rafraîchir la page visiteur avec Ctrl+F5 si besoin).</li>
      </ul>
      <div class="card-actions">
        <a class="link" href="login.php">Retour à la connexion</a>
        <a class="link" href="dashboard.php">Tableau de bord</a>
      </div>
    </div>
  </div>
</body>
</html>
