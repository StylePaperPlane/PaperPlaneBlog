use sqlx::{PgPool, Postgres, Transaction};
use time::OffsetDateTime;
use uuid::Uuid;

use super::{
    AssetRecord, NewAsset, NewTrack, PlayableAssetRecord, PlaybackSession, Track, TrackPatch,
};

#[derive(Clone)]
pub struct MediaRepository {
    pool: PgPool,
}

impl MediaRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    pub async fn list_enabled(&self) -> Result<Vec<Track>, sqlx::Error> {
        sqlx::query_as::<_, Track>("SELECT music_key, asset_id, title, artist, audio_format, cover_path, lyric_path, sort_order, enabled, created_at, updated_at FROM media.tracks WHERE enabled = TRUE ORDER BY sort_order, music_key")
            .fetch_all(&self.pool).await
    }

    pub async fn list_all(&self) -> Result<Vec<Track>, sqlx::Error> {
        sqlx::query_as::<_, Track>("SELECT music_key, asset_id, title, artist, audio_format, cover_path, lyric_path, sort_order, enabled, created_at, updated_at FROM media.tracks ORDER BY sort_order, music_key")
            .fetch_all(&self.pool).await
    }

    pub async fn track_id_exists(&self, id: i64) -> Result<bool, sqlx::Error> {
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM media.tracks WHERE music_key = $1)")
            .bind(id)
            .fetch_one(&self.pool)
            .await
    }

    pub async fn find_enabled_asset(
        &self,
        asset_id: Uuid,
    ) -> Result<Option<PlayableAssetRecord>, sqlx::Error> {
        sqlx::query_as::<_, PlayableAssetRecord>("SELECT a.asset_id, a.cipher_sha256, a.plaintext_size, a.chunk_size, a.chunk_count, a.nonce_prefix, a.encrypted_key, a.key_nonce, a.master_key_version, t.audio_format FROM media.assets a JOIN media.tracks t ON t.asset_id = a.asset_id WHERE a.asset_id = $1 AND t.enabled = TRUE")
            .bind(asset_id).fetch_optional(&self.pool).await
    }

    pub async fn find_asset(&self, asset_id: Uuid) -> Result<Option<AssetRecord>, sqlx::Error> {
        sqlx::query_as::<_, AssetRecord>("SELECT asset_id, cipher_sha256, plaintext_size, chunk_size, chunk_count, nonce_prefix, encrypted_key, key_nonce, master_key_version FROM media.assets WHERE asset_id = $1")
            .bind(asset_id).fetch_optional(&self.pool).await
    }

    pub async fn insert_session(&self, session: &PlaybackSession) -> Result<(), sqlx::Error> {
        sqlx::query("INSERT INTO media.playback_sessions (session_hash, fingerprint_hash, public_jwk, public_key_thumbprint, expires_at) VALUES ($1,$2,$3,$4,$5)")
            .bind(&session.session_hash).bind(&session.fingerprint_hash).bind(&session.public_jwk)
            .bind(&session.public_key_thumbprint).bind(session.expires_at).execute(&self.pool).await?;
        Ok(())
    }

    pub async fn find_session(
        &self,
        session_hash: &[u8],
    ) -> Result<Option<PlaybackSession>, sqlx::Error> {
        sqlx::query_as::<_, PlaybackSession>("SELECT session_hash, fingerprint_hash, public_jwk, public_key_thumbprint, expires_at FROM media.playback_sessions WHERE session_hash = $1 AND expires_at > now()")
            .bind(session_hash).fetch_optional(&self.pool).await
    }

    pub async fn publish(&self, asset: &NewAsset, track: &NewTrack) -> Result<Track, sqlx::Error> {
        let mut tx = self.pool.begin().await?;
        insert_asset(&mut tx, asset).await?;
        let row = insert_track(&mut tx, track).await?;
        tx.commit().await?;
        Ok(row)
    }

    pub async fn patch_track(
        &self,
        id: i64,
        patch: TrackPatch,
    ) -> Result<Option<Track>, sqlx::Error> {
        sqlx::query_as::<_, Track>("UPDATE media.tracks SET title = COALESCE($2,title), artist = COALESCE($3,artist), sort_order = COALESCE($4,sort_order), enabled = COALESCE($5,enabled), updated_at = now() WHERE music_key = $1 RETURNING music_key, asset_id, title, artist, audio_format, cover_path, lyric_path, sort_order, enabled, created_at, updated_at")
            .bind(id).bind(patch.title).bind(patch.artist).bind(patch.sort_order).bind(patch.enabled)
            .fetch_optional(&self.pool).await
    }

    pub async fn delete_tracks(&self, ids: &[i64]) -> Result<Vec<String>, sqlx::Error> {
        let mut tx = self.pool.begin().await?;
        let objects = sqlx::query_as::<_, (Uuid, String, Option<String>, Option<String>)>("SELECT a.asset_id, a.cipher_sha256, t.cover_path, t.lyric_path FROM media.assets a JOIN media.tracks t ON t.asset_id=a.asset_id WHERE t.music_key = ANY($1)")
            .bind(ids).fetch_all(&mut *tx).await?;
        sqlx::query("DELETE FROM media.tracks WHERE music_key = ANY($1)")
            .bind(ids)
            .execute(&mut *tx)
            .await?;
        sqlx::query("DELETE FROM media.assets a WHERE a.asset_id = ANY($1) AND NOT EXISTS (SELECT 1 FROM media.tracks t WHERE t.asset_id=a.asset_id)")
            .bind(objects.iter().map(|item| item.0).collect::<Vec<_>>()).execute(&mut *tx).await?;
        let mut removable = objects
            .iter()
            .map(|item| format!("assets/{}.ppm", item.1))
            .collect::<Vec<_>>();
        let referenced_paths = objects
            .iter()
            .flat_map(|item| [item.2.clone(), item.3.clone()])
            .flatten()
            .collect::<Vec<_>>();
        for path in referenced_paths {
            let still_referenced: bool = sqlx::query_scalar(
                "SELECT EXISTS(SELECT 1 FROM media.tracks WHERE cover_path=$1 OR lyric_path=$1)",
            )
            .bind(&path)
            .fetch_one(&mut *tx)
            .await?;
            if !still_referenced {
                removable.push(path);
            }
        }
        removable.sort();
        removable.dedup();
        tx.commit().await?;
        Ok(removable)
    }

    pub async fn purge_expired_sessions(&self) -> Result<u64, sqlx::Error> {
        Ok(
            sqlx::query("DELETE FROM media.playback_sessions WHERE expires_at <= $1")
                .bind(OffsetDateTime::now_utc())
                .execute(&self.pool)
                .await?
                .rows_affected(),
        )
    }
}

