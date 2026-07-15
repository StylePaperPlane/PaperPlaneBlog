mod error;
mod handlers;
mod rate_limit;
mod response;

use std::{sync::Arc, time::Duration};

use axum::{
    Router,
    extract::DefaultBodyLimit,
    http::{HeaderName, HeaderValue, Method, header},
    routing::{get, patch, post},
};
use sqlx::postgres::PgPoolOptions;
use tower_http::{
    cors::{AllowOrigin, CorsLayer},
    trace::TraceLayer,
};

use crate::{
    Settings, auth::CoreAdminAuth, catalog::CatalogService, crypto::KeyVault,
    ingest::MusicPublisher, persistence::MediaRepository, playback::PlaybackService,
    storage::LocalObjectStorage,
};

pub use error::ApiError;
pub use handlers::AppState;
use rate_limit::RequestLimits;

pub async fn build_app(settings: Settings) -> anyhow::Result<Router> {
    let migration_pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&settings.migration_database_url)
        .await?;
    sqlx::migrate!().run(&migration_pool).await?;
    migration_pool.close().await;
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&settings.database_url)
        .await?;
    let repository = MediaRepository::new(pool);
    let storage = LocalObjectStorage::new(&settings.object_root)?;
    std::fs::create_dir_all(&settings.upload_root)?;
    let key_vault = KeyVault::new(settings.master_key, settings.master_key_version);
    let catalog = CatalogService::new(repository.clone(), settings.public_base_url.clone());
    let playback = PlaybackService::new(
        repository.clone(),
        key_vault.clone(),
        settings.session_hmac_key,
        settings.session_hours,
    );
    let state = Arc::new(AppState {
        catalog,
        playback,
        publisher: MusicPublisher::new(repository.clone(), storage.clone(), key_vault),
        repository,
        storage,
        admin_auth: CoreAdminAuth::new(
            settings.core_introspect_url,
            settings.internal_service_token,
        ),
        secure_cookies: settings.secure_cookies,
        limits: RequestLimits::production_defaults(),
    });

    let origins = settings
        .allowed_origins
        .iter()
        .map(|origin| origin.parse::<HeaderValue>())
        .collect::<Result<Vec<_>, _>>()?;
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_credentials(true)
        .allow_methods([
            Method::GET,
            Method::HEAD,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            header::RANGE,
            HeaderName::from_static("x-media-fingerprint"),
        ])
        .expose_headers([
            header::ACCEPT_RANGES,
            header::CONTENT_LENGTH,
            header::CONTENT_RANGE,
            header::ETAG,
        ]);

    Ok(Router::new()
        .route("/health", get(handlers::health))
        .route("/openapi.json", get(handlers::openapi))
        .route("/v1/tracks", get(handlers::public_tracks))
        .route("/v1/playback/sessions", post(handlers::create_session))
        .route("/v1/playback/tracks/{asset_id}/key", post(handlers::issue_key))
        .route("/v1/admin/tracks", get(handlers::admin_tracks).post(handlers::upload_track).delete(handlers::delete_tracks))
        .route("/v1/admin/tracks/{id}", patch(handlers::patch_track))
        .route("/assets/{name}", get(handlers::get_asset).head(handlers::head_asset))
        .route("/covers/{name}", get(handlers::get_cover).head(handlers::head_cover))
        .route("/lyrics/{name}", get(handlers::get_lyric).head(handlers::head_lyric))
        .layer(DefaultBodyLimit::max(101 * 1024 * 1024))
        .layer(cors)
        .layer(TraceLayer::new_for_http().make_span_with(|request: &http::Request<_>| {
            tracing::info_span!("http_request", method = %request.method(), path = %request.uri().path())
        }).on_response(|response: &http::Response<_>, latency: Duration, _span: &tracing::Span| {
            tracing::info!(status = %response.status(), latency_ms = latency.as_millis(), "request complete");
        }))
        .with_state(state))
}
