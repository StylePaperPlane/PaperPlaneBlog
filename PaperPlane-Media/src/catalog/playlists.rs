use std::collections::HashSet;

use serde::Serialize;

use crate::persistence::{MediaRepository, PlaylistRecord, ReplacePlaylistTracksError};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicPlaylist {
    pub playlist_id: i64,
    pub name: String,
    pub track_ids: Vec<i64>,
}

#[derive(Clone)]
pub struct PlaylistService {
    repository: MediaRepository,
}

impl PlaylistService {
    pub fn new(repository: MediaRepository) -> Self {
        Self { repository }
    }

    pub async fn public_playlists(&self) -> Result<Vec<PublicPlaylist>, sqlx::Error> {
        Ok(self
            .repository
            .list_playlists(true)
            .await?
            .into_iter()
            .filter(|playlist| !playlist.track_ids.is_empty())
            .map(|playlist| PublicPlaylist {
                playlist_id: playlist.playlist_id,
                name: playlist.name,
                track_ids: playlist.track_ids,
            })
            .collect())
    }

    pub async fn admin_playlists(&self) -> Result<Vec<PlaylistRecord>, PlaylistError> {
        Ok(self.repository.list_playlists(false).await?)
    }

    pub async fn create(&self, name: &str) -> Result<PlaylistRecord, PlaylistError> {
        let name = normalized_name(name)?;
        self.repository
            .create_playlist(&name)
            .await
            .map_err(map_database_error)
    }

    pub async fn rename(
        &self,
        playlist_id: i64,
        name: &str,
    ) -> Result<PlaylistRecord, PlaylistError> {
        let name = normalized_name(name)?;
        self.repository
            .rename_playlist(playlist_id, &name)
            .await
            .map_err(map_database_error)?
            .ok_or(PlaylistError::NotFound)
    }

    pub async fn replace_tracks(
        &self,
        playlist_id: i64,
        track_ids: Vec<i64>,
    ) -> Result<PlaylistRecord, PlaylistError> {
        let mut unique = HashSet::with_capacity(track_ids.len());
        if track_ids.iter().any(|id| !unique.insert(*id)) {
            return Err(PlaylistError::DuplicateTrackIds);
        }
        self.repository
            .replace_playlist_tracks(playlist_id, &track_ids)
            .await
            .map_err(|error| match error {
                ReplacePlaylistTracksError::UnknownTracks(ids) => PlaylistError::UnknownTracks(ids),
                ReplacePlaylistTracksError::Database(error) => PlaylistError::Database(error),
            })?
            .ok_or(PlaylistError::NotFound)
    }

    pub async fn delete(&self, playlist_id: i64) -> Result<(), PlaylistError> {
        if self.repository.delete_playlist(playlist_id).await? {
            Ok(())
        } else {
            Err(PlaylistError::NotFound)
        }
    }
}

fn normalized_name(value: &str) -> Result<String, PlaylistError> {
    let normalized = value.trim();
    if !(1..=60).contains(&normalized.chars().count()) {
        return Err(PlaylistError::InvalidName);
    }
    Ok(normalized.to_owned())
}

fn map_database_error(error: sqlx::Error) -> PlaylistError {
    if error
        .as_database_error()
        .and_then(|database| database.constraint())
        == Some("playlists_name_ci_unique")
    {
        PlaylistError::DuplicateName
    } else {
        PlaylistError::Database(error)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum PlaylistError {
    #[error("歌单名称长度必须为 1 至 60 个字符")]
    InvalidName,
    #[error("已存在同名歌单")]
    DuplicateName,
    #[error("歌单不存在")]
    NotFound,
    #[error("歌曲列表不能包含重复歌曲")]
    DuplicateTrackIds,
    #[error("歌单包含不存在的歌曲：{0:?}")]
    UnknownTracks(Vec<i64>),
    #[error(transparent)]
    Database(#[from] sqlx::Error),
}

#[cfg(test)]
mod tests {
    use super::normalized_name;

    #[test]
    fn trims_and_validates_playlist_names() {
        assert_eq!(normalized_name("  夜间  ").unwrap(), "夜间");
        assert!(normalized_name("   ").is_err());
        assert!(normalized_name(&"a".repeat(61)).is_err());
    }
}
