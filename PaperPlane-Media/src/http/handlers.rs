use std::{net::IpAddr, sync::Arc};

use axum::{
    body::Body,
    extract::{ConnectInfo, Multipart, Path, State},
    http::{HeaderMap, HeaderValue, StatusCode, header},
    response::{IntoResponse, Response},
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    auth::CoreAdminAuth,
    catalog::CatalogService,
    ingest::{MusicPublisher, PublishRequest},
    persistence::{MediaRepository, TrackPatch},
    playback::{CreateSession, PlaybackService},
    storage::LocalObjectStorage,
};

use super::{ApiError, rate_limit::RequestLimits, response};

pub struct AppState {
    pub catalog: CatalogService,
    pub playback: PlaybackService,
    pub publisher: MusicPublisher,
    pub repository: MediaRepository,
    pub storage: LocalObjectStorage,
    pub admin_auth: CoreAdminAuth,
    pub secure_cookies: bool,
    pub limits: RequestLimits,
}

pub async fn health() -> Response {
    response::json(serde_json::json!({"status":"ok"}))
}

pub async fn openapi() -> Response {
    let mut response = Response::new(Body::from(include_str!("../../contracts/openapi.json")));
    response.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("application/json"),
    );
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    response
}

pub async fn public_tracks(State(state): State<Arc<AppState>>) -> Result<Response, ApiError> {
    Ok(response::json(state.catalog.public_tracks().await?))
}

pub async fn create_session(
    State(state): State<Arc<AppState>>,
    ConnectInfo(connect): ConnectInfo<std::net::SocketAddr>,
    headers: HeaderMap,
    axum::Json(request): axum::Json<CreateSession>,
) -> Result<Response, ApiError> {
    let remote_ip = forwarded_ip(&headers).unwrap_or_else(|| connect.ip());
    if !state.limits.allow_session(remote_ip) {
        return Err(ApiError::too_many_requests(
            "播放会话创建过于频繁，请稍后重试",
        ));
    }
    let created = state.playback.create_session(request).await?;
    let cookie_security = if state.secure_cookies {
        "Secure; SameSite=None"
    } else {
        "SameSite=Lax"
    };
    let cookie = format!(
        "ppm_session={}; Path=/v1/playback; Max-Age=43200; HttpOnly; {cookie_security}",
        created.cookie_token
    );
    let mut response = response::json(serde_json::json!({"expiresAt": created.expires_at}));
    response.headers_mut().insert(
        header::SET_COOKIE,
        HeaderValue::from_str(&cookie).map_err(|_| ApiError::internal("invalid session cookie"))?,
    );
    Ok(response)
}

pub async fn issue_key(
    State(state): State<Arc<AppState>>,
    Path(asset_id): Path<Uuid>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    let token =
        cookie(&headers, "ppm_session").ok_or_else(|| ApiError::unauthorized("播放会话不存在"))?;
    if !state.limits.allow_key(token) {
        return Err(ApiError::too_many_requests("设备取钥过于频繁，请稍后重试"));
    }
    let fingerprint = headers
        .get("x-media-fingerprint")
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| ApiError::bad_request("缺少设备指纹摘要"))?;
    Ok(response::json(
        state
            .playback
            .issue_key(token, asset_id, fingerprint)
            .await?,
    ))
}

pub async fn admin_tracks(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    authorize(&state, &headers).await?;
    Ok(response::json(state.catalog.admin_tracks().await?))
}

