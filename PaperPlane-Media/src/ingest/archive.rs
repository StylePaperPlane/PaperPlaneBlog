use std::{
    collections::HashSet,
    io::{Cursor, Read},
};

use thiserror::Error;
use zip::ZipArchive;

use crate::media_format::AudioFormat;

pub const MAX_ARCHIVE_BYTES: usize = 100 * 1024 * 1024;
pub const MAX_ENTRIES: usize = 32;
pub const MAX_EXTRACTED_BYTES: u64 = 128 * 1024 * 1024;

pub struct MusicArchive;

pub struct ImportedArchive {
    pub audio: Vec<u8>,
    pub audio_format: AudioFormat,
    pub lyric: Option<Vec<u8>>,
    pub cover: Option<(String, Vec<u8>)>,
}

impl MusicArchive {
    pub fn read(bytes: Vec<u8>) -> Result<ImportedArchive, ArchiveError> {
        if bytes.len() > MAX_ARCHIVE_BYTES {
            return Err(ArchiveError::ArchiveTooLarge);
        }
        let mut archive =
            ZipArchive::new(Cursor::new(bytes)).map_err(|_| ArchiveError::InvalidZip)?;
        if archive.len() > MAX_ENTRIES {
            return Err(ArchiveError::TooManyEntries);
        }
        let mut seen = HashSet::new();
        let mut extracted = 0_u64;
        let mut audio: Option<(AudioFormat, Vec<u8>)> = None;
        let mut lyric = None;
        let mut cover = None;

        for index in 0..archive.len() {
            let file = archive
                .by_index(index)
                .map_err(|_| ArchiveError::InvalidZip)?;
            if file.is_dir() {
                continue;
            }
            let enclosed = file.enclosed_name().ok_or(ArchiveError::PathTraversal)?;
            let name = enclosed
                .file_name()
                .and_then(|value| value.to_str())
                .ok_or(ArchiveError::InvalidName)?;
            let normalized = name.to_ascii_lowercase();
            if !seen.insert(normalized.clone()) {
                return Err(ArchiveError::DuplicateName(name.to_owned()));
            }
            extracted = extracted
                .checked_add(file.size())
                .ok_or(ArchiveError::ExtractedTooLarge)?;
            if extracted > MAX_EXTRACTED_BYTES {
                return Err(ArchiveError::ExtractedTooLarge);
            }
            let extension = enclosed
                .extension()
                .and_then(|value| value.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();
            let mut content = Vec::with_capacity(file.size() as usize);
            file.take(MAX_EXTRACTED_BYTES + 1)
                .read_to_end(&mut content)?;
            match AudioFormat::from_extension(&extension) {
                Some(format) if audio.is_none() => audio = Some((format, content)),
                Some(_) => return Err(ArchiveError::DuplicateAudio),
                None => match extension.as_str() {
                    "lrc" if lyric.is_none() => lyric = Some(content),
                    "lrc" => return Err(ArchiveError::DuplicateLyric),
                    "jpg" | "jpeg" | "png" | "webp" if cover.is_none() => {
                        cover = Some((extension, content))
                    }
                    "jpg" | "jpeg" | "png" | "webp" => return Err(ArchiveError::DuplicateCover),
                    _ => return Err(ArchiveError::UnsupportedFile(name.to_owned())),
                },
            }
        }
        let (audio_format, audio) = audio.ok_or(ArchiveError::MissingAudio)?;
        if !audio_format.validates(&audio) {
            return Err(ArchiveError::InvalidAudio(audio_format));
        }
        Ok(ImportedArchive {
            audio,
            audio_format,
            lyric,
            cover,
        })
    }
}

#[derive(Debug, Error)]
pub enum ArchiveError {
    #[error("ZIP 文件超过 100MB")]
    ArchiveTooLarge,
    #[error("ZIP 格式无效")]
    InvalidZip,
    #[error("ZIP 条目超过 32 个")]
    TooManyEntries,
    #[error("ZIP 解压后内容超过 128MB")]
    ExtractedTooLarge,
    #[error("ZIP 包含不安全路径")]
    PathTraversal,
    #[error("ZIP 文件名无效")]
    InvalidName,
    #[error("ZIP 内文件名重复: {0}")]
    DuplicateName(String),
    #[error("ZIP 只能包含一个 MP3 或 FLAC 音频文件")]
    DuplicateAudio,
    #[error("ZIP 只能包含一个歌词文件")]
    DuplicateLyric,
    #[error("ZIP 只能包含一个封面")]
    DuplicateCover,
    #[error("ZIP 缺少 MP3 或 FLAC 音频文件")]
    MissingAudio,
    #[error("{0:?} 文件头无效")]
    InvalidAudio(AudioFormat),
    #[error("ZIP 包含不支持的文件: {0}")]
    UnsupportedFile(String),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}
