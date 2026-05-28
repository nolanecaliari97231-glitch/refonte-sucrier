# Environnement de test — base PostgreSQL

Ce guide est destiné à la personne qui prépare le **serveur de test** (hébergeur / partenaire infra).

## Ce qui va en PostgreSQL

| Donnée | Stockage |
|--------|----------|
| Comptes clients (inscription, connexion, Google) | **PostgreSQL** (`users`) |
| Contenu du site (livres, textes, partenaires…) | Fichier **`data/contenu.json`** (pas en BDD) |
| Panier | Navigateur (`localStorage`) |

## Prérequis serveur

- PHP **8.1+** avec extension **`pdo_pgsql`**
- PostgreSQL **13+** (ou service managé type Supabase)
- HTTPS sur l’URL de test

## Variables d’environnement (test)

Copier `.env.example` vers `.env` sur le serveur (ou définir les variables dans le panel hébergeur) :

```env
SUCRIER_BASE_URL=https://test.votre-domaine.tld
SUCRIER_ALLOWED_ORIGINS=https://test.votre-domaine.tld

# Connexion PostgreSQL (recommandé : SUCRIER_AUTH_DSN)
SUCRIER_AUTH_DSN=pgsql:host=HOST;port=5432;dbname=NOM_BDD;sslmode=require
SUCRIER_AUTH_DB_USER=utilisateur
SUCRIER_AUTH_DB_PASSWORD=mot_de_passe

# Alternative legacy (même effet si SUCRIER_AUTH_DSN est vide)
# SUPABASE_DB_DSN=pgsql:host=...
```

Sans `SUCRIER_AUTH_DSN` ni `SUPABASE_DB_DSN`, le site utilise **SQLite** (`data/auth.sqlite`) — pratique en local uniquement, **pas pour le test public**.

## Création du schéma

**Option A — automatique** : au premier appel API compte (`auth-register`, `auth-login`, etc.), PHP crée la table `users` si elle n’existe pas.

**Option B — manuelle** (recommandée si l’hébergeur impose un compte SQL limité) :

```bash
psql "$DATABASE_URL" -f database/schema.postgresql.sql
```

## Vérifier la connexion

Sur le serveur, à la racine du projet :

```bash
php scripts/db-check.php
```

Sortie attendue :

```text
OK — connexion base de données
Driver      : pgsql
DSN (masqué): pgsql:host=...
Utilisateurs: 0
```

## Droits disque (indépendants de PostgreSQL)

Le processus PHP doit pouvoir **écrire** dans :

- `data/` (`contenu.json`, backups)
- dossiers d’upload images (ex. `images/partners/`)

## Migration depuis un SQLite local (optionnel)

Si des comptes ont été créés en développement local :

1. Configurer `.env` sur la machine de dev avec le DSN PostgreSQL de test.
2. Exécuter : `php scripts/db-migrate-sqlite-to-postgresql.php`

## Checklist après mise en ligne test

- [ ] `php scripts/db-check.php` → driver `pgsql`
- [ ] Inscription + connexion sur `/espace.html`
- [ ] Back-office : login + modification contenu → `data/contenu.json` mis à jour
- [ ] `SUCRIER_BASE_URL` correspond à l’URL réelle (paiement SumUp, liens de retour)

Voir aussi `HEBERGEMENT_PARTENAIRE.md` pour le déploiement complet.
