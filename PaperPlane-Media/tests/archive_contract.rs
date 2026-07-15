use std::io::{Cursor, Write};

use paperplane_media::ingest::{ArchiveError, MusicArchive};
use paperplane_media::media_format::AudioFormat;
use zip::{ZipWriter, write::SimpleFileOptions};

fn archive(entries: &[(&str, &[u8])]) -> Vec<u8> {
    let mut output = Cursor::new(Vec::new());
    {
        let mut zip = ZipWriter::new(&mut output);
        for (name, content) in entries {
            zip.start_file(*name, SimpleFileOptions::default()).unwrap();
            zip.write_all(content).unwrap();
        }
        zip.finish().unwrap();
    }
    output.into_inner()
}

#[test]
fn accepts_a_bounded_music_bundle() {
    let bytes = archive(&[
        ("song.mp3", b"ID3 valid enough"),
        ("song.lrc", b"[00:00]hello"),
        ("cover.jpg", b"image"),
    ]);
    let imported = MusicArchive::read(bytes).unwrap();
    assert_eq!(imported.audio, b"ID3 valid enough");
    assert_eq!(imported.audio_format, AudioFormat::Mp3);
    assert!(imported.lyric.is_some());
    assert!(imported.cover.is_some());
}

#[test]
fn accepts_a_flac_bundle_with_an_explicit_flac_signature() {
    let bytes = archive(&[
        ("song.flac", b"fLaC valid enough"),
        ("song.lrc", b"[00:00]lossless"),
        ("cover.webp", b"image"),
    ]);

    let imported = MusicArchive::read(bytes).unwrap();

    assert_eq!(imported.audio, b"fLaC valid enough");
    assert_eq!(imported.audio_format, AudioFormat::Flac);
}

#[test]
fn rejects_duplicate_audio_files() {
    let bytes = archive(&[("one.mp3", b"ID3 one"), ("two.flac", b"fLaC two")]);
    assert!(matches!(
        MusicArchive::read(bytes),
        Err(ArchiveError::DuplicateAudio)
    ));
}

#[test]
fn rejects_an_extension_and_signature_mismatch() {
    let bytes = archive(&[("song.flac", b"ID3 this is not FLAC")]);

    assert!(matches!(
        MusicArchive::read(bytes),
        Err(ArchiveError::InvalidAudio(AudioFormat::Flac))
    ));
}

#[test]
fn rejects_paths_that_escape_the_archive() {
    let bytes = archive(&[("../song.mp3", b"ID3 unsafe")]);
    assert!(matches!(
        MusicArchive::read(bytes),
        Err(ArchiveError::PathTraversal)
    ));
}
