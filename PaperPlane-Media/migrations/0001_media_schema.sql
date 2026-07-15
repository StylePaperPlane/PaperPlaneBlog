CREATE SCHEMA IF NOT EXISTS media;

CREATE TABLE IF NOT EXISTS media.assets (
    asset_id UUID PRIMARY KEY,
    cipher_sha256 CHAR(64) NOT NULL UNIQUE,
    plaintext_size BIGINT NOT NULL CHECK (plaintext_size >= 0),
    chunk_size INTEGER NOT NULL CHECK (chunk_size > 0),
    chunk_count INTEGER NOT NULL CHECK (chunk_count >= 0),
    nonce_prefix BYTEA NOT NULL CHECK (octet_length(nonce_prefix) = 8),
    encrypted_key BYTEA NOT NULL,
    key_nonce BYTEA NOT NULL CHECK (octet_length(key_nonce) = 12),
    master_key_version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS media.tracks_music_key_seq;

CREATE TABLE IF NOT EXISTS media.tracks (
    music_key BIGINT PRIMARY KEY DEFAULT nextval('media.tracks_music_key_seq'),
    asset_id UUID NOT NULL UNIQUE REFERENCES media.assets(asset_id),
    title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
    artist TEXT NOT NULL CHECK (length(artist) BETWEEN 1 AND 200),
    cover_path TEXT,
    lyric_path TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

SELECT setval('media.tracks_music_key_seq', COALESCE((SELECT max(music_key) FROM media.tracks), 0) + 1, false);

CREATE TABLE IF NOT EXISTS media.playback_sessions (
    session_hash BYTEA PRIMARY KEY,
    fingerprint_hash BYTEA NOT NULL,
    public_jwk JSONB NOT NULL,
    public_key_thumbprint BYTEA NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS playback_sessions_expires_idx ON media.playback_sessions (expires_at);
