use std::io::Cursor;

use tempfile::NamedTempFile;
use thiserror::Error;
use uuid::Uuid;

use crate::{
    crypto::{AssetKey, KeyVault, Ppm1Writer},
    persistence::{MediaRepository, NewAsset, NewTrack, Track},
    storage::{LocalObjectStorage, StorageError},
};

use super::{ArchiveError, MusicArchive};

#[derive(Clone)]
pub struct MusicPublisher {
    repository: MediaRepository,
    storage: LocalObjectStorage,
    key_vault: KeyVault,
}

pub struct PublishRequest {
    pub archive: Vec<u8>,
    pub music_key: Option<i64>,
    pub title: String,
    pub artist: String,
    pub sort_order: i32,
    pub enabled: bool,
}

impl MusicPublisher {
    pub fn new(
        repository: MediaRepository,
        storage: LocalObjectStorage,
        key_vault: KeyVault,
    ) -> Self {
        Self {
            repository,
            storage,
            key_vault,
        }
    }

    pub async fn publish(&self, request: PublishRequest) -> Result<Track, IngestError> {
        validate_metadata(&request)?;
        let imported = MusicArchive::read(request.archive)?;
        let asset_id = Uuid::new_v4();
        let content_key = AssetKey::generate();
        let mut encrypted = NamedTempFile::new_in(self.storage.root())?;
        let header = Ppm1Writer::encrypt(
            Cursor::new(&imported.audio),
            &mut encrypted,
            imported.audio.len() as u64,
            asset_id,
            &content_key,
        )?;
        let ppm = self
            .storage
            .publish_file("assets", "ppm", encrypted.path())?;
        let cover = imported
            .cover
            .as_ref()
            .map(|(ext, bytes)| self.storage.publish_bytes("covers", ext, bytes))
            .transpose()?;
        let lyric = imported
            .lyric
            .as_ref()
            .map(|bytes| self.storage.publish_bytes("lyrics", "lrc", bytes))
            .transpose()?;
        let protected = self.key_vault.protect(asset_id, &content_key)?;
        let asset = NewAsset {
            asset_id,
            cipher_sha256: ppm.sha256,
            plaintext_size: header.plaintext_size as i64,
            chunk_size: header.chunk_size as i32,
            chunk_count: header.chunk_count as i32,
            nonce_prefix: header.nonce_prefix.to_vec(),
            encrypted_key: protected.ciphertext,
            key_nonce: protected.nonce.to_vec(),
            master_key_version: protected.version,
        };
        let track = NewTrack {
            music_key: request.music_key,
            asset_id,
            title: request.title.trim().to_owned(),
            artist: request.artist.trim().to_owned(),
            audio_format: imported.audio_format,
            cover_path: cover.map(|item| item.relative_path),
            lyric_path: lyric.map(|item| item.relative_path),
            sort_order: request.sort_order,
            enabled: request.enabled,
        };
        match self.repository.publish(&asset, &track).await {
            Ok(track) => Ok(track),
            Err(error) => {
                let _ = self.storage.delete_managed(&ppm.relative_path);
                if let Some(path) = &track.cover_path {
                    let _ = self.storage.delete_managed(path);
                }
                if let Some(path) = &track.lyric_path {
                    let _ = self.storage.delete_managed(path);
                }
                Err(error.into())
            }
        }
    }
}

fn validate_metadata(request: &PublishRequest) -> Result<(), IngestError> {
    if request.title.trim().is_empty() || request.title.chars().count() > 200 {
        return Err(IngestError::InvalidTitle);
    }
    if request.artist.trim().is_empty() || request.artist.chars().count() > 200 {
        return Err(IngestError::InvalidArtist);
    }
    Ok(())
}

#[derive(Debug, Error)]
pub enum IngestError {
    #[error("歌曲标题不能为空且不能超过 200 字")]
    InvalidTitle,
    #[error("歌手不能为空且不能超过 200 字")]
    InvalidArtist,
    #[error(transparent)]
    Archive(#[from] ArchiveError),
    #[error(transparent)]
    Ppm1(#[from] crate::crypto::Ppm1Error),
    #[error(transparent)]
    KeyVault(#[from] crate::crypto::KeyVaultError),
    #[error(transparent)]
    Storage(#[from] StorageError),
    #[error(transparent)]
    Database(#[from] sqlx::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}
