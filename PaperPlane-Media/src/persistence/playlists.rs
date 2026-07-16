use std::collections::HashSet;

use sqlx::{Postgres, Transaction};

use super::{MediaRepository, PlaylistRecord};

impl MediaRepository {
    pub async fn list_playlists(
        &self,
        enabled_tracks_only: bool,
    ) -> Result<Vec<PlaylistRecord>, sqlx::Error> {
        sqlx::query_as::<_, PlaylistRecord>(
            r#"
            SELECT p.playlist_id,
                   p.name,
                   COALESCE(
                       array_agg(pt.music_key ORDER BY pt.position)
                           FILTER (WHERE pt.music_key IS NOT NULL AND ($1 = FALSE OR t.enabled = TRUE)),
                       ARRAY[]::BIGINT[]
                   ) AS track_ids,
                   p.created_at,
                   p.updated_at
            FROM media.playlists p
            LEFT JOIN media.playlist_tracks pt ON pt.playlist_id = p.playlist_id
            LEFT JOIN media.tracks t ON t.music_key = pt.music_key
            GROUP BY p.playlist_id, p.name, p.created_at, p.updated_at
            ORDER BY p.playlist_id
            "#,
        )
        .bind(enabled_tracks_only)
        .fetch_all(self.pool())
        .await
    }

    pub async fn create_playlist(&self, name: &str) -> Result<PlaylistRecord, sqlx::Error> {
        let playlist_id: i64 = sqlx::query_scalar(
            "INSERT INTO media.playlists (name) VALUES ($1) RETURNING playlist_id",
        )
        .bind(name)
        .fetch_one(self.pool())
        .await?;
        self.find_playlist(playlist_id)
            .await?
            .ok_or(sqlx::Error::RowNotFound)
    }

    pub async fn rename_playlist(
        &self,
        playlist_id: i64,
        name: &str,
    ) -> Result<Option<PlaylistRecord>, sqlx::Error> {
        let changed = sqlx::query(
            "UPDATE media.playlists SET name = $2, updated_at = now() WHERE playlist_id = $1",
        )
        .bind(playlist_id)
        .bind(name)
        .execute(self.pool())
        .await?
        .rows_affected();
        if changed == 0 {
            return Ok(None);
        }
        self.find_playlist(playlist_id).await
    }

    pub async fn replace_playlist_tracks(
        &self,
        playlist_id: i64,
        track_ids: &[i64],
    ) -> Result<Option<PlaylistRecord>, ReplacePlaylistTracksError> {
        let mut tx = self.pool().begin().await?;
        if !playlist_exists(&mut tx, playlist_id).await? {
            return Ok(None);
        }

        let existing = sqlx::query_scalar::<_, i64>(
            "SELECT music_key FROM media.tracks WHERE music_key = ANY($1)",
        )
        .bind(track_ids)
        .fetch_all(&mut *tx)
        .await?
        .into_iter()
        .collect::<HashSet<_>>();
        let missing = track_ids
            .iter()
            .copied()
            .filter(|id| !existing.contains(id))
            .collect::<Vec<_>>();
        if !missing.is_empty() {
            return Err(ReplacePlaylistTracksError::UnknownTracks(missing));
        }

        sqlx::query("DELETE FROM media.playlist_tracks WHERE playlist_id = $1")
            .bind(playlist_id)
            .execute(&mut *tx)
            .await?;
        for (position, music_key) in track_ids.iter().enumerate() {
            sqlx::query(
                "INSERT INTO media.playlist_tracks (playlist_id, music_key, position) VALUES ($1, $2, $3)",
            )
            .bind(playlist_id)
            .bind(music_key)
            .bind(position as i32)
            .execute(&mut *tx)
            .await?;
        }
        sqlx::query("UPDATE media.playlists SET updated_at = now() WHERE playlist_id = $1")
            .bind(playlist_id)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        Ok(self.find_playlist(playlist_id).await?)
    }

    pub async fn delete_playlist(&self, playlist_id: i64) -> Result<bool, sqlx::Error> {
        Ok(
            sqlx::query("DELETE FROM media.playlists WHERE playlist_id = $1")
                .bind(playlist_id)
                .execute(self.pool())
                .await?
                .rows_affected()
                > 0,
        )
    }

    async fn find_playlist(&self, playlist_id: i64) -> Result<Option<PlaylistRecord>, sqlx::Error> {
        sqlx::query_as::<_, PlaylistRecord>(
            r#"
            SELECT p.playlist_id,
                   p.name,
                   COALESCE(array_agg(pt.music_key ORDER BY pt.position)
                       FILTER (WHERE pt.music_key IS NOT NULL), ARRAY[]::BIGINT[]) AS track_ids,
                   p.created_at,
                   p.updated_at
            FROM media.playlists p
            LEFT JOIN media.playlist_tracks pt ON pt.playlist_id = p.playlist_id
            WHERE p.playlist_id = $1
            GROUP BY p.playlist_id, p.name, p.created_at, p.updated_at
            "#,
        )
        .bind(playlist_id)
        .fetch_optional(self.pool())
        .await
    }
}

async fn playlist_exists(
    tx: &mut Transaction<'_, Postgres>,
    playlist_id: i64,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM media.playlists WHERE playlist_id = $1)")
        .bind(playlist_id)
        .fetch_one(&mut **tx)
        .await
}

#[derive(Debug, thiserror::Error)]
pub enum ReplacePlaylistTracksError {
    #[error("歌单包含不存在的歌曲：{0:?}")]
    UnknownTracks(Vec<i64>),
    #[error(transparent)]
    Database(#[from] sqlx::Error),
}
