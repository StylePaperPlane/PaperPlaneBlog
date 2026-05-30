create table if not exists music_tracks
(
    music_key   serial primary key,
    title       varchar(100)          not null,
    artist      varchar(100),
    audio_url   varchar(300)          not null,
    cover_url   varchar(300)          not null,
    lyric_url   varchar(300)          not null,
    sort_order  int     default 0     not null,
    enabled     boolean default true  not null,
    create_time timestamp             not null,
    update_time timestamp             not null
);
