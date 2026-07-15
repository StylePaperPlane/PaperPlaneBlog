SELECT setval(
    'media.tracks_music_key_seq',
    COALESCE((SELECT max(music_key) FROM media.tracks), 0) + 1,
    false
);
