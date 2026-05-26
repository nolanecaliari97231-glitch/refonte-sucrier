# Documentation du site — Les Éditions du Sucrier

Document de synthèse pour la préparation d’un hébergement avec un partenaire (entreprise voisine) et pour un rapport de stage. Dernière mise à jour : mai 2026.

---

## 1. En une phrase

**Site vitrine + e-commerce léger** pour Les Éditions du Sucrier : pages **HTML** servies avec **PHP** pour les APIs (contenu, comptes, panier / SumUp, contact, téléchargements). Le front repose sur **HTML**, **CSS** et **`app.js`** ; la langue et une partie des textes passent aussi par **`locales/`** et les attributs **`data-fr` / `data-en`**.

---

## 2. Parcours « de A à Z » (qui fait quoi)

| Étape | Mécanisme |
|--------|------------|
| **Visiteur ouvre une page** | Le serveur envoie un fichier **`.html`** (`index.html`, `catalogue.html`, etc.). |
| **Catalogue, prix, textes du site** | Le navigateur exécute **`app.js`**, qui appelle **`api/content.php`**. PHP lit **`data/contenu.json`**, enrichit les chemins (images catalogue, fiches pédagogiques disponibles), renvoie du **JSON**. Le JS met à jour la page. |
| **Langue FR / EN** | Côté client : **`data-fr` / `data-en`**, **`localStorage`**, fichiers **`locales/fr.json`** et **`locales/en.json`**. |
| **Compte client** | **`app.js`** → **`api/auth-session.php`**, **`auth-login.php`**, **`auth-register.php`**, **`auth-logout.php`**. Les comptes peuvent être stockés dans **PostgreSQL (ex. Supabase)** selon la configuration (`includes/auth_db.php`, variables d’environnement). |
| **Connexion Google** | Configuration **`google-auth-config.js`** ; flux OAuth côté navigateur puis enregistrement / login via les mêmes endpoints d’auth. |
| **Panier** | Données dans **`localStorage`** (géré dans `app.js`). |
| **Paiement** | **`api/create-checkout-session.php`** (SumUp) ; suivi via **`api/sumup-checkout-status.php`** et **`api/sumup-webhook.php`**. |
| **Formulaire contact** | **`app.js`** → **`api/contact-send.php`** → envoi e-mail (SMTP). Fichier local optionnel **`data/contact-mail-config.php`** (non versionné ; voir **`data/contact-mail-config.php.example`**). |
| **Fiches pédagogiques (PDF)** | **`api/pedagogical-download.php`** ; fichiers sous **`data/pedagogical/`** ; inventaire côté serveur via **`includes/pedagogical-sheets.php`**. |
| **Édition des contenus (éditeur / admin)** | **`backoffice/`** : authentification par mot de passe (hash dans **`data/config.php`** ou variable **`SUCRIER_ADMIN_PASSWORD_HASH`**), sauvegarde via **`backoffice/save.php`** dans **`data/contenu.json`**. Le dossier **`admin/`** redirige vers le backoffice (héritage). |

**Synthèse** : coquille **HTML**, logique front **JavaScript**, **PHP** comme couche d’accès aux données, fichiers, mail, paiement et base utilisateurs.

---

## 3. Structure des dossiers (racine `refonte-sucrier-main`)

| Élément | Rôle |
|---------|------|
| **`*.html`** | Pages publiques : accueil, catalogue, fiche livre, contact, à propos, panier, compte, checkout, etc. |
| **`app.js`** | Application front : contenu, catalogue, filtres, panier, auth, contact, checkout, i18n, modales, etc. |
| **`style.css`** | Feuille de style unique du site actif. |
| **`images/`** | Visuels : couvertures, bannières, logos partenaires, etc. |
| **`locales/`** | `fr.json`, `en.json` — chaînes d’interface. |
| **`data/contenu.json`** | **Source de vérité éditoriale** : livres, textes, actualités, e-mails affichés, groupes de filtres catalogue, etc. |
| **`data/config.php`** | Configuration PHP (nom du site, hash admin ; peut lire l’environnement). |
| **`data/contact-mail-config.php`** | SMTP réel (gitignoré en prod locale typique). |
| **`api/`** | Endpoints : `content.php`, `contact-send.php`, auth, SumUp, `pedagogical-download.php`, `exchange-rates.php`, etc. |
| **`includes/`** | PHP partagé : sécurité, sessions, catalogue, mailer, fiches pédago, bootstrap backoffice. |
| **`backoffice/`** | Petit CMS : édition de `contenu.json`. |
| **`router.php`** | Routeur pour **`php -S`** en développement (`npm run dev`). |
| **`package.json`** | Scripts npm ; **`npm run dev`** lance PHP + routeur sur le port 8000. |
| **`scripts/`** | Build release, hash admin, utilitaires. |
| **`HEBERGEMENT_PARTENAIRE.md`** | Déploiement générique (serveur partenaire) : prérequis, variables, droits d’écriture, sauvegardes, tests. |
| **`dist_release/`** (généré) | Dossier produit par **`scripts/build_release.py`** : sous-ensemble de pages + `api` + assets. Pour un site **complet** (toutes les pages HTML, backoffice, `data/`, `includes/`), déployer plutôt la **racine du projet** ou étendre le script de build. |

