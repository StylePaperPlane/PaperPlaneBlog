create table if not exists categories
(
    category_key   serial primary key,
    category_title varchar(10)            not null,
    introduce      varchar(100)           not null,
    icon           varchar(300)           not null,
    color          char(8) default '#fff' not null,
    path_name      varchar(20)            not null,
    constraint categorie_title unique (category_title)
);

create table if not exists friends
(
    friend_key  serial primary key,
    site_name   varchar(20)   not null,
    avatar      varchar(300)  not null,
    site_url    varchar(50)   not null,
    description varchar(50),
    status      int default 0 not null,
    constraint friends_site_name_uindex unique (site_name),
    constraint friends_site_url_uindex unique (site_url)
);

create table if not exists images
(
    image_key serial primary key,
    image_url varchar(300) not null
);

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

create table if not exists notes
(
    note_key      serial primary key,
    note_title    varchar(50)                  not null,
    note_content  text                         not null,
    description   text                         not null,
    cover         varchar(300)                 not null,
    note_category int                          not null,
    note_tags     varchar(50),
    status        varchar(10) default 'public' not null,
    create_time   timestamp                    not null,
    publish_time  timestamp                    not null,
    update_time   timestamp,
    is_top        int         default 0,
    constraint notes_title unique (note_title)
);

create index if not exists categories_title on notes (note_category);

create table if not exists tag_level_1
(
    tag_key serial primary key,
    title   varchar(20)               not null,
    level   int     default 2         not null,
    color   char(8) default '#ffffff' not null,
    constraint tag_level_1_title unique (title)
);

create table if not exists tag_level_2
(
    tag_key    int primary key,
    title      varchar(20)               not null,
    level      int     default 2         not null,
    color      char(8) default '#ffffff' not null,
    father_tag varchar(20)               not null,
    constraint tag_level_2_title unique (title)
);

create table if not exists talks
(
    talk_key    serial primary key,
    talk_title  varchar(50) not null,
    content     text        not null,
    create_time timestamp   not null,
    update_time timestamp
);

create table if not exists app_user
(
    username varchar(100) not null,
    password varchar(100) not null,
    constraint app_user_username unique (username)
);

create table if not exists web_info
(
    id                   serial primary key,
    blog_title           varchar(255),
    blog_author          varchar(255),
    blog_domain          varchar(255),
    blog_description     text,
    blog_icp             varchar(255),
    user_account         varchar(255),
    user_password        varchar(255),
    user_avatar          varchar(255),
    user_talk            text,
    social_github        varchar(255),
    social_email         varchar(255),
    social_bilibili      varchar(255),
    social_qq            varchar(255),
    social_netease_cloud varchar(255),
    openai_token         varchar(255),
    netease_cookies      varchar(255),
    github_token         varchar(255),
    constraint web_info_blog_title unique (blog_title)
);

create table if not exists sys_config
(
    id              serial primary key,
    config_name     varchar(128) not null,
    config_key      varchar(64)  not null,
    config_value    varchar(256),
    is_private_flag char         not null
);

insert into sys_config (id, config_name, config_key, config_value, is_private_flag) values
    (1, 'Email account', 'spring.mail.username', '', '1'),
    (2, 'Email password', 'spring.mail.password', '', '1'),
    (6, 'Local storage enabled', 'local.enable', 'true', '0'),
    (7, 'Aliyun OSS enabled', 'ali.enable', 'false', '0'),
    (10, 'Aliyun accessKey', 'ali.accessKey', '', '1'),
    (11, 'Aliyun secretKey', 'ali.secretKey', '', '1'),
    (12, 'Aliyun bucket', 'ali.bucket', '', '1'),
    (13, 'Aliyun endpoint', 'ali.endpoint', '', '0'),
    (16, 'Aliyun upload path', 'ali.uploadPath', 'blog/pic/', '0'),
    (17, 'Local upload path', 'local.uploadDir', 'upload-dir', '1'),
    (19, 'JWT key', 'jwt.key', 'change-this-jwt-secret-before-deploying-paperplane-blog', '1'),
    (21, 'JWT expire milliseconds', 'jwt.expire', '86400000', '0')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('sys_config', 'id'), coalesce(max(id), 1), true) from sys_config;

insert into categories (category_title, introduce, icon, color, path_name)
values ('default', 'Default category', 'default', '#fff', 'default')
on conflict (category_title) do nothing;

insert into tag_level_1 (title)
values ('default')
on conflict (title) do nothing;

insert into web_info (user_account, user_password, blog_title, blog_author, blog_domain, blog_icp, blog_description, user_avatar, user_talk, social_github)
values ('admin', null, 'PaperPlane Blog', 'Your Name', 'localhost', '', 'A clean personal blog starter built with React and Spring Boot.', '', 'Write something about yourself here.', '')
on conflict (blog_title) do nothing;

insert into app_user (username, password)
values ('8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
        '$2a$12$yDsd3FUbvR82Kkej6E9YVO16Nb6VwOtnhguLV4d5NhUalMM2CZwhi')
on conflict (username) do nothing;

insert into notes (note_title, note_content, description, cover, note_category, note_tags, status, create_time, publish_time, update_time, is_top)
values ('Welcome to PaperPlane',
        '## Welcome\n\nThis is a starter article. Replace it from the dashboard after you finish setting up your blog.\n\nMarkdown, HTML line breaks, and math formulas are supported.',
        'A neutral starter article for a fresh PaperPlane Blog installation.',
        '',
        1,
        '1',
        'public',
        '2024-01-01 00:00:00',
        '2024-01-01 00:00:00',
        '2024-01-01 00:00:00',
        0)
on conflict (note_title) do nothing;
