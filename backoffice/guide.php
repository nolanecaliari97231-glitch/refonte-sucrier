<?php
require __DIR__ . '/init.php';
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= e(sucrier_backoffice_asset('admin.css')) ?>?v=20260528-bo-guide-v2">
  <?= sucrier_favicon_link_tags('../') ?>

  <title>Guide d'utilisation — Back-office Sucrier</title>
</head>
<body>
  <div class="admin-shell">
    <header class="admin-header">
      <h1>Guide d'utilisation</h1>
      <p>Modifier le site public (textes, images, catalogue) sans toucher au code.</p>
      <div class="card-actions">
        <a class="link" href="login.php">Connexion</a>
        <a class="link" href="dashboard.php">Tableau de bord</a>
      </div>
    </header>

    <div class="card">
      <h2>Vue d'ensemble</h2>
      <p>Le back-office enregistre presque tout le contenu éditorial dans <code>data/contenu.json</code> (avec une copie de secours automatique <code>data/contenu.backup.json</code>).</p>
      <ul>
        <li><strong>Modifiable ici</strong> : accueil, catalogue, actualités, à propos, partenaires, auteurs, héros, codes promo, frais postaux, stocks, conseils de lecture…</li>
        <li><strong>Non géré dans ce back-office</strong> : comptes clients (inscription sur <code>espace.html</code> — stockés en base PostgreSQL sur le serveur), paiement SumUp, envoi d'e-mails (paramètres techniques dans <code>.env</code> sur l'hébergeur).</li>
      </ul>
      <p><strong>Pages du menu back-office :</strong></p>
      <ul>
        <li><a href="dashboard.php">Tableau de bord</a> — contenu principal + catalogue</li>
        <li><a href="maison.php">Chapitre 1 · La Maison</a> — page <code>a-propos-maison.html</code></li>
        <li><a href="auteurs.php">Auteurs / Illustrateurs</a> — grille et fiches <code>auteur.html</code></li>
        <li><a href="heros.php">Univers Héros</a> — personnages (Nikou, Exocette…) et <code>heros.html</code></li>
        <li><a href="partenaires.php">Partenaires</a> — logos et textes des pages partenaires</li>
      </ul>
      <p class="admin-hint">Après chaque modification : bouton <strong>Enregistrer</strong> en bas de page. Le site public se met à jour tout de suite (rafraîchir avec Ctrl+F5 ou rechargement forcé sur mobile si l'ancienne version reste affichée).</p>
    </div>

    <div class="card">
      <h2>Connexion au back-office</h2>
      <h3>URL à utiliser (important)</h3>
      <p>Tapez toujours l'adresse complète avec <code>login.php</code>. Le simple dossier <code>/backoffice/</code> peut afficher une erreur « Forbidden ».</p>
      <ul>
        <li><strong>Environnement de test actuel (PlanetHoster)</strong> :<br>
          <code>https://sucrier.sc1scrp972.universe.wf/backoffice/login.php</code></li>
        <li><strong>En local</strong> (serveur PHP sur votre PC) :<br>
          <code>http://localhost:8000/backoffice/login.php</code><br>
          (adapter le port si besoin, ex. <code>:8080</code>)</li>
        <li><strong>Site en production</strong> (domaine définitif) :<br>
          <code>https://www.votre-domaine.tld/backoffice/login.php</code></li>
      </ul>
      <ol>
        <li>Ouvrir l'URL ci-dessus dans le navigateur.</li>
        <li>Saisir le <strong>mot de passe administrateur</strong>.</li>
        <li>Cliquer sur <strong>Se connecter</strong> → tableau de bord.</li>
        <li>Utiliser <strong>Déconnexion</strong> sur un ordinateur partagé.</li>
      </ol>
      <p class="admin-hint">La session expire après une période d'inactivité. En cas de « Trop de tentatives », attendre quelques minutes (protection anti-bruteforce).</p>

      <h3>Stockage du mot de passe (sécurité)</h3>
      <p>Le mot de passe <strong>n'est jamais enregistré en clair</strong>. Seul un <strong>hash bcrypt</strong> est conservé dans :</p>
      <ul>
        <li><code>.env</code> sur le serveur → <code>SUCRIER_ADMIN_PASSWORD_HASH</code></li>
        <li>et/ou <code>data/admin-password.hash</code> en secours (surtout en local)</li>
      </ul>
      <p>Ces fichiers sont <strong>exclus de GitHub</strong>. Sur l'hébergeur, ne mettez que le hash dans les variables d'environnement (ou le fichier <code>.env</code> à la racine du site, non accessible au public).</p>

      <h3>Première installation ou nouveau PC</h3>
      <ol>
        <li>Terminal à la <strong>racine du projet</strong> (dossier avec <code>app.js</code>, <code>data/</code>, <code>backoffice/</code>).</li>
        <li>Exécuter : <code>php scripts/setup_admin_password.php "VotreMotDePasse"</code></li>
        <li>Le script met à jour <code>.env</code> et <code>data/admin-password.hash</code>.</li>
        <li>Se connecter sur <code>/backoffice/login.php</code> avec ce mot de passe.</li>
      </ol>
      <p class="admin-hint">Mot de passe conseillé : 12 caractères minimum, lettres, chiffres et symboles.</p>

      <h3>Changer le mot de passe</h3>
      <p><strong>1. En local</strong> — relancer avec le nouveau mot de passe :</p>
      <p><code>php scripts/setup_admin_password.php "NouveauMotDePasse"</code></p>
      <p><strong>2. Sur le serveur (test ou production)</strong></p>
      <ol>
        <li>Copier le hash affiché par le script (ligne qui commence par <code>$2y$10$...</code>).</li>
        <li>Dans le panneau PlanetHoster (ou autre hébergeur) : mettre à jour <code>SUCRIER_ADMIN_PASSWORD_HASH</code> dans les variables d'environnement, ou dans le fichier <code>.env</code> à la racine du site.</li>
        <li>Ne jamais coller le mot de passe en clair sur le serveur — uniquement le hash.</li>
        <li>Tester la connexion sur <code>/backoffice/login.php</code>.</li>
      </ol>
      <p>Afficher seulement un hash sans écrire les fichiers locaux : <code>php scripts/generate_admin_hash.php "VotreMotDePasse"</code></p>

      <h3>Dépannage connexion</h3>
      <ul>
        <li><strong>403 Forbidden sur /backoffice/</strong> : utiliser <code>/backoffice/login.php</code>.</li>
        <li><strong>Mot de passe invalide</strong> : vérifier majuscules / symboles ; mettre à jour le hash sur le serveur si vous venez de le changer en local.</li>
        <li><strong>Mot de passe non configuré</strong> : exécuter <code>setup_admin_password.php</code> ou définir <code>SUCRIER_ADMIN_PASSWORD_HASH</code> sur l'hébergeur.</li>
        <li><strong>Local : page blanche ou erreur</strong> : lancer <code>php -S localhost:8000 router.php</code> à la racine avant d'ouvrir le back-office.</li>
      </ul>
    </div>

    <div class="card">
      <h2>Page Accueil (tableau de bord)</h2>
      <p>Section <strong>Page Accueil</strong> : textes du bandeau crème (titre, introduction, devise, boutons).</p>
      <ul>
        <li><strong>Image de fond hero (optionnel)</strong> : chemin ou téléversement. Si le champ est vide, le site utilise les visuels par défaut (<code>images/site/home-bg-mobile.webp</code> sur téléphone, <code>home-bg-editions-sucrier-4k.webp</code> sur grand écran). Préférez des images au format paysage, assez larges.</li>
        <li><strong>Image personnage / couverture livre</strong> : visibles surtout sur la version <strong>ordinateur</strong> du hero ; sur mobile le fond jungle est prioritaire.</li>
        <li>Champs <strong>Tag</strong>, <strong>Titre</strong>, textes et liens des deux boutons (principal et secondaire).</li>
      </ul>
    </div>

    <div class="card">
      <h2>Conseils de lecture (accueil)</h2>
      <p>Section <strong>Conseils de lecture</strong> : choisissez le produit « coup de cœur » et jusqu'à quatre livres secondaires affichés sur la page d'accueil. Les produits listés viennent du catalogue.</p>
    </div>

    <div class="card">
      <h2>À propos, auteurs, héros, partenaires</h2>
      <p><strong>Page À propos</strong> (tableau de bord) : textes courts de la page hub <code>a-propos.html</code>.</p>
      <p><strong><a href="maison.php">Chapitre 1 · La Maison</a></strong> : contenu détaillé de <code>a-propos-maison.html</code> (présentation de la maison d'édition).</p>
      <p><strong><a href="auteurs.php">Auteurs / Illustrateurs</a></strong> : biographies, photos, liens vers <code>auteur.html?id=...</code>.</p>
      <p><strong><a href="heros.php">Univers Héros</a></strong> : fiches Nikou, Bébé Nikou, Exocette, etc. et page <code>heros.html</code>.</p>
      <p><strong><a href="partenaires.php">Partenaires</a></strong> : logos (téléversement) et textes d'introduction des pages partenaires.</p>
    </div>

    <div class="card">
      <h2>Catalogue et fiches produit</h2>
      <p><strong>Produits du catalogue</strong> : tous les articles (livres, peluches, stickers, affiches…). Pour chaque produit : titre, auteurs, prix, images, description, rayon, options d'affichage fiche technique.</p>
      <p><strong>Rayons du catalogue</strong> : filtres de la page catalogue (libellés FR/EN, regroupements).</p>
      <p><strong>Stocks du catalogue</strong> : quantité par produit. Vide = stock non suivi (disponible). <strong>0</strong> = rupture (bandeau sur la fiche + blocage panier).</p>
      <p><strong>Pastilles</strong> (dans chaque fiche produit) : Nouveauté, Best-seller, Prix littéraire — affichage sur le catalogue.</p>
      <p><strong>Fiche technique</strong> : masquer ISBN, format, pages, etc. si inutile ; renommer les libellés (ex. peluche : « Dimensions »).</p>
      <p><strong>Fiche pédagogique (PDF)</strong> : réservée aux comptes <strong>professionnel</strong> sur le site lorsqu'un fichier est renseigné.</p>
      <p class="admin-hint"><strong>Réinitialiser le catalogue</strong> : action disponible en bas du tableau de bord — à utiliser avec prudence (restaure les fiches par défaut).</p>
    </div>

    <div class="card">
      <h2>Actualités</h2>
      <p>Section <strong>Page Actualités</strong> : cartes sur <code>actualites.html</code>. Bouton « Ajouter une actualité », puis <strong>Enregistrer</strong>.</p>
    </div>

    <div class="card">
      <h2>Page Contact</h2>
      <p>Section <strong>Page Contact</strong> : titre et textes affichés sur <code>contact.html</code>. L'envoi du formulaire dépend de la configuration SMTP sur le serveur (<code>.env</code>), pas de ce back-office.</p>
    </div>

    <div class="card">
      <h2>Codes promo</h2>
      <p>Section <strong>Codes promo</strong>. Un code n'est actif pour les clients que s'il est coché <strong>Actif</strong> et enregistré.</p>
      <ol>
        <li>« Ajouter un code promo » → code (ex. <code>ETE2026</code>), type (% ou livraison offerte), message panier.</li>
        <li>Cocher <strong>Actif</strong>, puis <strong>Enregistrer</strong>.</li>
        <li>Pour un bandeau sur l'accueil : <strong>Afficher sur la page d'accueil</strong> + texte du bandeau (un seul code mis en avant).</li>
      </ol>
      <p>Le montant payé via SumUp est recalculé côté serveur : le client ne peut pas modifier la remise dans le navigateur.</p>
    </div>

    <div class="card">
      <h2>E-commerce, panier et frais postaux</h2>
      <p>Section <strong>E-commerce et panier</strong> : coordonnées affichées (e-mail / téléphone support), note de livraison, <strong>barème postal</strong>.</p>
      <p>Deux zones (tarifs Colissimo au départ de la Martinique) :</p>
      <ul>
        <li><strong>Caraïbes / USA (départ Martinique)</strong> — zone <code>dom_martinique_near</code></li>
        <li><strong>France métropole et autres pays</strong> — zone <code>dom_international</code></li>
      </ul>
      <p>Le panier calcule les frais selon le <strong>poids total</strong> et le <strong>pays de livraison</strong> choisi par le client.</p>
      <p class="admin-hint"><strong>La Poste</strong> : vérifiez la grille officielle plusieurs fois par an et mettez à jour les montants ici si les tarifs changent.</p>
      <p><strong>Paiement en ligne</strong> : clés SumUp et URL du site dans <code>.env</code> (<code>SUCRIER_SUMUP_API_KEY</code>, <code>SUCRIER_BASE_URL</code>, etc.) — configuration par l'hébergeur ou le développeur, pas dans ce guide éditorial.</p>
    </div>

    <div class="card">
      <h2>Comptes clients (site public)</h2>
      <p>Les visiteurs créent un compte sur <code>espace.html</code> / <code>inscription.html</code> (e-mail ou Google). Les données sont en <strong>PostgreSQL</strong> sur le serveur de test/production.</p>
      <p>Vous <strong>ne gérez pas</strong> la liste des comptes dans ce back-office. En cas de problème de connexion client, vérifier avec l'hébergeur : extension PHP <code>pdo_pgsql</code>, variables <code>SUCRIER_AUTH_DSN</code>, page de diagnostic <code>/api/health.php</code> (environnement de test uniquement).</p>
    </div>

    <div class="card">
      <h2>Retour arrière et sécurité</h2>
      <ul>
        <li><strong>Retour arrière</strong> (bas du tableau de bord) : restaure <code>contenu.json</code> depuis la dernière sauvegarde automatique.</li>
        <li>Ne partagez pas le mot de passe admin (e-mail, chat, capture d'écran).</li>
        <li>Ne commitez jamais <code>.env</code>, mots de passe, clés API ou <code>data/admin-password.hash</code> sur GitHub.</li>
        <li>Après fuite du mot de passe : le changer avec <code>setup_admin_password.php</code> et mettre à jour le hash sur le serveur.</li>
        <li>Documentation technique hébergement (équipe infra) : fichier <code>docs/PLANETHOSTER_SC1SCRP972.md</code> à la racine du dépôt Git.</li>
      </ul>
      <div class="card-actions">
        <a class="link" href="login.php">Retour à la connexion</a>
        <a class="link" href="dashboard.php">Tableau de bord</a>
      </div>
    </div>
  </div>
</body>
</html>
