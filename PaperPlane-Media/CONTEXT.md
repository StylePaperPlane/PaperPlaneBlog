# PaperPlane Media context

PaperPlane Media is the only owner of music catalog administration, ingestion, encrypted-object publication and playback-key authorization. PaperPlane Core only validates administrator JWTs through its Docker-internal introspection endpoint. The blog player receives explicit MP3 or FLAC metadata plus an immutable PPM1 ciphertext URL; it does not know storage paths or raw content keys.

The public catalog is exposed only through `GET /v1/catalog`. Track metadata is normalized once and playlists reference ordered `trackIds`; the frontend constructs the virtual `all` playlist locally. Do not restore `/v1/tracks` or add a compatibility fallback. Empty playlists remain admin-only, while disabled tracks keep their memberships but are filtered from the public catalog.

The service is intentionally a single deep Rust crate. HTTP adapters depend on catalog, ingest and playback services; those services depend on the PostgreSQL repository, local object storage and crypto modules. Avoid creating one-trait-per-struct abstractions. Add a trait only where an external boundary needs a test adapter.

Security properties and limits:

- PPM1 objects are immutable, fixed ciphertext suitable for a shared CDN cache.
- Per-track content keys are wrapped at rest by a versioned master key and for playback by an RSA-OAEP-256 device key.
- Browser fingerprint hashes are a risk signal, not an authentication secret or DRM mechanism.
- ZIP uploads are limited to 100 MiB, 32 entries and 128 MiB extracted data.
- Session, key and upload endpoints are no-store and rate limited.
- Secrets, JWTs, raw fingerprints and content keys must never enter logs.

Run `cargo test`, `cargo clippy --all-targets -- -D warnings` and the frontend contract check before deployment.
