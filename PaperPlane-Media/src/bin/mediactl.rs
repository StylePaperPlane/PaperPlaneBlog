use std::{
    fs,
    io::{Cursor, Write},
    path::{Path, PathBuf},
};

use anyhow::{Context, Result, bail};
use base64::{Engine, engine::general_purpose::STANDARD};
use clap::{Parser, Subcommand};
use paperplane_media::{
    crypto::{KeyVault, ProtectedKey},
    ingest::{MusicPublisher, PublishRequest},
    persistence::{AssetRecord, MediaRepository},
    storage::LocalObjectStorage,
};
use sqlx::{PgPool, postgres::PgPoolOptions};
use zip::{ZipWriter, write::SimpleFileOptions};

#[derive(Parser)]
#[command(
    name = "mediactl",
    about = "PaperPlane Media migration and key operations"
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    ImportLegacy(ImportLegacy),
    RotateMasterKey(RotateMasterKey),
    PurgeExpiredSessions(DatabaseArgs),
}

#[derive(clap::Args)]
struct DatabaseArgs {
    #[arg(long, env = "MIGRATION_DATABASE_URL")]
    database_url: String,
}

#[derive(clap::Args)]
struct ImportLegacy {
    #[arg(long, env = "MIGRATION_DATABASE_URL")]
    database_url: String,
    #[arg(long, default_value = "../PaperPlane-Blog/public/music")]
    music_root: PathBuf,
    #[arg(long, default_value = "../PaperPlane-Core/upload-dir")]
    uploads_root: PathBuf,
    #[arg(long, default_value = "data/objects")]
    object_root: PathBuf,
    #[arg(long, env = "MEDIA_MASTER_KEY")]
    master_key: String,
    #[arg(long, env = "MEDIA_MASTER_KEY_VERSION", default_value_t = 1)]
    master_key_version: i32,
    #[arg(long, conflicts_with = "apply")]
    dry_run: bool,
    #[arg(long, conflicts_with = "dry_run")]
    apply: bool,
}

#[derive(clap::Args)]
struct RotateMasterKey {
    #[arg(long, env = "MIGRATION_DATABASE_URL")]
    database_url: String,
    #[arg(long, env = "MEDIA_MASTER_KEY")]
    from_key: String,
    #[arg(long, env = "MEDIA_MASTER_KEY_VERSION")]
    from_version: i32,
    #[arg(long, env = "MEDIA_NEW_MASTER_KEY")]
    to_key: String,
    #[arg(long, env = "MEDIA_NEW_MASTER_KEY_VERSION")]
    to_version: i32,
}

#[derive(sqlx::FromRow)]
struct LegacyTrack {
    music_key: i64,
    title: String,
    artist: Option<String>,
    audio_url: String,
    cover_url: String,
    lyric_url: String,
    sort_order: i32,
    enabled: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.command {
        Command::ImportLegacy(args) => import_legacy(args).await,
        Command::RotateMasterKey(args) => rotate_master_key(args).await,
        Command::PurgeExpiredSessions(args) => {
            let repository = MediaRepository::new(connect(&args.database_url).await?);
            println!(
                "purged {} expired sessions",
                repository.purge_expired_sessions().await?
            );
            Ok(())
        }
    }
}

async fn import_legacy(args: ImportLegacy) -> Result<()> {
    if !args.apply && !args.dry_run {
        bail!("choose exactly one of --dry-run or --apply");
    }
    let pool = connect(&args.database_url).await?;
    sqlx::migrate!().run(&pool).await?;
    let rows = sqlx::query_as::<_, LegacyTrack>("SELECT music_key::bigint,title,artist,audio_url,cover_url,lyric_url,sort_order,enabled FROM public.music_tracks ORDER BY music_key")
        .fetch_all(&pool).await.context("legacy music_tracks table could not be read")?;
    let repository = MediaRepository::new(pool);
    let publisher = MusicPublisher::new(
        repository.clone(),
        LocalObjectStorage::new(&args.object_root)?,
        KeyVault::new(decode_key(&args.master_key)?, args.master_key_version),
    );
    let mut imported = 0_usize;
    for row in rows {
        if repository.track_id_exists(row.music_key).await? {
            println!("skip music_key={} (already imported)", row.music_key);
            continue;
        }
        let audio = resolve_legacy_path(&row.audio_url, &args.music_root, &args.uploads_root)?;
        let cover = resolve_legacy_path(&row.cover_url, &args.music_root, &args.uploads_root).ok();
        let lyric = resolve_legacy_path(&row.lyric_url, &args.music_root, &args.uploads_root).ok();
        if args.dry_run {
            fs::metadata(&audio).with_context(|| format!("missing audio {}", audio.display()))?;
            println!(
                "would import music_key={} title={} audio={}",
                row.music_key,
                row.title,
                audio.display()
            );
            continue;
        }
        let archive = make_archive(&audio, cover.as_deref(), lyric.as_deref())?;
        publisher
            .publish(PublishRequest {
                archive,
                music_key: Some(row.music_key),
                title: row.title,
                artist: row
                    .artist
                    .filter(|value| !value.trim().is_empty())
                    .unwrap_or_else(|| "未知歌手".to_owned()),
                sort_order: row.sort_order,
                enabled: row.enabled,
            })
            .await
            .with_context(|| format!("failed to import music_key={}", row.music_key))?;
        imported += 1;
    }
    println!("legacy import complete: {imported} new tracks");
    Ok(())
}