---

## 4. Technologies

| Couche | Techno |
|--------|--------|
| Présentation | HTML5, CSS, JavaScript (sans framework SPA imposé sur le public). |
| Serveur | **PHP** (sessions, en-têtes sécurité, fichiers, HTTP sortant). |
| Données site | **JSON** (`contenu.json`). |
| Comptes | PostgreSQL / Supabase possible (DSN en variable d’environnement). |
| Paiement | **SumUp** (clé API, code marchand, URL de base, secret webhook). |
| E-mail | **SMTP** (ex. Gmail avec mot de passe d’application). |

---

## 5. Développement local

```bash
cd refonte-sucrier-main
npm run dev
```

→ [http://localhost:8000](http://localhost:8000) avec **`router.php`** (URLs sans `.html` pour les pages prévues).

Backoffice en local (port séparé) :

```bash
npm run dev:backoffice
```

---

## 6. Checklist — discussion avec l’hébergeur

1. **Version PHP** (idéalement 8.1+) et extensions : **json**, **openssl**, **pdo_pgsql** si Supabase, etc.
2. **HTTPS** obligatoire (paiement, cookies, OAuth).
3. **Racine web** : même arborescence que le dépôt (au minimum `index.html`, `api/`, `data/`, `includes/` au bon niveau), sauf réorganisation documentée.
4. **Protection** : ne pas exposer en listing public des répertoires sensibles ; limiter l’accès HTTP aux seuls fichiers nécessaires si la plateforme le permet.
5. **Droits d’écriture** : utilisateur du serveur web doit pouvoir **modifier** `data/contenu.json` si le backoffice est utilisé en production ; prévoir **sauvegardes**.
6. **Variables d’environnement** : reprendre **`README.md`** (section Security checklist) et **`HEBERGEMENT_PARTENAIRE.md`**.
7. **Webhook SumUp** : URL publique stable vers `api/sumup-webhook.php` (ou chemin équivalent).
8. **Sauvegardes** : `contenu.json`, médias, PDF pédagogiques, éventuels journaux de commandes / outbox selon activation.

---

## 7. Pistes pour un rapport de stage

- Contexte : refonte d’un site éditeur (vitrine, vente, ressources pédagogiques).
- Choix d’architecture : pages statiques + JS + PHP « fine API » + JSON comme CMS léger.
- Réalisations : catalogue dynamique, filtres, fiches livres, contact, paiement, comptes, backoffice, pages institutionnelles.
- Sécurité : sessions, en-têtes, secrets hors dépôt, hash admin.
- Déploiement : checklist, tests de régression, HTTPS.
- Limites / perspectives : aligner `build_release.py` sur toutes les pages HTML ; évolution vers un CMS plus lourd si le JSON devient trop complexe.

---

## 8. Sécurité (résumé)

Approche **Zéro Trust** côté serveur :

- **Secrets** : jamais commités. Voir `.env.example` (gabarit) et `SECURITY.md`.
- **En-têtes** : CSP, HSTS preload, X-Frame-Options DENY, COOP/CORP, Permissions-Policy.
- **Cookies session** : `HttpOnly` + `Secure` + `SameSite=Strict`.
- **CSRF** : double protection (token + vérification d'`Origin`/`Referer`).
- **Auth** : bcrypt, throttling, `session_regenerate_id(true)`, fingerprint UA+IP pour l'admin.
- **Google OAuth** : audience (`aud`) et `email_verified` vérifiés côté serveur.
- **Uploads** : MIME whitelist, taille max, nom aléatoire, exécution PHP désactivée dans `images/uploads/`.
- **Erreurs** : `display_errors=0` en prod, messages génériques côté client, détails via `error_log`.
- **WAF** : Cloudflare recommandé en frontal.

Détail complet : [`SECURITY.md`](SECURITY.md).

## 9. Références dans ce dépôt

- **`README.md`** — source de vérité du front, build `dist_release`, variables d’environnement.
- **`HEBERGEMENT_PARTENAIRE.md`** — mise en ligne (serveur partenaire / entreprise).
- **`SECURITY.md`** — politique de sécurité détaillée.
- **`.env.example`** — gabarit des variables d'environnement.

Pour toute évolution de ce document, le mettre à jour en même temps que les changements majeurs d’architecture.
