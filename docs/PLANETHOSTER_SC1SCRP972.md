# Hébergement test — sucrier.sc1scrp972.universe.wf

Configuration PlanetHoster (mutualisé) pour ce projet.

## URLs

| Service | Valeur |
|---------|--------|
| Site | https://sucrier.sc1scrp972.universe.wf |
| FTP | `ftp.sc1scrp972.universe.wf` port **21** (FTPS explicite si proposé par le client) |

## Base PostgreSQL (comptes clients)

| Paramètre | Valeur |
|-----------|--------|
| Hôte (depuis PHP **sur le serveur**) | `127.0.0.1` (éviter `localhost` — IPv6) |
| Port | `5432` |
| Base | `sc1scrp972_editionsdusucrier` |
| Utilisateur | `sc1scrp972_uv2_edition` |
| Mot de passe | *(voir `deploy/env.planethoster`, non versionné)* |

Variables dans `.env` sur le serveur :

```env
SUCRIER_AUTH_DSN=pgsql:host=127.0.0.1;port=5432;dbname=sc1scrp972_editionsdusucrier
SUCRIER_AUTH_DB_USER=sc1scrp972_uv2_edition
SUCRIER_AUTH_DB_PASSWORD="..."
```

Le contenu du site reste dans **`data/contenu.json`** (écriture disque requise).

## Fichiers de déploiement (local, gitignorés)

- `deploy/env.planethoster` → à envoyer sur le serveur sous le nom **`.env`**
- `deploy/ftp.credentials.json` → identifiants FTP (ne pas committer)

## Déployer par FTP (Windows)

```powershell
cd "chemin\vers\refonte-sucrier-26"
powershell -ExecutionPolicy Bypass -File scripts/deploy-planethoster.ps1 -DryRun
powershell -ExecutionPolicy Bypass -File scripts/deploy-planethoster.ps1
```

Alternative : FileZilla / client FTP avec les identifiants fournis par l’hébergeur, envoyer **toute la racine du dépôt** (sauf `.git`, `node_modules`) + renommer `deploy/env.planethoster` en `.env` à la racine web.

## Après upload

1. **PHP** : activer `pdo_pgsql` et `pgsql` dans le sélecteur de version PHP (cPanel PlanetHoster).
2. **Schéma** : la table `users` est créée au premier login/inscription, ou exécuter `database/schema.postgresql.sql` via phpPgAdmin.
3. **Vérification** (SSH ou terminal cPanel, à la racine du site) :
   ```bash
   php scripts/db-check.php
   ```
   → doit afficher `Driver : pgsql`.
4. **Admin** : sur le serveur, générer le hash :
   ```bash
   php scripts/setup_admin_password.php "VotreMotDePasseAdmin"
   ```
5. **Droits** : le dossier `data/` doit être inscriptible par PHP.
6. Compléter dans `.env` : SumUp, SMTP, `SUCRIER_ADMIN_PASSWORD_HASH` si pas fait à l’étape 4.

## Sécurité

Les mots de passe fournis par l’hébergeur ne doivent **jamais** être commités sur GitHub. En cas d’exposition (chat, mail), demander une rotation des mots de passe FTP et base.
