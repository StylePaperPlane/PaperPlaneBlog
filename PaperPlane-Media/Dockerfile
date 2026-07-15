FROM rust:1.96-bookworm AS build
WORKDIR /build
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations
COPY contracts ./contracts
RUN cargo build --release --locked --bins

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
RUN useradd --system --uid 10001 --create-home media
WORKDIR /app
COPY --from=build /build/target/release/paperplane-media /usr/local/bin/paperplane-media
COPY --from=build /build/target/release/mediactl /usr/local/bin/mediactl
RUN mkdir -p /data/objects /data/tmp && chown -R media:media /data
USER media
EXPOSE 8090
HEALTHCHECK --interval=10s --timeout=3s --retries=10 CMD curl --fail http://127.0.0.1:8090/health || exit 1
ENTRYPOINT ["paperplane-media"]
