# refonte-sucrier

Refonte du site Les Editions du Sucrier (stage BUT informatique).

**Documentation d’ensemble (architecture, hébergement) :** voir [`DOCUMENTATION_SITE.md`](DOCUMENTATION_SITE.md) et [`HEBERGEMENT_PARTENAIRE.md`](HEBERGEMENT_PARTENAIRE.md).

**Guides code simplifiés :**
- [`docs/CODE_GUIDE_FRONT.md`](docs/CODE_GUIDE_FRONT.md)
- [`docs/CODE_GUIDE_BACKOFFICE.md`](docs/CODE_GUIDE_BACKOFFICE.md)
- [`docs/CODE_GUIDE_API_INCLUDES.md`](docs/CODE_GUIDE_API_INCLUDES.md)

## Source active (bloc 1)

La source de verite du front est la racine en HTML/JS:

- `index.html`, `catalogue.html`, `livre.html`, `contact.html`, `a-propos.html`, `panier.html`, `compte.html`, etc.
- `app.js`
- `style.css`
- `locales/`

Le switch de langue actif en production front est 100% client-side (`data-fr`/`data-en` + `localStorage`).

## Build deploy-ready

Pour preparer un livrable propre (sans `node_modules/`, sans artefacts de test):

```bash
python3 scripts/build_release.py
```

Le dossier genere est `dist_release/` et contient uniquement la version front active:

- pages HTML publiques
- `app.js` / `style.css`
- `images/` (incluant les versions WebP)
- `locales/`
- `api/`

Pour generer directement une archive livrable:

```bash
python3 scripts/package_release.py
```

Cette commande regenere `dist_release/` puis cree `dist_release.zip`.

## Security checklist (production)

- Definir ces variables d'environnement cote serveur:
  - `SUCRIER_ADMIN_PASSWORD_HASH`
  - `SUCRIER_SUMUP_API_KEY`
  - `SUCRIER_SUMUP_MERCHANT_CODE`
  - `SUCRIER_BASE_URL`
  - `SUCRIER_WEBHOOK_SECRET`
  - `SUPABASE_DB_DSN` (ou `SUPABASE_DB_URL`) pour stocker les comptes users dans PostgreSQL/Supabase
  - `SUCRIER_CONTACT_TO` pour l'email de reception du formulaire contact (defaut : `leseditionsdusucrier@gmail.com`, ou `ecommerce.support_email` dans `data/contenu.json`)
  - `SUCRIER_CONTACT_FROM` pour l'email expediteur technique (no-reply)
  - `SUCRIER_SMTP_HOST` / `SUCRIER_SMTP_PORT` / `SUCRIER_SMTP_USERNAME` / `SUCRIER_SMTP_PASSWORD`
  - `SUCRIER_SMTP_ENCRYPTION` (`tls`, `ssl` ou `none`)
- Generer un hash admin fort:

```bash
php scripts/generate_admin_hash.php "mot-de-passe-tres-fort"
```

- Verifier que `data/` et `includes/` ne sont pas accessibles publiquement.
- Utiliser HTTPS uniquement en production.
