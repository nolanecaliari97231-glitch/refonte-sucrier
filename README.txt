GUIDE RAPIDE - MODIFIER LE SITE
===============================

1) PAGE CONTACT (sans coder)
- Ouvrir: /admin/login.php
- Mot de passe: voir data/config.php (cle admin_password)
- Modifier les champs, puis cliquer "Enregistrer"
- Dans la section Catalogue, vous pouvez aussi changer:
  collection, titre, auteurs, prix, image principale et images d'apercu.
  Vous pouvez maintenant televerser directement des images depuis l'admin.
  Vous pouvez aussi supprimer les images via les cases a cocher.
  Bouton "Reinitialiser catalogue" pour revenir aux valeurs de base.
  Les livres sont ranges dans des menus deroulants pour garder une interface claire.
  Bouton "Ajouter un livre" pour ajouter une nouvelle fiche.
  Case "Supprimer ce livre du catalogue" dans chaque fiche.
  Bouton "Retour arriere (Ctrl+Z)" pour restaurer la sauvegarde precedente.
  Bouton "Annuler les changements non enregistres" pour revenir a l'etat du formulaire.

2) SI BESOIN: MODIFIER LE CONTENU MANUELLEMENT
- Fichier: data/contenu.json
- Ce fichier contient les textes principaux (contact + footer)

3) CHANGER LE MOT DE PASSE ADMIN
- Fichier: data/config.php
- Changer la valeur de admin_password

4) CHANGER LES IMAGES
- Dossier: images/
- Remplacer les fichiers en gardant les memes noms
- Upload admin: les nouveaux fichiers sont enregistres dans images/uploads/

5) FICHIERS A NE PAS TOUCHER
- style.css
- includes/bootstrap.php
- admin/save.php (sauf si developpeur)

6) URLS IMPORTANTES
- Page accueil dynamique: index.php
- Page a propos dynamique: a-propos.php
- Page catalogue dynamique: catalogue.php
- Page contact dynamique: contact.php
- Connexion admin: admin/login.php

