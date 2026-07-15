use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use hmac::{Hmac, Mac};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use thiserror::Error;
use time::{Duration, OffsetDateTime};
use uuid::Uuid;

use crate::{
    crypto::{DeviceJwk, KeyVault, KeyVaultError, ProtectedKey},
    media_format::AudioFormat,
    persistence::{MediaRepository, PlaybackSession},
};

type HmacSha256 = Hmac<Sha256>;

#[derive(Clone)]
pub struct PlaybackService {
    repository: MediaRepository,
    key_vault: KeyVault,
    hmac_key: [u8; 32],
    session_hours: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(deny_unknown_fields)]
pub struct CreateSession {
    pub fingerprint_sha256: String,
    pub fingerprint_version: u16,
    pub device_public_key: DeviceJwk,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionCreated {
    #[serde(with = "time::serde::rfc3339")]
    pub expires_at: OffsetDateTime,
    #[serde(skip)]
    pub cookie_token: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IssuedKey {
    pub asset_id: Uuid,
    pub wrapped_key: String,
    pub algorithm: &'static str,
    #[serde(with = "time::serde::rfc3339")]
    pub expires_at: OffsetDateTime,
    pub plaintext_size: i64,
    pub chunk_size: i32,
    pub chunk_count: i32,
    pub nonce_prefix: String,
    pub cipher_sha256: String,
    pub audio_format: AudioFormat,
}

impl PlaybackService {
    pub fn new(
        repository: MediaRepository,
        key_vault: KeyVault,
        hmac_key: [u8; 32],
        session_hours: i64,
    ) -> Self {
        Self {
            repository,
            key_vault,
            hmac_key,
            session_hours,
        }
    }

    pub async fn create_session(
        &self,
        request: CreateSession,
    ) -> Result<SessionCreated, PlaybackError> {
        if request.fingerprint_version != 1 {
            return Err(PlaybackError::UnsupportedFingerprintVersion);
        }
        let fingerprint = decode_sha256(&request.fingerprint_sha256)?;
        validate_jwk(&request.device_public_key)?;
        let mut token = [0_u8; 32];
        rand::rng().fill_bytes(&mut token);
        let cookie_token = URL_SAFE_NO_PAD.encode(token);
        let session_hash = Sha256::digest(token).to_vec();
        let fingerprint_hash = self.hmac(&fingerprint);
        let thumbprint = jwk_thumbprint(&request.device_public_key);
        let expires_at = OffsetDateTime::now_utc() + Duration::hours(self.session_hours);
        self.repository
            .insert_session(&PlaybackSession {
                session_hash,
                fingerprint_hash,
                public_jwk: serde_json::to_value(&request.device_public_key)?,
                public_key_thumbprint: thumbprint.to_vec(),
                expires_at,
            })
            .await?;
        Ok(SessionCreated {
            expires_at,
            cookie_token,
        })
    }

    pub async fn issue_key(
        &self,
        session_token: &str,
        asset_id: Uuid,
        fingerprint_sha256: &str,
    ) -> Result<IssuedKey, PlaybackError> {
        let raw_token = URL_SAFE_NO_PAD
            .decode(session_token)
            .map_err(|_| PlaybackError::InvalidSession)?;
        let session_hash = Sha256::digest(raw_token);
        let session = self
            .repository
            .find_session(&session_hash)
            .await?
            .ok_or(PlaybackError::InvalidSession)?;
        let fingerprint = decode_sha256(fingerprint_sha256)?;
        if self.hmac(&fingerprint) != session.fingerprint_hash {
            return Err(PlaybackError::FingerprintMismatch);
        }
        let asset = self
            .repository
            .find_enabled_asset(asset_id)
            .await?
            .ok_or(PlaybackError::TrackUnavailable)?;
        let key_nonce: [u8; 12] = asset
            .key_nonce
            .as_slice()
            .try_into()
            .map_err(|_| PlaybackError::CorruptAsset)?;
        let protected = ProtectedKey {
            ciphertext: asset.encrypted_key,
            nonce: key_nonce,
            version: asset.master_key_version,
        };
        let content_key = self.key_vault.reveal(asset_id, &protected)?;
        let jwk: DeviceJwk = serde_json::from_value(session.public_jwk)?;
        Ok(IssuedKey {
            asset_id,
            wrapped_key: KeyVault::wrap_for_device(&jwk, &content_key)?,
            algorithm: "RSA-OAEP-256",
            expires_at: session.expires_at,
            plaintext_size: asset.plaintext_size,
            chunk_size: asset.chunk_size,
            chunk_count: asset.chunk_count,
            nonce_prefix: URL_SAFE_NO_PAD.encode(asset.nonce_prefix),
            cipher_sha256: asset.cipher_sha256,
            audio_format: asset.audio_format,
        })
    }

    fn hmac(&self, value: &[u8]) -> Vec<u8> {
        let mut mac = HmacSha256::new_from_slice(&self.hmac_key).expect("HMAC key length");
        mac.update(value);
        mac.finalize().into_bytes().to_vec()
    }
}

fn decode_sha256(value: &str) -> Result<[u8; 32], PlaybackError> {
    if value.len() != 64 {
        return Err(PlaybackError::InvalidFingerprint);
    }
    let mut output = [0_u8; 32];
    for (index, pair) in value.as_bytes().chunks_exact(2).enumerate() {
        let text = std::str::from_utf8(pair).map_err(|_| PlaybackError::InvalidFingerprint)?;
        output[index] =
            u8::from_str_radix(text, 16).map_err(|_| PlaybackError::InvalidFingerprint)?;
    }
    Ok(output)
}

fn validate_jwk(jwk: &DeviceJwk) -> Result<(), PlaybackError> {
    if jwk.kty != "RSA"
        || jwk.alg != "RSA-OAEP-256"
        || URL_SAFE_NO_PAD
            .decode(&jwk.n)
            .map_or(true, |n| n.len() != 256)
    {
        return Err(PlaybackError::InvalidDeviceKey);
    }
    Ok(())
}

fn jwk_thumbprint(jwk: &DeviceJwk) -> [u8; 32] {
    let canonical = format!(r#"{{"e":"{}","kty":"RSA","n":"{}"}}"#, jwk.e, jwk.n);
    Sha256::digest(canonical).into()
}

#[derive(Debug, Error)]
pub enum PlaybackError {
    #[error("不支持的指纹协议版本")]
    UnsupportedFingerprintVersion,
    #[error("指纹摘要格式无效")]
    InvalidFingerprint,
    #[error("设备公钥格式无效")]
    InvalidDeviceKey,
    #[error("播放会话无效或已过期")]
    InvalidSession,
    #[error("播放会话与当前设备不匹配")]
    FingerprintMismatch,
    #[error("歌曲已禁用或不存在")]
    TrackUnavailable,
    #[error("媒体资产数据损坏")]
    CorruptAsset,
    #[error(transparent)]
    Database(#[from] sqlx::Error),
    #[error(transparent)]
    KeyVault(#[from] KeyVaultError),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
}

#[cfg(test)]
mod tests {
    use super::CreateSession;

    const DEVICE_MODULUS: &str = "s4oiSYgRs5az8vTMB_UUz5ZcObFfh9tYE8qfSnmPcBxFAEivEh-j_VveKvMJj8prI0ZxvXuWsnu0q3LKDKyqGvVtrnUgdUfhxlXGm8jJnqXyY3XYoAD2U12KbzX4b3L_N4wPtzTyHMRXSNBr5VGz0fNPmCUZGV6URq2FQ2BdIE3zt7fUoJ7HNZ2LaLzlVUcmGRvtUcLPnqZ8d1_Kq5UwEqDhP8SKm8aPjB1fYUYXxQbwG7pETsKla7R4UvHye8A4ZBYR-HwPN23E59T3xvInYwhwY1jAUaSaQM3H2-3g3mdpOo8pRWNJO0nFQN5d6MSYbxVooJbmQ";

    #[test]
    fn creates_a_device_session_without_a_challenge_token() {
        let request = session_json();
        let parsed = serde_json::from_value::<CreateSession>(request);
        assert!(parsed.is_ok());
    }

    #[test]
    fn rejects_the_removed_challenge_field() {
        let mut request = session_json();
        request["turnstileToken"] = serde_json::json!("legacy-token");
        let parsed = serde_json::from_value::<CreateSession>(request);
        assert!(parsed.is_err());
    }

    fn session_json() -> serde_json::Value {
        serde_json::json!({
            "fingerprintSha256": "00".repeat(32),
            "fingerprintVersion": 1,
            "devicePublicKey": {
                "kty": "RSA",
                "alg": "RSA-OAEP-256",
                "n": DEVICE_MODULUS,
                "e": "AQAB"
            }
        })
    }
}
