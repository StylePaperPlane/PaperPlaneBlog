use std::io::{Read, Seek, SeekFrom, Write};

use aes_gcm::{
    Aes256Gcm, KeyInit,
    aead::{Aead, Payload},
};
use rand::Rng;
use thiserror::Error;
use uuid::Uuid;
use zeroize::{Zeroize, ZeroizeOnDrop};

pub const HEADER_LEN: usize = 64;
pub const DEFAULT_CHUNK_SIZE: u32 = 256 * 1024;
const TAG_LEN: u64 = 16;
const MAGIC: &[u8; 4] = b"PPM1";
const VERSION: u8 = 1;

#[derive(Clone, Zeroize, ZeroizeOnDrop)]
pub struct AssetKey([u8; 32]);

impl AssetKey {
    pub fn generate() -> Self {
        let mut key = [0_u8; 32];
        rand::rng().fill_bytes(&mut key);
        Self(key)
    }

    pub fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    pub fn expose(&self) -> &[u8; 32] {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ppm1Header {
    pub chunk_size: u32,
    pub plaintext_size: u64,
    pub chunk_count: u32,
    pub nonce_prefix: [u8; 8],
    pub asset_id: Uuid,
}

impl Ppm1Header {
    pub fn new(
        asset_id: Uuid,
        plaintext_size: u64,
        chunk_size: u32,
        nonce_prefix: [u8; 8],
    ) -> Result<Self, Ppm1Error> {
        if chunk_size == 0 {
            return Err(Ppm1Error::InvalidChunkSize);
        }
        let chunks = plaintext_size.div_ceil(u64::from(chunk_size));
        let chunk_count = u32::try_from(chunks).map_err(|_| Ppm1Error::AssetTooLarge)?;
        Ok(Self {
            chunk_size,
            plaintext_size,
            chunk_count,
            nonce_prefix,
            asset_id,
        })
    }

    pub fn encode(&self) -> [u8; HEADER_LEN] {
        let mut bytes = [0_u8; HEADER_LEN];
        bytes[0..4].copy_from_slice(MAGIC);
        bytes[4] = VERSION;
        bytes[5] = 0;
        bytes[6..8].copy_from_slice(&(HEADER_LEN as u16).to_be_bytes());
        bytes[8..12].copy_from_slice(&self.chunk_size.to_be_bytes());
        bytes[12..20].copy_from_slice(&self.plaintext_size.to_be_bytes());
        bytes[20..24].copy_from_slice(&self.chunk_count.to_be_bytes());
        bytes[24..32].copy_from_slice(&self.nonce_prefix);
        bytes[32..48].copy_from_slice(self.asset_id.as_bytes());
        bytes
    }

    pub fn decode(bytes: &[u8]) -> Result<Self, Ppm1Error> {
        if bytes.len() != HEADER_LEN {
            return Err(Ppm1Error::InvalidHeaderLength);
        }
        if &bytes[0..4] != MAGIC {
            return Err(Ppm1Error::InvalidMagic);
        }
        if bytes[4] != VERSION {
            return Err(Ppm1Error::UnsupportedVersion(bytes[4]));
        }
        if u16::from_be_bytes([bytes[6], bytes[7]]) as usize != HEADER_LEN {
            return Err(Ppm1Error::InvalidHeaderLength);
        }
        if bytes[48..].iter().any(|byte| *byte != 0) {
            return Err(Ppm1Error::InvalidReservedBytes);
        }

        let chunk_size = u32::from_be_bytes(bytes[8..12].try_into().expect("fixed slice"));
        let plaintext_size = u64::from_be_bytes(bytes[12..20].try_into().expect("fixed slice"));
        let chunk_count = u32::from_be_bytes(bytes[20..24].try_into().expect("fixed slice"));
        let mut nonce_prefix = [0_u8; 8];
        nonce_prefix.copy_from_slice(&bytes[24..32]);
        let asset_id = Uuid::from_bytes(bytes[32..48].try_into().expect("fixed slice"));
        let decoded = Self::new(asset_id, plaintext_size, chunk_size, nonce_prefix)?;
        if decoded.chunk_count != chunk_count {
            return Err(Ppm1Error::InvalidChunkCount);
        }
        Ok(decoded)
    }

    pub fn plaintext_len(&self, chunk_index: u32) -> Result<u32, Ppm1Error> {
        if chunk_index >= self.chunk_count {
            return Err(Ppm1Error::ChunkOutOfBounds(chunk_index));
        }
        let start = u64::from(chunk_index) * u64::from(self.chunk_size);
        Ok((self.plaintext_size - start).min(u64::from(self.chunk_size)) as u32)
    }

    pub fn ciphertext_offset(&self, chunk_index: u32) -> Result<u64, Ppm1Error> {
        if chunk_index >= self.chunk_count {
            return Err(Ppm1Error::ChunkOutOfBounds(chunk_index));
        }
        Ok(HEADER_LEN as u64 + u64::from(chunk_index) * (u64::from(self.chunk_size) + TAG_LEN))
    }

    pub fn ciphertext_len(&self, chunk_index: u32) -> Result<u64, Ppm1Error> {
        Ok(u64::from(self.plaintext_len(chunk_index)?) + TAG_LEN)
    }

    fn nonce(&self, chunk_index: u32) -> [u8; 12] {
        let mut nonce = [0_u8; 12];
        nonce[0..8].copy_from_slice(&self.nonce_prefix);
        nonce[8..12].copy_from_slice(&chunk_index.to_be_bytes());
        nonce
    }

    fn aad(&self, chunk_index: u32, plaintext_len: u32) -> [u8; HEADER_LEN + 8] {
        let mut aad = [0_u8; HEADER_LEN + 8];
        aad[..HEADER_LEN].copy_from_slice(&self.encode());
        aad[HEADER_LEN..HEADER_LEN + 4].copy_from_slice(&chunk_index.to_be_bytes());
        aad[HEADER_LEN + 4..].copy_from_slice(&plaintext_len.to_be_bytes());
        aad
    }
}

pub struct Ppm1Writer;

impl Ppm1Writer {
    pub fn encrypt<R: Read, W: Write>(
        mut source: R,
        mut destination: W,
        plaintext_size: u64,
        asset_id: Uuid,
        key: &AssetKey,
    ) -> Result<Ppm1Header, Ppm1Error> {
        let mut nonce_prefix = [0_u8; 8];
        rand::rng().fill_bytes(&mut nonce_prefix);
        let header = Ppm1Header::new(asset_id, plaintext_size, DEFAULT_CHUNK_SIZE, nonce_prefix)?;
        destination.write_all(&header.encode())?;

        let cipher = Aes256Gcm::new_from_slice(key.expose()).expect("AES-256 key length");
        let mut buffer = vec![0_u8; header.chunk_size as usize];
        for chunk_index in 0..header.chunk_count {
            let expected = header.plaintext_len(chunk_index)? as usize;
            source.read_exact(&mut buffer[..expected])?;
            let nonce = header.nonce(chunk_index);
            let aad = header.aad(chunk_index, expected as u32);
            let encrypted = cipher
                .encrypt(
                    (&nonce).into(),
                    Payload {
                        msg: &buffer[..expected],
                        aad: &aad,
                    },
                )
                .map_err(|_| Ppm1Error::EncryptionFailed)?;
            destination.write_all(&encrypted)?;
        }

        let mut trailing = [0_u8; 1];
        if source.read(&mut trailing)? != 0 {
            return Err(Ppm1Error::SourceLengthMismatch);
        }
        Ok(header)
    }
}

pub struct Ppm1Reader<R> {
    source: R,
    header: Ppm1Header,
    cipher: Aes256Gcm,
}

impl<R: Read + Seek> Ppm1Reader<R> {
    pub fn open(mut source: R, key: &AssetKey) -> Result<Self, Ppm1Error> {
        let mut header_bytes = [0_u8; HEADER_LEN];
        source.read_exact(&mut header_bytes)?;
        let header = Ppm1Header::decode(&header_bytes)?;
        let cipher = Aes256Gcm::new_from_slice(key.expose()).expect("AES-256 key length");
        Ok(Self {
            source,
            header,
            cipher,
        })
    }

    pub fn header(&self) -> &Ppm1Header {
        &self.header
    }

    pub fn decrypt_chunk(&mut self, chunk_index: u32) -> Result<Vec<u8>, Ppm1Error> {
        let plaintext_len = self.header.plaintext_len(chunk_index)?;
        let ciphertext_len = self.header.ciphertext_len(chunk_index)? as usize;
        self.source
            .seek(SeekFrom::Start(self.header.ciphertext_offset(chunk_index)?))?;
        let mut encrypted = vec![0_u8; ciphertext_len];
        self.source.read_exact(&mut encrypted)?;
        let nonce = self.header.nonce(chunk_index);
        let aad = self.header.aad(chunk_index, plaintext_len);
        self.cipher
            .decrypt(
                (&nonce).into(),
                Payload {
                    msg: &encrypted,
                    aad: &aad,
                },
            )
            .map_err(|_| Ppm1Error::AuthenticationFailed(chunk_index))
    }

    pub fn decrypt_range(&mut self, range: ChunkRange) -> Result<Vec<u8>, Ppm1Error> {
        if range.start > range.end || range.end >= self.header.plaintext_size {
            return Err(Ppm1Error::InvalidRange);
        }
        let chunk_size = u64::from(self.header.chunk_size);
        let first = (range.start / chunk_size) as u32;
        let last = (range.end / chunk_size) as u32;
        let mut output = Vec::with_capacity((range.end - range.start + 1) as usize);
        for chunk_index in first..=last {
            let chunk = self.decrypt_chunk(chunk_index)?;
            let chunk_start = u64::from(chunk_index) * chunk_size;
            let take_start = range.start.saturating_sub(chunk_start) as usize;
            let take_end = ((range.end - chunk_start + 1) as usize).min(chunk.len());
            output.extend_from_slice(&chunk[take_start..take_end]);
        }
        Ok(output)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ChunkRange {
    pub start: u64,
    pub end: u64,
}

pub struct AssetCipher;

impl AssetCipher {
    pub fn encrypted_len(header: &Ppm1Header) -> u64 {
        HEADER_LEN as u64 + header.plaintext_size + u64::from(header.chunk_count) * TAG_LEN
    }
}

#[derive(Debug, Error)]
pub enum Ppm1Error {
    #[error("PPM1 magic is invalid")]
    InvalidMagic,
    #[error("PPM1 version {0} is not supported")]
    UnsupportedVersion(u8),
    #[error("PPM1 header length is invalid")]
    InvalidHeaderLength,
    #[error("PPM1 reserved header bytes must be zero")]
    InvalidReservedBytes,
    #[error("chunk size must be greater than zero")]
    InvalidChunkSize,
    #[error("chunk count does not match plaintext size")]
    InvalidChunkCount,
    #[error("asset is too large for the PPM1 format")]
    AssetTooLarge,
    #[error("chunk {0} is outside the asset")]
    ChunkOutOfBounds(u32),
    #[error("plaintext range is invalid")]
    InvalidRange,
    #[error("source length does not match the declared plaintext size")]
    SourceLengthMismatch,
    #[error("PPM1 encryption failed")]
    EncryptionFailed,
    #[error("PPM1 chunk {0} failed authentication")]
    AuthenticationFailed(u32),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use super::*;

    fn fixture(size: usize) -> (Vec<u8>, AssetKey, Uuid) {
        let plaintext = (0..size).map(|index| (index % 251) as u8).collect();
        (
            plaintext,
            AssetKey::from_bytes([0x42; 32]),
            Uuid::parse_str("9d2339dd-b023-4d89-8f36-7283e0312788").unwrap(),
        )
    }

    fn encrypt(plaintext: &[u8], key: &AssetKey, asset_id: Uuid) -> Vec<u8> {
        let mut encrypted = Vec::new();
        Ppm1Writer::encrypt(
            Cursor::new(plaintext),
            &mut encrypted,
            plaintext.len() as u64,
            asset_id,
            key,
        )
        .unwrap();
        encrypted
    }

    #[test]
    fn round_trips_first_middle_and_last_chunks() {
        let (plaintext, key, asset_id) = fixture(DEFAULT_CHUNK_SIZE as usize * 2 + 17);
        let encrypted = encrypt(&plaintext, &key, asset_id);
        let mut reader = Ppm1Reader::open(Cursor::new(encrypted), &key).unwrap();

        assert_eq!(reader.header().asset_id, asset_id);
        assert_eq!(
            reader.decrypt_chunk(0).unwrap(),
            plaintext[..DEFAULT_CHUNK_SIZE as usize]
        );
        assert_eq!(
            reader.decrypt_chunk(1).unwrap(),
            plaintext[DEFAULT_CHUNK_SIZE as usize..DEFAULT_CHUNK_SIZE as usize * 2]
        );
        assert_eq!(
            reader.decrypt_chunk(2).unwrap(),
            plaintext[DEFAULT_CHUNK_SIZE as usize * 2..]
        );
    }

    #[test]
    fn decrypts_ranges_crossing_chunk_boundaries() {
        let (plaintext, key, asset_id) = fixture(DEFAULT_CHUNK_SIZE as usize + 100);
        let encrypted = encrypt(&plaintext, &key, asset_id);
        let mut reader = Ppm1Reader::open(Cursor::new(encrypted), &key).unwrap();
        let start = u64::from(DEFAULT_CHUNK_SIZE) - 9;
        let end = u64::from(DEFAULT_CHUNK_SIZE) + 23;

        let actual = reader.decrypt_range(ChunkRange { start, end }).unwrap();

        assert_eq!(actual, plaintext[start as usize..=end as usize]);
    }

    #[test]
    fn rejects_ciphertext_tampering() {
        let (plaintext, key, asset_id) = fixture(1024);
        let mut encrypted = encrypt(&plaintext, &key, asset_id);
        encrypted[HEADER_LEN + 13] ^= 0xff;
        let mut reader = Ppm1Reader::open(Cursor::new(encrypted), &key).unwrap();

        assert!(matches!(
            reader.decrypt_chunk(0),
            Err(Ppm1Error::AuthenticationFailed(0))
        ));
    }

    #[test]
    fn rejects_header_tampering_before_decryption() {
        let (plaintext, key, asset_id) = fixture(1024);
        let mut encrypted = encrypt(&plaintext, &key, asset_id);
        encrypted[48] = 1;

        assert!(matches!(
            Ppm1Reader::open(Cursor::new(encrypted), &key),
            Err(Ppm1Error::InvalidReservedBytes)
        ));
    }

    #[test]
    fn rejects_the_wrong_key() {
        let (plaintext, key, asset_id) = fixture(1024);
        let encrypted = encrypt(&plaintext, &key, asset_id);
        let wrong_key = AssetKey::from_bytes([0x24; 32]);
        let mut reader = Ppm1Reader::open(Cursor::new(encrypted), &wrong_key).unwrap();

        assert!(matches!(
            reader.decrypt_chunk(0),
            Err(Ppm1Error::AuthenticationFailed(0))
        ));
    }
}
