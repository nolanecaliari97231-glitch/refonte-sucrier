# Guide Simple - API et Includes

Ce guide explique les briques serveur reutilisables.

## Dossier `api/`

- `api/content.php`: endpoint principal pour le front.
  - lit `data/contenu.json`,
  - applique les transformations publiques,
  - renvoie le JSON utilise par `app.js`.
- `api/create-checkout-session.php`, `api/sumup-checkout-status.php`: paiement.
- `api/auth-*.php`: authentification utilisateur.
- `api/contact-send.php`: envoi du formulaire de contact.

## Dossier `includes/`

- `content-public.php`:
  - filtre les donnees publiques,
  - expose `products_out_of_stock` sans exposer les quantites detaillees.
- `catalog-products.php`:
  - registre produit,
  - normalisation de `catalog_stock`,
  - verification serveur des quantites commandables.
- `content-admin.php`:
  - utilitaires backoffice (chemins, uploads, sauvegarde JSON).
- `security.php`, `env.php`, `mailer.php`:
  - securite HTTP,
  - variables d'environnement,
  - envoi email.

## Pourquoi cette separation

- `api/` = points d'entree HTTP.
- `includes/` = logique reutilisable et testable.
- Avantage: eviter de dupliquer les regles metier.

## Regles metier stock (serveur)

- Stock suivi dans `catalog_stock` (map `id -> qty`).
- Si `qty <= 0`:
  - produit considere en rupture,
  - achat bloque cote serveur (controle final).
- Si id absent de `catalog_stock`:
  - stock non suivi,
  - achat autorise.
