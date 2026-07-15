use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use time::OffsetDateTime;
use uuid::Uuid;

use crate::media_format::AudioFormat;

#[derive(Debug, Clone, FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Track {
    pub music_key: i64,
    pub asset_id: Uuid,
    pub title: String,
    pub artist: String,
    pub audio_format: AudioFormat,
    pub cover_path: Option<String>,
    pub lyric_path: Option<String>,
    pub sort_order: i32,
    pub enabled: bool,
    pub created_at: OffsetDateTime,
    pub updated_at: OffsetDateTime,
}

#[derive(Debug, Clone)]
pub struct NewTrack {
    pub music_key: Option<i64>,
    pub asset_id: Uuid,
    pub title: String,
    pub artist: String,
    pub audio_format: AudioFormat,
    pub cover_path: Option<String>,
    pub lyric_path: Option<String>,
    pub sort_order: i32,
    pub enabled: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackPatch {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub sort_order: Option<i32>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Clone, FromRow)]
pub struct AssetRecord {
    pub asset_id: Uuid,
    pub cipher_sha256: String,
    pub plaintext_size: i64,
    pub chunk_size: i32,
    pub chunk_count: i32,
    pub nonce_prefix: Vec<u8>,
    pub encrypted_key: Vec<u8>,
    pub key_nonce: Vec<u8>,
    pub master_key_version: i32,
}

#[derive(Debug, Clone, FromRow)]
pub struct PlayableAssetRecord {
    pub asset_id: Uuid,
    pub cipher_sha256: String,
    pub plaintext_size: i64,
    pub chunk_size: i32,
    pub chunk_count: i32,
    pub nonce_prefix: Vec<u8>,
    pub encrypted_key: Vec<u8>,
    pub key_nonce: Vec<u8>,
    pub master_key_version: i32,
    pub audio_format: AudioFormat,
}

pub struct NewAsset {
    pub asset_id: Uuid,
    pub cipher_sha256: String,
    pub plaintext_size: i64,
    pub chunk_size: i32,
    pub chunk_count: i32,
    pub nonce_prefix: Vec<u8>,
    pub encrypted_key: Vec<u8>,
    pub key_nonce: Vec<u8>,
    pub master_key_version: i32,
}

#[derive(Debug, Clone, FromRow)]
pub struct PlaybackSession {
    pub session_hash: Vec<u8>,
    pub fingerprint_hash: Vec<u8>,
    pub public_jwk: serde_json::Value,
    pub public_key_thumbprint: Vec<u8>,
    pub expires_at: OffsetDateTime,
}
