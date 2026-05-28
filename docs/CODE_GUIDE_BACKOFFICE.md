# Guide Simple - Backoffice

Ce guide resume comment le backoffice est organise.

## Fichiers principaux

- `backoffice/dashboard.php`: ecran principal d'edition.
- `backoffice/save.php`: sauvegarde centrale vers `data/contenu.json`.
- `backoffice/maison.php`: edition du chapitre 1 "La Maison".
- `backoffice/auteurs.php`: edition du chapitre 2 (auteurs/illustrateurs).
- `backoffice/partenaires.php`: edition du chapitre 3 (partenaires).
- `backoffice/heros.php`: edition de l'univers heros.

## Securite

- `sucrier_require_admin()` protege les ecrans.
- `sucrier_validate_csrf_from_post()` protege les formulaires.

## Sauvegarde

`save.php`:

1. verifie POST + CSRF,
2. lit `contenu.json`,
3. applique les champs envoyes (accueil, catalogue, etc.),
4. gere uploads image/fichiers,
5. ecrit `data/contenu.json` (avec backup).

## Stock

- Source unique: table "Stocks du catalogue" dans le dashboard.
- Sauvegarde dans `catalog_stock`.
- `0` => rupture.
- champ vide => stock non suivi.

## Chapitres A propos

- Chapitre 1: `maison.php` (contenu de `about_house_page`).
- Chapitre 2: `auteurs.php` (fichier `data/authors.json`).
- Chapitre 3: `partenaires.php` (fichier `data/partners.json`).

## Bonnes pratiques pour l'equipe

- Modifier via backoffice (pas directement les JSON).
- Toujours verifier en front apres enregistrement.
- En cas de doute, sauvegarder/exporter les JSON avant gros changements.
- Verifier periodiquement les tarifs officiels La Poste et mettre a jour le bareme postal dans la section e-commerce du backoffice.

## Frais postaux (editable)

- Le dashboard permet d'editer `ecommerce.postal_rates` par zone (`dom_martinique_near`, `dom_international`) — tarifs Colissimo au depart du siege (Martinique).
- `save.php` enregistre ces valeurs dans `data/contenu.json`.
- Le front et l'API checkout utilisent ensuite ce bareme pour le calcul des frais au poids.