pub async fn upload_track(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    mut multipart: Multipart,
) -> Result<Response, ApiError> {
    authorize(&state, &headers).await?;
    let authorization = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| ApiError::unauthorized("缺少管理员令牌"))?;
    let _permit = state
        .limits
        .acquire_upload(authorization)
        .ok_or_else(|| ApiError::too_many_requests("当前管理员已有音乐上传任务"))?;
    let mut archive = None;
    let mut title = None;
    let mut artist = None;
    let mut sort_order = 0;
    let mut enabled = true;
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|error| ApiError::bad_request(error.to_string()))?
    {
        let name = field.name().unwrap_or_default().to_owned();
        match name.as_str() {
            "file" | "archive" => {
                archive = Some(
                    field
                        .bytes()
                        .await
                        .map_err(|error| ApiError::bad_request(error.to_string()))?
                        .to_vec(),
                )
            }
            "title" => {
                title = Some(
                    field
                        .text()
                        .await
                        .map_err(|error| ApiError::bad_request(error.to_string()))?,
                )
            }
            "artist" => {
                artist = Some(
                    field
                        .text()
                        .await
                        .map_err(|error| ApiError::bad_request(error.to_string()))?,
                )
            }
            "sortOrder" | "sort" => {
                sort_order = field
                    .text()
                    .await
                    .map_err(|error| ApiError::bad_request(error.to_string()))?
                    .parse()
                    .map_err(|_| ApiError::bad_request("排序值无效"))?
            }
            "enabled" => {
                enabled = field
                    .text()
                    .await
                    .map_err(|error| ApiError::bad_request(error.to_string()))?
                    .parse()
                    .map_err(|_| ApiError::bad_request("启用状态无效"))?
            }
            _ => {}
        }
    }
    let track = state
        .publisher
        .publish(PublishRequest {
            archive: archive.ok_or_else(|| ApiError::bad_request("缺少 ZIP 文件"))?,
            music_key: None,
            title: title.ok_or_else(|| ApiError::bad_request("缺少歌曲标题"))?,
            artist: artist.ok_or_else(|| ApiError::bad_request("缺少歌手"))?,
            sort_order,
            enabled,
        })
        .await?;
    Ok((StatusCode::CREATED, response::json(track)).into_response())
}

pub async fn patch_track(
    State(state): State<Arc<AppState>>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    axum::Json(patch): axum::Json<TrackPatch>,
) -> Result<Response, ApiError> {
    authorize(&state, &headers).await?;
    let track = state
        .catalog
        .patch(id, patch)
        .await?
        .ok_or_else(|| ApiError::not_found("歌曲不存在"))?;
    Ok(response::json(track))
}

#[derive(Deserialize)]
pub struct DeleteTracks {
    ids: Vec<i64>,
}

pub async fn delete_tracks(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    axum::Json(request): axum::Json<DeleteTracks>,
) -> Result<Response, ApiError> {
    authorize(&state, &headers).await?;
    if request.ids.is_empty() {
        return Err(ApiError::bad_request("至少选择一首歌曲"));
    }
    let objects = state.repository.delete_tracks(&request.ids).await?;
    for path in &objects {
        if let Err(error) = state.storage.delete_managed(path) {
            tracing::error!(object_path = %path, error = %error, "failed to remove unreferenced media object");
        }
    }
    Ok(response::json(
        serde_json::json!({"deleted": request.ids.len()}),
    ))
}

pub async fn get_asset(
    State(state): State<Arc<AppState>>,
    Path(name): Path<String>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    serve(&state, "assets", &name, &headers, false).await
}
pub async fn head_asset(
    State(state): State<Arc<AppState>>,
    Path(name): Path<String>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    serve(&state, "assets", &name, &headers, true).await
}
pub async fn get_cover(
    State(state): State<Arc<AppState>>,
    Path(name): Path<String>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    serve(&state, "covers", &name, &headers, false).await
}
pub async fn head_cover(
    State(state): State<Arc<AppState>>,
    Path(name): Path<String>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    serve(&state, "covers", &name, &headers, true).await
}
pub async fn get_lyric(
    State(state): State<Arc<AppState>>,
    Path(name): Path<String>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    serve(&state, "lyrics", &name, &headers, false).await
}
pub async fn head_lyric(
    State(state): State<Arc<AppState>>,
    Path(name): Path<String>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    serve(&state, "lyrics", &name, &headers, true).await
}

