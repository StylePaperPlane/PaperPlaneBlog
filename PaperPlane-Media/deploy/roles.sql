-- Run once as the PostgreSQL owner. Runtime credentials are supplied separately.
CREATE SCHEMA IF NOT EXISTS media;
DO $$ BEGIN
    CREATE ROLE paperplane_media LOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT USAGE ON SCHEMA media TO paperplane_media;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA media TO paperplane_media;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA media TO paperplane_media;
ALTER DEFAULT PRIVILEGES IN SCHEMA media GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO paperplane_media;
ALTER DEFAULT PRIVILEGES IN SCHEMA media GRANT USAGE, SELECT ON SEQUENCES TO paperplane_media;
