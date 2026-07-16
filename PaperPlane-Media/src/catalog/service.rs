use serde::Serialize;
use uuid::Uuid;

use crate::catalog::{PlaylistService, PublicPlaylist};
use crate::media_format::AudioFormat;
use crate::persistence::{MediaRepository, Track, TrackPatch};

#[derive(Clone)]
pub struct CatalogService {
    repository: MediaRepository,
    public_base_url: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicTrack {
    pub music_key: i64,
    pub asset_id: Uuid,
    pub title: String,
    pub artist: String,
    pub audio_format: AudioFormat,
    pub cover_url: Option<String>,
    pub lyric_url: Option<String>,
    pub plaintext_size: i64,
    pub chunk_size: i32,
    pub chunk_count: i32,
    pub cipher_url: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicCatalog {
    pub tracks: Vec<PublicTrack>,
    pub playlists: Vec<PublicPlaylist>,
}

impl CatalogService {
    pub fn new(repository: MediaRepository, public_base_url: String) -> Self {
        Self {
            repository,
            public_base_url: public_base_url.trim_end_matches('/').to_owned(),
        }
    }

    pub async fn public_catalog(&self) -> Result<PublicCatalog, sqlx::Error> {
        let tracks = self.public_tracks().await?;
        let playlists = PlaylistService::new(self.repository.clone())
            .public_playlists()
            .await?;
        Ok(PublicCatalog { tracks, playlists })
    }

    async fn public_tracks(&self) -> Result<Vec<PublicTrack>, sqlx::Error> {
        let tracks = self.repository.list_enabled().await?;
        let mut result = Vec::with_capacity(tracks.len());
        for track in tracks {
            if let Some(asset) = self.repository.find_enabled_asset(track.asset_id).await? {
                result.push(PublicTrack {
                    music_key: track.music_key,
                    asset_id: track.asset_id,
                    title: track.title,
                    artist: track.artist,
                    audio_format: track.audio_format,
                    cover_url: track.cover_path.map(|path| self.object_url(&path)),
                    lyric_url: track.lyric_path.map(|path| self.object_url(&path)),
                    plaintext_size: asset.plaintext_size,
                    chunk_size: asset.chunk_size,
                    chunk_count: asset.chunk_count,
                    cipher_url: format!(
                        "{}/assets/{}.ppm",
                        self.public_base_url, asset.cipher_sha256
                    ),
                });
            }
        }
        Ok(result)
    }

    pub async fn admin_tracks(&self) -> Result<Vec<Track>, sqlx::Error> {
        self.repository.list_all().await
    }

    pub async fn patch(&self, id: i64, patch: TrackPatch) -> Result<Option<Track>, sqlx::Error> {
        self.repository.patch_track(id, patch).await
    }

    fn object_url(&self, path: &str) -> String {
        format!("{}/{}", self.public_base_url, path.trim_start_matches('/'))
    }
}
