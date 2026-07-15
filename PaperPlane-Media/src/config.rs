use std::{net::SocketAddr, path::PathBuf};

use anyhow::{Context, Result};
use base64::{Engine, engine::general_purpose::STANDARD};

#[derive(Clone)]
pub struct Settings {
    pub bind: SocketAddr,
    pub database_url: String,
    pub migration_database_url: String,
    pub object_root: PathBuf,
    pub upload_root: PathBuf,
    pub public_base_url: String,
    pub allowed_origins: Vec<String>,
    pub master_key: [u8; 32],
    pub master_key_version: i32,
    pub session_hmac_key: [u8; 32],
    pub session_hours: i64,
    pub secure_cookies: bool,
    pub core_introspect_url: String,
    pub internal_service_token: String,
}

impl Settings {
    pub fn from_env() -> Result<Self> {
        let environment = env("MEDIA_ENV", "development");
        let master_key = decode_key("MEDIA_MASTER_KEY")?;
        let session_hmac_key = decode_key("MEDIA_SESSION_HMAC_KEY")?;
        let database_url = required("DATABASE_URL")?;
        Ok(Self {
            bind: env("MEDIA_BIND", "127.0.0.1:8090")
                .parse()
                .context("MEDIA_BIND is invalid")?,
            migration_database_url: std::env::var("MIGRATION_DATABASE_URL")
                .unwrap_or_else(|_| database_url.clone()),
            database_url,
            object_root: env("MEDIA_OBJECT_ROOT", "data/objects").into(),
            upload_root: env("MEDIA_UPLOAD_ROOT", "data/tmp").into(),
            public_base_url: env("MEDIA_PUBLIC_BASE_URL", "http://localhost:8090"),
            allowed_origins: env(
                "MEDIA_ALLOWED_ORIGINS",
                "https://blog.paperplane.codes,http://localhost:5173,http://127.0.0.1:5173",
            )
            .split(',')
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToOwned::to_owned)
            .collect(),
            master_key,
            master_key_version: env("MEDIA_MASTER_KEY_VERSION", "1")
                .parse()
                .context("MEDIA_MASTER_KEY_VERSION is invalid")?,
            session_hmac_key,
            session_hours: env("MEDIA_SESSION_HOURS", "12")
                .parse()
                .context("MEDIA_SESSION_HOURS is invalid")?,
            secure_cookies: environment == "production",
            core_introspect_url: env(
                "CORE_INTROSPECT_URL",
                "http://paperplane_backend:8080/api/internal/auth/introspect",
            ),
            internal_service_token: required("PAPERPLANE_INTERNAL_SERVICE_TOKEN")?,
        })
    }
}

fn required(name: &str) -> Result<String> {
    std::env::var(name).with_context(|| format!("{name} is required"))
}

fn env(name: &str, default: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| default.to_owned())
}

fn decode_key(name: &str) -> Result<[u8; 32]> {
    let encoded = required(name)?;
    let bytes = STANDARD
        .decode(encoded)
        .with_context(|| format!("{name} must be base64"))?;
    bytes
        .try_into()
        .map_err(|_| anyhow::anyhow!("{name} must decode to exactly 32 bytes"))
}
