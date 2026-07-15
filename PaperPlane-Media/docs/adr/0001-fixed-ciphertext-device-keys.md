# ADR 0001: Fixed ciphertext with device-wrapped content keys

Status: accepted

## Decision

Encrypt each MP3 once into an immutable PPM1 object. Each 256 KiB plaintext chunk uses AES-256-GCM with an independent nonce and authenticated header metadata. Publish the object at its full SHA-256 path and allow long-lived shared caching. Authorize playback separately by wrapping the stored content key to a browser-generated, non-extractable RSA-OAEP public key.

## Consequences

The same ciphertext URL is reusable across devices and can achieve a Cloudflare cache hit. Disabling a track stops new key issuance but cannot revoke a key already issued for the current 12-hour session. Immediate revocation requires a new content key, ciphertext and hash. This raises scraping cost and prevents casual hotlinking; it is not DRM and cannot prevent recording or extraction on an authorized device.
