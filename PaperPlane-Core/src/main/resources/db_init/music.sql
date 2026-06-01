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

insert into music_tracks (title, artist, audio_url, cover_url, lyric_url, sort_order, enabled, create_time, update_time)
select 'Always Online',
       '',
       '/music/Always Online/Always Online.mp3',
       '/music/Always Online/Always Online.jpg',
       '/music/Always Online/Always Online.lrc',
       1,
       true,
       now(),
       now()
where not exists (select 1 from music_tracks where title = 'Always Online');

insert into music_tracks (title, artist, audio_url, cover_url, lyric_url, sort_order, enabled, create_time, update_time)
select 'Closer',
       '',
       '/music/Closer/Closer.mp3',
       '/music/Closer/Closer.jpg',
       '/music/Closer/Closer.lrc',
       2,
       true,
       now(),
       now()
where not exists (select 1 from music_tracks where title = 'Closer');
