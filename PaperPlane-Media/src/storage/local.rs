use std::{
    fs, io,
    path::{Path, PathBuf},
};

use sha2::{Digest, Sha256};
use tempfile::NamedTempFile;
use thiserror::Error;

#[derive(Clone)]
pub struct LocalObjectStorage {
    root: PathBuf,
}

pub struct StoredObject {
    pub sha256: String,
    pub relative_path: String,
}

impl LocalObjectStorage {
    pub fn new(root: impl Into<PathBuf>) -> Result<Self, StorageError> {
        let root = root.into();
        fs::create_dir_all(&root)?;
        Ok(Self { root })
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn publish_bytes(
        &self,
        kind: &str,
        extension: &str,
        bytes: &[u8],
    ) -> Result<StoredObject, StorageError> {
        validate_segment(kind)?;
        validate_segment(extension)?;
        let sha256 = hex_digest(bytes);
        let relative_path = format!("{kind}/{sha256}.{extension}");
        self.atomic_write(&relative_path, bytes)?;
        Ok(StoredObject {
            sha256,
            relative_path,
        })
    }

    pub fn publish_file(
        &self,
        kind: &str,
        extension: &str,
        source: &Path,
    ) -> Result<StoredObject, StorageError> {
        validate_segment(kind)?;
        validate_segment(extension)?;
        let bytes = fs::read(source)?;
        self.publish_bytes(kind, extension, &bytes)
    }

    pub fn delete_managed(&self, relative_path: &str) -> Result<(), StorageError> {
        let candidate = self.root.join(relative_path);
        let canonical_root = self.root.canonicalize()?;
        let parent = candidate.parent().ok_or(StorageError::UnsafePath)?;
        fs::create_dir_all(parent)?;
        let canonical_parent = parent.canonicalize()?;
        if !canonical_parent.starts_with(&canonical_root) {
            return Err(StorageError::UnsafePath);
        }
        match fs::remove_file(candidate) {
            Ok(()) => Ok(()),
            Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(()),
            Err(error) => Err(error.into()),
        }
    }

    fn atomic_write(&self, relative_path: &str, bytes: &[u8]) -> Result<(), StorageError> {
        let destination = self.root.join(relative_path);
        if destination.exists() {
            make_publicly_readable(&destination)?;
            return Ok(());
        }
        let parent = destination.parent().ok_or(StorageError::UnsafePath)?;
        fs::create_dir_all(parent)?;
        let mut temp = NamedTempFile::new_in(parent)?;
        io::Write::write_all(&mut temp, bytes)?;
        temp.as_file().sync_all()?;
        match temp.persist_noclobber(&destination) {
            Ok(_) => make_publicly_readable(&destination),
            Err(error) if error.error.kind() == io::ErrorKind::AlreadyExists => {
                make_publicly_readable(&destination)
            }
            Err(error) => Err(error.error.into()),
        }
    }
}

#[cfg(unix)]
fn make_publicly_readable(path: &Path) -> Result<(), StorageError> {
    use std::os::unix::fs::PermissionsExt;

    fs::set_permissions(path, fs::Permissions::from_mode(0o644))?;
    Ok(())
}

#[cfg(not(unix))]
fn make_publicly_readable(_path: &Path) -> Result<(), StorageError> {
    Ok(())
}

fn validate_segment(value: &str) -> Result<(), StorageError> {
    if value.is_empty()
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-')
    {
        return Err(StorageError::UnsafePath);
    }
    Ok(())
}

fn hex_digest(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("object path is outside the managed storage root")]
    UnsafePath,
    #[error(transparent)]
    Io(#[from] io::Error),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn uses_content_hash_paths_and_is_idempotent() {
        let temp = tempfile::tempdir().unwrap();
        let storage = LocalObjectStorage::new(temp.path()).unwrap();
        let first = storage
            .publish_bytes("covers", "jpg", b"same content")
            .unwrap();
        let second = storage
            .publish_bytes("covers", "jpg", b"same content")
            .unwrap();
        assert_eq!(first.relative_path, second.relative_path);
        assert!(temp.path().join(first.relative_path).is_file());
    }

    #[test]
    fn refuses_path_traversal() {
        let temp = tempfile::tempdir().unwrap();
        let storage = LocalObjectStorage::new(temp.path()).unwrap();
        assert!(matches!(
            storage.publish_bytes("../outside", "jpg", b"x"),
            Err(StorageError::UnsafePath)
        ));
    }
}
