use paperplane_media::{
    catalog::{PlaylistError, PlaylistService},
    persistence::MediaRepository,
};
use sqlx::PgPool;
use uuid::Uuid;

#[sqlx::test(migrations = "./migrations")]
async fn playlist_lifecycle_preserves_tracks_and_order(pool: PgPool) {
    seed_track(&pool, 1, true).await;
    seed_track(&pool, 2, true).await;
    seed_track(&pool, 3, false).await;
    let service = PlaylistService::new(MediaRepository::new(pool.clone()));

    let first = service.create("  夜间播放  ").await.unwrap();
    let second = service.create("通勤").await.unwrap();
    assert_eq!(first.name, "夜间播放");
    assert!(matches!(
        service.create("夜间播放").await,
        Err(PlaylistError::DuplicateName)
    ));

    let first = service
        .replace_tracks(first.playlist_id, vec![2, 1, 3])
        .await
        .unwrap();
    service
        .replace_tracks(second.playlist_id, vec![1])
        .await
        .unwrap();
    assert_eq!(first.track_ids, vec![2, 1, 3]);

    assert!(matches!(
        service.replace_tracks(first.playlist_id, vec![1, 1]).await,
        Err(PlaylistError::DuplicateTrackIds)
    ));
    assert!(matches!(
        service
            .replace_tracks(first.playlist_id, vec![1, 999])
            .await,
        Err(PlaylistError::UnknownTracks(ids)) if ids == vec![999]
    ));
    assert_eq!(
        service
            .admin_playlists()
            .await
            .unwrap()
            .into_iter()
            .find(|playlist| playlist.playlist_id == first.playlist_id)
            .unwrap()
            .track_ids,
        vec![2, 1, 3]
    );

    let public = service.public_playlists().await.unwrap();
    assert_eq!(public[0].track_ids, vec![2, 1]);
    assert_eq!(public[1].track_ids, vec![1]);

    service.delete(first.playlist_id).await.unwrap();
    let track_count: i64 = sqlx::query_scalar("SELECT count(*) FROM media.tracks")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(track_count, 3);

    sqlx::query("DELETE FROM media.tracks WHERE music_key = 1")
        .execute(&pool)
        .await
        .unwrap();
    let second = service
        .admin_playlists()
        .await
        .unwrap()
        .into_iter()
        .find(|playlist| playlist.playlist_id == second.playlist_id)
        .unwrap();
    assert!(second.track_ids.is_empty());
    assert!(service.public_playlists().await.unwrap().is_empty());
}

async fn seed_track(pool: &PgPool, music_key: i64, enabled: bool) {
    let asset_id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO media.assets (
            asset_id, cipher_sha256, plaintext_size, chunk_size, chunk_count,
            nonce_prefix, encrypted_key, key_nonce, master_key_version
        ) VALUES ($1, $2, 1, 262144, 1, $3, $4, $5, 1)
        "#,
    )
    .bind(asset_id)
    .bind(format!("{music_key:064x}"))
    .bind(vec![0_u8; 8])
    .bind(vec![0_u8; 32])
    .bind(vec![0_u8; 12])
    .execute(pool)
    .await
    .unwrap();
    sqlx::query(
        "INSERT INTO media.tracks (music_key, asset_id, title, artist, audio_format, enabled) VALUES ($1, $2, $3, '测试歌手', 'mp3', $4)",
    )
    .bind(music_key)
    .bind(asset_id)
    .bind(format!("歌曲 {music_key}"))
    .bind(enabled)
    .execute(pool)
    .await
    .unwrap();
}
