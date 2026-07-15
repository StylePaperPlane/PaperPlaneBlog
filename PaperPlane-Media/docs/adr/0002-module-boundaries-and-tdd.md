# ADR 0002: Deep modules and vertical public-seam tests

Status: accepted

## Decision

Keep one Cargo crate with library, server and operations binaries. Organize code by catalog, ingest, crypto, playback, auth, persistence, storage and HTTP boundaries. Prefer small public APIs backed by substantial implementations. Test vertical behavior at the PPM1, archive ingestion, playback authorization, HTTP contract and virtual media Range seams.

## Consequences

Internal refactoring does not require a proliferation of shallow traits or mirrored test doubles. PostgreSQL integration tests can use a real temporary database, while Core JWT introspection remains an explicit external adapter.
