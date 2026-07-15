use aes_gcm::{
    Aes256Gcm, KeyInit,
    aead::{Aead, Payload},
};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use rand::Rng;
use rsa::{BoxedUint, Oaep, RsaPublicKey, sha2::Sha256};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;

use super::AssetKey;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceJwk {
    pub kty: String,
    pub alg: String,
    pub n: String,
    pub e: String,
}

#[derive(Debug, Clone)]
pub struct ProtectedKey {
    pub ciphertext: Vec<u8>,
    pub nonce: [u8; 12],
    pub version: i32,
}

#[derive(Clone)]
pub struct KeyVault {
    master_key: [u8; 32],
    version: i32,
}

impl KeyVault {
    pub fn new(master_key: [u8; 32], version: i32) -> Self {
        Self {
            master_key,
            version,
        }
    }

    pub fn protect(&self, asset_id: Uuid, key: &AssetKey) -> Result<ProtectedKey, KeyVaultError> {
        let mut nonce = [0_u8; 12];
        rand::rng().fill_bytes(&mut nonce);
        let cipher = Aes256Gcm::new_from_slice(&self.master_key).expect("master key length");
        let ciphertext = cipher
            .encrypt(
                (&nonce).into(),
                Payload {
                    msg: key.expose(),
                    aad: &key_aad(asset_id, self.version),
                },
            )
            .map_err(|_| KeyVaultError::ProtectionFailed)?;
        Ok(ProtectedKey {
            ciphertext,
            nonce,
            version: self.version,
        })
    }

    pub fn reveal(
        &self,
        asset_id: Uuid,
        protected: &ProtectedKey,
    ) -> Result<AssetKey, KeyVaultError> {
        if protected.version != self.version {
            return Err(KeyVaultError::UnknownMasterKeyVersion(protected.version));
        }
        let cipher = Aes256Gcm::new_from_slice(&self.master_key).expect("master key length");
        let plaintext = cipher
            .decrypt(
                (&protected.nonce).into(),
                Payload {
                    msg: &protected.ciphertext,
                    aad: &key_aad(asset_id, protected.version),
                },
            )
            .map_err(|_| KeyVaultError::ProtectionFailed)?;
        let bytes: [u8; 32] = plaintext
            .try_into()
            .map_err(|_| KeyVaultError::InvalidKeyLength)?;
        Ok(AssetKey::from_bytes(bytes))
    }

    pub fn wrap_for_device(jwk: &DeviceJwk, key: &AssetKey) -> Result<String, KeyVaultError> {
        if jwk.kty != "RSA" || jwk.alg != "RSA-OAEP-256" {
            return Err(KeyVaultError::UnsupportedDeviceKey);
        }
        let modulus = URL_SAFE_NO_PAD.decode(&jwk.n)?;
        let exponent = URL_SAFE_NO_PAD.decode(&jwk.e)?;
        if modulus.len() != 256 || exponent.is_empty() || exponent.len() > 4 {
            return Err(KeyVaultError::UnsupportedDeviceKey);
        }
        let n = BoxedUint::from_be_slice(&modulus, 2048)
            .map_err(|_| KeyVaultError::UnsupportedDeviceKey)?;
        let mut exponent_padded = [0_u8; 4];
        exponent_padded[4 - exponent.len()..].copy_from_slice(&exponent);
        let e = BoxedUint::from_be_slice(&exponent_padded, 32)
            .map_err(|_| KeyVaultError::UnsupportedDeviceKey)?;
        let public = RsaPublicKey::new(n, e).map_err(|_| KeyVaultError::UnsupportedDeviceKey)?;
        let wrapped = public
            .encrypt(&mut rand::rng(), Oaep::<Sha256>::new(), key.expose())
            .map_err(|_| KeyVaultError::DeviceWrapFailed)?;
        Ok(URL_SAFE_NO_PAD.encode(wrapped))
    }
}

fn key_aad(asset_id: Uuid, version: i32) -> [u8; 20] {
    let mut aad = [0_u8; 20];
    aad[..16].copy_from_slice(asset_id.as_bytes());
    aad[16..].copy_from_slice(&version.to_be_bytes());
    aad
}

#[derive(Debug, Error)]
pub enum KeyVaultError {
    #[error("content key protection failed")]
    ProtectionFailed,
    #[error("content key length is invalid")]
    InvalidKeyLength,
    #[error("master key version {0} is not loaded")]
    UnknownMasterKeyVersion(i32),
    #[error("device public key must be a 2048-bit RSA-OAEP-256 JWK")]
    UnsupportedDeviceKey,
    #[error("content key could not be wrapped for this device")]
    DeviceWrapFailed,
    #[error(transparent)]
    Base64(#[from] base64::DecodeError),
}

#[cfg(test)]
mod tests {
    use rsa::traits::PublicKeyParts;

    use super::*;

    #[test]
    fn protects_and_reveals_content_keys() {
        let vault = KeyVault::new([7; 32], 3);
        let asset_id = Uuid::new_v4();
        let key = AssetKey::from_bytes([9; 32]);
        let protected = vault.protect(asset_id, &key).unwrap();
        let revealed = vault.reveal(asset_id, &protected).unwrap();
        assert_eq!(revealed.expose(), key.expose());
    }

    #[test]
    fn wraps_a_key_with_rsa_oaep_sha256() {
        let private = rsa::RsaPrivateKey::new(&mut rand::rng(), 2048).unwrap();
        let public = RsaPublicKey::from(&private);
        let exponent = public.e().to_be_bytes();
        let exponent = exponent
            .iter()
            .position(|byte| *byte != 0)
            .map(|index| &exponent[index..])
            .unwrap_or(&[0]);
        let jwk = DeviceJwk {
            kty: "RSA".into(),
            alg: "RSA-OAEP-256".into(),
            n: URL_SAFE_NO_PAD.encode(public.n().to_be_bytes()),
            e: URL_SAFE_NO_PAD.encode(exponent),
        };
        let key = AssetKey::from_bytes([0x55; 32]);
        let wrapped = KeyVault::wrap_for_device(&jwk, &key).unwrap();
        let ciphertext = URL_SAFE_NO_PAD.decode(wrapped).unwrap();
        let plaintext = private.decrypt(Oaep::<Sha256>::new(), &ciphertext).unwrap();
        assert_eq!(plaintext, key.expose());
    }
}