async fn insert_asset(
    tx: &mut Transaction<'_, Postgres>,
    asset: &NewAsset,
) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT INTO media.assets (asset_id,cipher_sha256,plaintext_size,chunk_size,chunk_count,nonce_prefix,encrypted_key,key_nonce,master_key_version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (asset_id) DO NOTHING")
        .bind(asset.asset_id).bind(&asset.cipher_sha256).bind(asset.plaintext_size).bind(asset.chunk_size)
        .bind(asset.chunk_count).bind(&asset.nonce_prefix).bind(&asset.encrypted_key).bind(&asset.key_nonce)
        .bind(asset.master_key_version).execute(&mut **tx).await?;
    Ok(())
}

async fn insert_track(
    tx: &mut Transaction<'_, Postgres>,
    track: &NewTrack,
) -> Result<Track, sqlx::Error> {
    let inserted = sqlx::query_as::<_, Track>("INSERT INTO media.tracks (music_key,asset_id,title,artist,audio_format,cover_path,lyric_path,sort_order,enabled) VALUES (COALESCE($1,nextval('media.tracks_music_key_seq')),$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (asset_id) DO UPDATE SET title=EXCLUDED.title,artist=EXCLUDED.artist,audio_format=EXCLUDED.audio_format,cover_path=EXCLUDED.cover_path,lyric_path=EXCLUDED.lyric_path,sort_order=EXCLUDED.sort_order,enabled=EXCLUDED.enabled,updated_at=now() RETURNING music_key,asset_id,title,artist,audio_format,cover_path,lyric_path,sort_order,enabled,created_at,updated_at")
        .bind(track.music_key).bind(track.asset_id).bind(&track.title).bind(&track.artist).bind(track.audio_format).bind(&track.cover_path)
        .bind(&track.lyric_path).bind(track.sort_order).bind(track.enabled).fetch_one(&mut **tx).await?;
    if track.music_key.is_some() {
        sync_track_sequence(tx).await?;
    }
    Ok(inserted)
}

async fn sync_track_sequence(tx: &mut Transaction<'_, Postgres>) -> Result<(), sqlx::Error> {
    sqlx::query("SELECT setval('media.tracks_music_key_seq', COALESCE((SELECT max(music_key) FROM media.tracks), 0) + 1, false)")
        .execute(&mut **tx)
        .await?;
    Ok(())
}
