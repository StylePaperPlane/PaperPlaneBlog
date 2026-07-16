use std::sync::Arc;

use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use serde::Deserialize;

use super::{ApiError, handlers, handlers::AppState, response};

#[derive(Debug, Deserialize)]
pub struct PlaylistNameRequest {
    name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplacePlaylistTracksRequest {
    track_ids: Vec<i64>,
}

pub async fn public_catalog(State(state): State<Arc<AppState>>) -> Result<Response, ApiError> {
    Ok(response::json(state.catalog.public_catalog().await?))
}

pub async fn admin_playlists(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    handlers::authorize(&state, &headers).await?;
    Ok(response::json(state.playlists.admin_playlists().await?))
}

pub async fn create_playlist(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<PlaylistNameRequest>,
) -> Result<Response, ApiError> {
    handlers::authorize(&state, &headers).await?;
    let playlist = state.playlists.create(&request.name).await?;
    Ok((StatusCode::CREATED, response::json(playlist)).into_response())
}

pub async fn rename_playlist(
    State(state): State<Arc<AppState>>,
    Path(playlist_id): Path<i64>,
    headers: HeaderMap,
    Json(request): Json<PlaylistNameRequest>,
) -> Result<Response, ApiError> {
    handlers::authorize(&state, &headers).await?;
    Ok(response::json(
        state.playlists.rename(playlist_id, &request.name).await?,
    ))
}

pub async fn replace_playlist_tracks(
    State(state): State<Arc<AppState>>,
    Path(playlist_id): Path<i64>,
    headers: HeaderMap,
    Json(request): Json<ReplacePlaylistTracksRequest>,
) -> Result<Response, ApiError> {
    handlers::authorize(&state, &headers).await?;
    Ok(response::json(
        state
            .playlists
            .replace_tracks(playlist_id, request.track_ids)
            .await?,
    ))
}

pub async fn delete_playlist(
    State(state): State<Arc<AppState>>,
    Path(playlist_id): Path<i64>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    handlers::authorize(&state, &headers).await?;
    state.playlists.delete(playlist_id).await?;
    Ok(response::json(serde_json::json!({"deleted": true})))
}