async fn rotate_master_key(args: RotateMasterKey) -> Result<()> {
    if args.to_version <= args.from_version {
        bail!("new master key version must be greater than the old version");
    }
    let pool = connect(&args.database_url).await?;
    let old = KeyVault::new(decode_key(&args.from_key)?, args.from_version);
    let new = KeyVault::new(decode_key(&args.to_key)?, args.to_version);
    let mut tx = pool.begin().await?;
    let assets = sqlx::query_as::<_, AssetRecord>("SELECT asset_id,cipher_sha256,plaintext_size,chunk_size,chunk_count,nonce_prefix,encrypted_key,key_nonce,master_key_version FROM media.assets WHERE master_key_version=$1 FOR UPDATE")
        .bind(args.from_version).fetch_all(&mut *tx).await?;
    for asset in &assets {
        let nonce: [u8; 12] = asset
            .key_nonce
            .as_slice()
            .try_into()
            .context("invalid stored key nonce")?;
        let key = old.reveal(
            asset.asset_id,
            &ProtectedKey {
                ciphertext: asset.encrypted_key.clone(),
                nonce,
                version: asset.master_key_version,
            },
        )?;
        let protected = new.protect(asset.asset_id, &key)?;
        sqlx::query("UPDATE media.assets SET encrypted_key=$2,key_nonce=$3,master_key_version=$4 WHERE asset_id=$1")
            .bind(asset.asset_id).bind(protected.ciphertext).bind(protected.nonce.to_vec()).bind(protected.version).execute(&mut *tx).await?;
    }
    tx.commit().await?;
    println!(
        "rewrapped {} content keys; media ciphertext was not changed",
        assets.len()
    );
    Ok(())
}

async fn connect(url: &str) -> Result<PgPool> {
    PgPoolOptions::new()
        .max_connections(4)
        .connect(url)
        .await
        .context("PostgreSQL connection failed")
}

fn decode_key(encoded: &str) -> Result<[u8; 32]> {
    STANDARD
        .decode(encoded)?
        .try_into()
        .map_err(|_| anyhow::anyhow!("master key must decode to 32 bytes"))
}

fn resolve_legacy_path(url: &str, music_root: &Path, uploads_root: &Path) -> Result<PathBuf> {
    let decoded = url.replace("%20", " ");
    if let Some(relative) = decoded.strip_prefix("/music/") {
        return Ok(music_root.join(relative));
    }
    if let Some(relative) = decoded.strip_prefix("/uploads/") {
        return Ok(uploads_root.join(relative));
    }
    let path = PathBuf::from(&decoded);
    if path.is_absolute() {
        return Ok(path);
    }
    bail!("unsupported legacy path: {url}")
}

fn make_archive(audio: &Path, cover: Option<&Path>, lyric: Option<&Path>) -> Result<Vec<u8>> {
    let output = Cursor::new(Vec::new());
    let mut zip = ZipWriter::new(output);
    let extension = audio
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_ascii_lowercase)
        .filter(|value| value == "mp3" || value == "flac")
        .context("legacy audio must be MP3 or FLAC")?;
    add_file(&mut zip, &format!("track.{extension}"), audio)?;
    if let Some(path) = cover
        && path.is_file()
    {
        let extension = path
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or("jpg");
        add_file(&mut zip, &format!("cover.{extension}"), path)?;
    }
    if let Some(path) = lyric
        && path.is_file()
    {
        add_file(&mut zip, "track.lrc", path)?;
    }
    Ok(zip.finish()?.into_inner())
}

fn add_file(zip: &mut ZipWriter<Cursor<Vec<u8>>>, name: &str, path: &Path) -> Result<()> {
    zip.start_file(name, SimpleFileOptions::default())?;
    zip.write_all(&fs::read(path)?)?;
    Ok(())
}
