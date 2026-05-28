-- Schéma PostgreSQL — comptes clients Les Éditions du Sucrier
-- À exécuter une fois sur l'environnement de test / production (psql ou outil hébergeur).

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    password_hash TEXT NULL,
    has_google BOOLEAN NOT NULL DEFAULT FALSE,
    full_name VARCHAR(255) NULL,
    segment VARCHAR(32) NOT NULL DEFAULT 'particulier',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_segment_check CHECK (segment IN ('particulier', 'professionnel'))
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_lower_idx ON users (LOWER(email));

COMMENT ON TABLE users IS 'Comptes inscription / connexion site public (particulier ou professionnel).';
