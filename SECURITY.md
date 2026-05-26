# Politique de sécurité — Les Éditions du Sucrier

Ce document décrit la posture de sécurité appliquée au projet et la marche
à suivre pour signaler une vulnérabilité. Approche : **Zéro Trust côté
serveur**, aucune information sensible exposée côté client.

Pour un **guide détaillé des renforcements récents** (paiement, stock,
promos, throttle) lisible par l’équipe métier : voir
[`SECURITE-RENFORCEMENTS.md`](SECURITE-RENFORCEMENTS.md).

---

## 1. Principes

- Aucun secret en clair dans le dépôt (`.env`, hash admin, clés API).
- Toute donnée provenant du client est traitée comme hostile (whitelisting).
- Toute action sensible est validée et tracée côté serveur.
- Aucune erreur technique n'est renvoyée au client (messages génériques).
- Cookies de session : `HttpOnly`, `Secure` (HTTPS), `SameSite=Strict`.
- HTTPS obligatoire en production (HSTS, redirection 301 côté Apache).
- CSP stricte, X-Frame-Options DENY, X-Content-Type-Options nosniff.

## 2. Mesures techniques en place

| Risque OWASP | Mesure |
|---------------|--------|
| **A01 — Broken Access Control** | `sucrier_require_admin()` vérifie session, fingerprint UA+IP et timeout idle. Téléchargements pédagogiques réservés au segment `professionnel`. |
| **A02 — Cryptographic Failures** | Mots de passe : `password_hash` (bcrypt). Cookies sessions : `Secure` + `HttpOnly` + `SameSite=Strict`. HSTS 2 ans + `preload`. |
| **A03 — Injection** | PDO + requêtes préparées partout (`auth_db.php`). Aucune concaténation SQL utilisateur. |
| **A04 — Insecure Design** | Catalogue serveur autoritatif (prix calculés serveur, qty bornée). Throttle login / contact. Vérification stricte des montants SumUp. |
| **A05 — Security Misconfiguration** | `.htaccess` racine + `backoffice/.htaccess` + `images/uploads/.htaccess`. Désactivation `display_errors` en prod. Suppression `X-Powered-By` / `Server`. |
| **A06 — Vulnerable Components** | Dépendances minimales (PHP natif, Playwright dev uniquement). Voir « 5. Mises à jour » plus bas. |
| **A07 — Identification & Auth Failures** | Throttle (`sucrier_throttle_login_attempts`), `session_regenerate_id(true)` après login. Vérification audience + email_verified sur Google OAuth (`sucrier_auth_verify_google_access_token`). |
| **A08 — Software & Data Integrity** | `contenu.json` modifiable uniquement via backoffice (mot de passe admin hashé + CSRF). Backup automatique avant écriture. |
| **A09 — Security Logging** | `error_log` côté serveur uniquement, jamais renvoyé au client. |
| **A10 — SSRF** | Aucun appel HTTP serveur basé sur URL fournie par l'utilisateur. Les appels sortants sont vers Google + SumUp + BCE (taux de change officiels) uniquement. |

## 3. CSRF — double protection

1. **Token CSRF** sur les formulaires backoffice (`sucrier_get_csrf_token`,
   `sucrier_validate_csrf_from_post`).
2. **Vérification de l'origine** (`sucrier_check_request_origin`) sur toutes
   les APIs JSON mutables : `auth-login`, `auth-register`, `auth-logout`,
   `contact-send`, `set-language`, `create-checkout-session`. Compare
   `Origin` / `Referer` à la liste blanche `SUCRIER_ALLOWED_ORIGINS`.
3. **Cookies `SameSite=Strict`** : empêchent l'envoi du cookie de session
   sur toute requête cross-site.

## 4. Variables d'environnement (jamais committées)

Voir `.env.example`. Aucune valeur sensible ne doit apparaître dans le code.
Sur l'hébergement, configurer ces variables via le panneau d'admin de
l'hébergeur ou via `setenv` côté serveur web (`SetEnv` Apache,
`fastcgi_param` Nginx, ou `ENV` dans Docker).

Variables critiques :

- `SUCRIER_ADMIN_PASSWORD_HASH` — bcrypt du mot de passe back-office.
- `SUCRIER_GOOGLE_CLIENT_ID` — doit être **identique** à `window.SUCRIER_GOOGLE_CLIENT_ID` dans `google-auth-config.js` (vérification d'audience côté serveur). L'ID client OAuth « Web » n'est pas un secret (déjà visible dans le navigateur). En **développement local**, si la variable d'environnement n'est pas définie, PHP relit la même valeur depuis `google-auth-config.js` à la racine du site pour que la connexion Google fonctionne sans `.env`. En **production**, définir tout de même `SUCRIER_GOOGLE_CLIENT_ID` sur l'hébergeur (source de vérité unique, pas de dépendance au fichier JS pour le serveur).
- `SUCRIER_SUMUP_API_KEY`, `SUCRIER_SUMUP_MERCHANT_CODE`,
  `SUCRIER_WEBHOOK_SECRET`.
- `SUPABASE_DB_DSN`, `SUCRIER_AUTH_DB_USER`, `SUCRIER_AUTH_DB_PASSWORD`.
- `SUCRIER_SMTP_*`.
- `SUCRIER_ALLOWED_ORIGINS` — séparé par virgules, URL complète sans
  slash final.

## 5. Mises à jour des dépendances

Le projet n'a quasiment pas de dépendances runtime (PHP standard + clients
HTTP intégrés). Pour Playwright (dev) :

```bash
npm audit
npm outdated
npm update
```

Pour PHP côté serveur, suivez le calendrier de support officiel
[https://www.php.net/supported-versions.php](https://www.php.net/supported-versions.php)
et utilisez une version supportée (8.1 minimum, idéalement 8.2/8.3).

## 6. Couche WAF / DDoS recommandée

Faire pointer le domaine via **Cloudflare** (offre gratuite suffisante) :

- Filtrage des bots et attaques connues.
- Limitation de débit (rate limiting) sur `/api/auth-*` et
  `/backoffice/login.php`.
- TLS automatique + HSTS preload.
- Page de challenge en cas d'attaque DDoS.

## 7. Sauvegardes

- `data/contenu.json` est sauvegardé automatiquement (`contenu.backup.json`)
  avant chaque écriture par le backoffice.
- Prévoir une sauvegarde externe quotidienne du dossier `data/` et de la
  base PostgreSQL/Supabase (export quotidien).

## 8. Signalement d'une vulnérabilité

Adresser un email à `leseditionsdusucrier@gmail.com` avec :

- Description du problème et URL concernée.
- Étapes de reproduction.
- Impact estimé.

Ne **pas** publier publiquement (Issues GitHub) avant correction.