async fn serve(
    state: &AppState,
    kind: &str,
    name: &str,
    headers: &HeaderMap,
    head_only: bool,
) -> Result<Response, ApiError> {
    if name.contains('/') || name.contains('\\') || name.contains("..") {
        return Err(ApiError::not_found("资源不存在"));
    }
    let path = state.storage.root().join(kind).join(name);
    let bytes = tokio::fs::read(&path).await.map_err(|error| {
        if error.kind() == std::io::ErrorKind::NotFound {
            ApiError::not_found("资源不存在")
        } else {
            error.into()
        }
    })?;
    let total = bytes.len() as u64;
    let range = headers
        .get(header::RANGE)
        .and_then(|value| value.to_str().ok())
        .map(|value| parse_range(value, total))
        .transpose()?;
    let (status, start, end) = range
        .map(|(start, end)| (StatusCode::PARTIAL_CONTENT, start, end))
        .unwrap_or((StatusCode::OK, 0, total.saturating_sub(1)));
    let body = if head_only || total == 0 {
        Body::empty()
    } else {
        Body::from(bytes[start as usize..=end as usize].to_vec())
    };
    let mut response = Response::builder()
        .status(status)
        .body(body)
        .map_err(|error| ApiError::internal(error.to_string()))?;
    let values = response.headers_mut();
    values.insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("public,max-age=31536000,immutable,no-transform"),
    );
    values.insert(header::ACCEPT_RANGES, HeaderValue::from_static("bytes"));
    values.insert(
        header::CONTENT_LENGTH,
        HeaderValue::from_str(&(if total == 0 { 0 } else { end - start + 1 }).to_string()).unwrap(),
    );
    if status == StatusCode::PARTIAL_CONTENT {
        values.insert(
            header::CONTENT_RANGE,
            HeaderValue::from_str(&format!("bytes {start}-{end}/{total}")).unwrap(),
        );
    }
    values.insert(
        header::ETAG,
        HeaderValue::from_str(&format!("\"{}\"", name.split('.').next().unwrap_or(name))).unwrap(),
    );
    values.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static(match kind {
            "assets" => "application/octet-stream",
            "lyrics" => "text/plain; charset=utf-8",
            _ => "image/*",
        }),
    );
    Ok(response)
}

fn parse_range(value: &str, total: u64) -> Result<(u64, u64), ApiError> {
    if !value.starts_with("bytes=") || value[6..].contains(',') || total == 0 {
        return Err(ApiError::range_not_satisfiable("仅支持单段字节 Range"));
    }
    let (start, end) = value[6..]
        .split_once('-')
        .ok_or_else(|| ApiError::range_not_satisfiable("Range 格式无效"))?;
    let start: u64 = start
        .parse()
        .map_err(|_| ApiError::range_not_satisfiable("Range 起点无效"))?;
    let end: u64 = if end.is_empty() {
        total - 1
    } else {
        end.parse()
            .map_err(|_| ApiError::range_not_satisfiable("Range 终点无效"))?
    };
    if start > end || end >= total {
        return Err(ApiError::range_not_satisfiable("Range 超出资源长度"));
    }
    Ok((start, end))
}

async fn authorize(state: &AppState, headers: &HeaderMap) -> Result<(), ApiError> {
    let token = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| ApiError::unauthorized("缺少管理员令牌"))?;
    state.admin_auth.verify(token).await?;
    Ok(())
}

fn cookie<'a>(headers: &'a HeaderMap, name: &str) -> Option<&'a str> {
    headers
        .get(header::COOKIE)?
        .to_str()
        .ok()?
        .split(';')
        .find_map(|part| {
            let (key, value) = part.trim().split_once('=')?;
            (key == name).then_some(value)
        })
}

fn forwarded_ip(headers: &HeaderMap) -> Option<IpAddr> {
    headers
        .get("cf-connecting-ip")
        .or_else(|| headers.get("x-real-ip"))
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.parse().ok())
}
