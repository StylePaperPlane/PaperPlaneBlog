use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum AudioFormat {
    Mp3,
    Flac,
}

impl AudioFormat {
    pub fn from_extension(extension: &str) -> Option<Self> {
        match extension.to_ascii_lowercase().as_str() {
            "mp3" => Some(Self::Mp3),
            "flac" => Some(Self::Flac),
            _ => None,
        }
    }

    pub const fn extension(self) -> &'static str {
        match self {
            Self::Mp3 => "mp3",
            Self::Flac => "flac",
        }
    }

    pub fn validates(self, bytes: &[u8]) -> bool {
        match self {
            Self::Mp3 => {
                bytes.starts_with(b"ID3")
                    || bytes
                        .windows(2)
                        .take(4096)
                        .any(|pair| pair[0] == 0xff && pair[1] & 0xe0 == 0xe0)
            }
            Self::Flac => bytes.starts_with(b"fLaC"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::AudioFormat;

    #[test]
    fn validates_each_format_by_its_own_signature() {
        assert!(AudioFormat::Mp3.validates(b"ID3 payload"));
        assert!(AudioFormat::Flac.validates(b"fLaC payload"));
        assert!(!AudioFormat::Mp3.validates(b"fLaC payload"));
        assert!(!AudioFormat::Flac.validates(b"ID3 payload"));
    }
}
