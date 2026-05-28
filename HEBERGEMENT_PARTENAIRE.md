# Hébergement — serveur partenaire (entreprise)

Ce document sert à expliquer rapidement **comment le site est construit** et **comment le déployer** sur le serveur de l’entreprise partenaire.

---

## 1) En une phrase

Le site est un **site HTML/CSS/JS** (front) avec une couche **PHP** (APIs + back-office) et un “CMS léger” basé sur un fichier **`data/contenu.json`** modifié via **`/backoffice/`**.

---

## 2) Ce qui doit être déployé

### Option recommandée : déployer la **racine du dépôt**

Le serveur doit servir la racine du projet (même arborescence que GitHub), notamment :

- pages publiques `*.html` (`index.html`, `catalogue.html`, `livre.html`, etc.)
- `app.js`, `style.css`, `mobile-ux.css`, `mobile-ux.js`
- dossiers `api/`, `includes/`, `backoffice/`, `data/`, `images/`, `locales/`
- `router.php` (utile en local ; pas nécessaire en production si le serveur gère les routes normalement)

### Option “livrable” : `dist_release/` (si généré)

Des scripts existent pour produire un dossier “release” (sans fichiers de dev).  
Mais pour que **le back-office** fonctionne, il faut vérifier que le build inclut bien `backoffice/`, `includes/` et `data/`. Si ce n’est pas inclus, **préférer la racine du dépôt**.

---

## 3) Prérequis serveur

- **PHP 8.1+** (idéal 8.2/8.3)
- Extensions PHP usuelles : `json`, `openssl`
- Si comptes utilisateurs sur PostgreSQL : `pdo_pgsql`
- **HTTPS obligatoire** (paiement, sessions, OAuth)

Serveur web : Apache ou Nginx (les deux conviennent).

---

## 4) Points critiques de fonctionnement (à expliquer au partenaire)

### A) Back-office = écritures disque

Le back-office enregistre les modifications dans :

- `data/contenu.json`
- et un backup automatique `data/contenu.backup.json`

Donc le process PHP (user du serveur web) doit avoir le droit d’écriture sur le dossier `data/` (au minimum sur ces fichiers).

### B) Uploads (images partenaires, etc.)

Des pages du back-office peuvent téléverser des images (ex. partenaires).  
Le serveur doit autoriser l’écriture dans les dossiers d’upload concernés (ex. `images/partners/`).

### C) Secrets / clés API

Les secrets ne sont **pas** dans GitHub. Ils doivent être fournis comme **variables d’environnement** (recommandé) ou via un fichier `.env` sur le serveur (à éviter si possible).

---

## 5) Variables d’environnement à configurer

Minimum en production :

- `SUCRIER_ADMIN_PASSWORD_HASH` (hash bcrypt du mot de passe admin)
- `SUCRIER_BASE_URL` (ex. `https://www.votre-domaine.tld`)
- `SUCRIER_ALLOWED_ORIGINS` (ex. `https://www.votre-domaine.tld,https://votre-domaine.tld`)
- Paiement SumUp :
  - `SUCRIER_SUMUP_API_KEY`
  - `SUCRIER_SUMUP_MERCHANT_CODE`
  - `SUCRIER_WEBHOOK_SECRET` (si webhook activé)
- Contact (SMTP) :
  - `SUCRIER_CONTACT_TO`
  - `SUCRIER_CONTACT_FROM`
  - `SUCRIER_SMTP_HOST`, `SUCRIER_SMTP_PORT`, `SUCRIER_SMTP_USERNAME`, `SUCRIER_SMTP_PASSWORD`, `SUCRIER_SMTP_ENCRYPTION`
- Comptes clients (**PostgreSQL obligatoire en test/prod**) :
  - `SUCRIER_AUTH_DSN` (ex. `pgsql:host=…;port=5432;dbname=…;sslmode=require`)
  - `SUCRIER_AUTH_DB_USER`
  - `SUCRIER_AUTH_DB_PASSWORD`
  - (`SUPABASE_DB_DSN` reste accepté si `SUCRIER_AUTH_DSN` est vide)

Le contenu éditorial reste dans **`data/contenu.json`** (pas en base). Seule la table **`users`** est en PostgreSQL.

Le gabarit complet est dans `.env.example`. Guide détaillé test : **`docs/ENVIRONNEMENT_TEST.md`**.

Après configuration, vérifier : `php scripts/db-check.php` (doit afficher `Driver : pgsql`).

---

## 6) Mot de passe back-office (sécurisé)

Le serveur ne stocke pas le mot de passe en clair : seulement un **hash bcrypt**.

En local, pour (re)générer le hash :

```bash
php scripts/setup_admin_password.php "VotreMotDePasse"
```

En production, coller le hash produit dans la variable :

- `SUCRIER_ADMIN_PASSWORD_HASH`

---

## 7) Comment déployer concrètement (2 scénarios)

### Scénario 1 — le partenaire déploie lui-même (sans accès serveur pour vous)

1. Il clone le dépôt Git dans un dossier du serveur (ou upload une archive du dépôt).
2. Il configure le virtual host pour que le **DocumentRoot** pointe sur la racine du projet.
3. Il vérifie que PHP exécute bien `api/*.php` et `backoffice/*.php`.
4. Il configure les **variables d’environnement**.
5. Il donne les droits d’écriture sur `data/` (et dossiers d’upload).
6. Il teste les URLs :
   - `/` (accueil)
   - `/catalogue.html`
   - `/api/content.php` (doit répondre JSON)
   - `/backoffice/login.php` (connexion admin)

### Scénario 2 — vous avez un accès serveur (SSH / SFTP / panel)

1. Vous déployez la racine du projet (git pull ou upload).
2. Vous créez les variables d’environnement (ou un `.env` sur le serveur si nécessaire).
3. Vous fixez les permissions d’écriture (`data/`, `images/partners/`, etc.).
4. Vous faites les tests ci-dessus, puis validation paiement/contact.

---

## 8) Checklist de validation (après déploiement)

- Base comptes : `php scripts/db-check.php` → **pgsql** (pas SQLite)
- Pages publiques OK (pas d’erreur PHP)
- Back-office :
  - connexion OK
  - modification d’un texte + **Enregistrer** → `data/contenu.json` modifié
- Contact : envoi mail OK
- Paiement : création checkout SumUp OK
- HTTPS OK (cookies secure)

---

## 9) Ce dont j’aurai besoin de la part du partenaire

- URL de production (domaine) et éventuel domaine de staging
- Type de serveur : Apache ou Nginx
- Version PHP
- Méthode pour définir les variables d’environnement
- Accès (au minimum) pour régler :
  - variables d’environnement
  - permissions d’écriture (dossier `data/`)
  - logs d’erreur (`error_log`) en cas de bug

