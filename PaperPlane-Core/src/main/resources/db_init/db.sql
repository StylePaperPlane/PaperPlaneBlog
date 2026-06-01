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
    image_url varchar(300) not null,
    folder_name varchar(50) default '默认文件夹' not null
);

create table if not exists image_folders
(
    folder_key serial primary key,
    folder_name varchar(50) not null,
    constraint image_folders_folder_name unique (folder_name)
);

insert into image_folders (folder_name)
values ('默认文件夹')
on conflict (folder_name) do nothing;

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
    (1, 'QQ邮箱号', 'spring.mail.username', '', '1'),
    (2, 'QQ邮箱授权码', 'spring.mail.password', '', '1'),
    (6, '本地存储启用状态', 'local.enable', 'true', '0'),
    (7, '阿里云存储启用状态', 'ali.enable', 'false', '0'),
    (10, '阿里云-accessKey', 'ali.accessKey', '', '1'),
    (11, '阿里云-secretKey', 'ali.secretKey', '', '1'),
    (12, '阿里云-bucket', 'ali.bucket', 'wkq-img', '1'),
    (13, '阿里云-endpoint', 'ali.endpoint', 'oss-cn-chengdu.aliyuncs.com', '0'),
    (16, '阿里云-上传路径', 'ali.uploadPath', 'blog/pic/', '0'),
    (17, '本地存储-上传路径', 'local.uploadDir', 'upload-dir', '1'),
    (19, 'JWT-key(设置复杂一点，否则会报错)', 'jwt.key', 'sdfasdfasdfq2w2easdfajsiodfhasuidhfasopidfhasiopdfuasidfasdfasdf', '1'),
    (21, 'JWT-过期时间(毫秒)', 'jwt.expire', '86400000', '0');

select setval(pg_get_serial_sequence('sys_config', 'id'), coalesce(max(id), 1), true) from sys_config;

insert into categories (category_title, introduce, icon, color, path_name)
values ('default', 'This is the introduction for the default category', 'default', '#fff', 'default');

insert into tag_level_1 (title)
values ('default');

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

insert into web_info (user_account, user_password, blog_title, blog_author, blog_domain, blog_icp, blog_description, user_avatar)
values ('admin', null, 'PaperPlane', 'PaperPlane', '127.0.0.1', '粤ICP备XXXXXXXX号-1', '这里是PaperPlane', 'https://img.picgo.net/2024/05/04/avatar144c348b2adf3b5c.jpeg');

insert into app_user (username, password)
values ('8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
        '$2a$12$yDsd3FUbvR82Kkej6E9YVO16Nb6VwOtnhguLV4d5NhUalMM2CZwhi');

insert into notes (note_title, note_content, description, cover, note_category, note_tags, status, create_time, publish_time, update_time, is_top)
values ('Hi! PaperPlane',
        '## PaperPlane

欢迎使用 **PaperPlane** 个人主题博客。本项目采用 **React + SpringBoot** 前后端分离，以优美的动画和可爱的画风为主题，由作者**林陌青川**维护。目前已支持使用 Docker 上线。

## 创作初心

作为我的处女作品，我对 **PaperPlane** 投入了许多时间。从 23 年年底开始一直到 24 年的清明节才算是正式完工。也许 **PaperPlane** 并不完美，但也是我的呕心沥血之作。想起创作期间无数个凌晨，碰到 bug 一写就是一晚上。现在回头望去，留给我的已经是珍贵的回忆。

## 为什么起名 PaperPlane?

关于 **PaperPlane** 的背后其实有一段悲伤的故事。24 年年初因为一些琐事，我没能回去贵州，而我的外祖母在今年的 3 月初不幸意外离世，而我却没有见到她最后一面……

## 作者寄语

如果你觉得 **PaperPlane** 并不完美，那么就去构建一个属于你自己的 **"PaperPlane"** 吧。本项目将在 **V2** 版本重构采用 **NextJS**，作者再次承诺后续所有版本皆是开源。

## Star History

![star](https://api.star-history.com/svg?repos=LinMoQC/PaperPlane-Blog&type=Date&theme=dark)
',
        '给所有用户的一封信',
        'https://img.picgo.net/2024/05/04/avatar144c348b2adf3b5c.jpeg',
        1,
        '1',
        'public',
        '2024-04-10 05:31:00',
        '2024-04-10 05:31:00',
        '2024-04-10 05:48:59',
        0);
