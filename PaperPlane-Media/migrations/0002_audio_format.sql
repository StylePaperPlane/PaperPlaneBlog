ALTER TABLE media.tracks
    ADD COLUMN IF NOT EXISTS audio_format TEXT NOT NULL DEFAULT 'mp3';

ALTER TABLE media.tracks
    ALTER COLUMN audio_format DROP DEFAULT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tracks_audio_format_check'
          AND conrelid = 'media.tracks'::regclass
    ) THEN
        ALTER TABLE media.tracks
            ADD CONSTRAINT tracks_audio_format_check
            CHECK (audio_format IN ('mp3', 'flac'));
    END IF;
END
$$;
