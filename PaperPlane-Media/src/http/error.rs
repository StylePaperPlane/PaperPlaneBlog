use axum::{
    Json,
    response::{IntoResponse, Response},
};
use http::{HeaderValue, StatusCode, header};
use serde::Serialize;

use crate::{
    auth::AdminAuthError, ingest::IngestError, playback::PlaybackError, storage::StorageError,
};

#[derive(Debug)]
pub struct ApiError {
    status: StatusCode,
    title: &'static str,
    detail: String,
}

#[derive(Serialize)]
struct Problem<'a> {
    #[serde(rename = "type")]
    problem_type: &'a str,
    title: &'a str,
    status: u16,
    detail: &'a str,
}

impl ApiError {
    pub fn bad_request(detail: impl Into<String>) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            title: "请求无效",
            detail: detail.into(),
        }
    }
    pub fn unauthorized(detail: impl Into<String>) -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            title: "需要认证",
            detail: detail.into(),
        }
    }
    pub fn not_found(detail: impl Into<String>) -> Self {
        Self {
            status: StatusCode::NOT_FOUND,
            title: "资源不存在",
            detail: detail.into(),
        }
    }
    pub fn payload_too_large(detail: impl Into<String>) -> Self {
        Self {
            status: StatusCode::PAYLOAD_TOO_LARGE,
            title: "上传内容过大",
            detail: detail.into(),
        }
    }
    pub fn too_many_requests(detail: impl Into<String>) -> Self {
        Self {
            status: StatusCode::TOO_MANY_REQUESTS,
            title: "请求过于频繁",
            detail: detail.into(),
        }
    }
    pub fn range_not_satisfiable(detail: impl Into<String>) -> Self {
        Self {
            status: StatusCode::RANGE_NOT_SATISFIABLE,
            title: "Range 不可满足",
            detail: detail.into(),
        }
    }
    pub fn internal(detail: impl Into<String>) -> Self {
        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            title: "媒体服务异常",
            detail: detail.into(),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        if self.status.is_server_error() {
            tracing::error!(error = %self.detail, "request failed");
        }
        let problem_type = format!(
            "https://media.paperplane.codes/problems/{}",
            self.status.as_u16()
        );
        let mut response = (
            self.status,
            Json(Problem {
                problem_type: &problem_type,
                title: self.title,
                status: self.status.as_u16(),
                detail: &self.detail,
            }),
        )
            .into_response();
        response.headers_mut().insert(
            header::CONTENT_TYPE,
            HeaderValue::from_static("application/problem+json"),
        );
        response
            .headers_mut()
            .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
        response
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(error: sqlx::Error) -> Self {
        Self::internal(error.to_string())
    }
}
impl From<std::io::Error> for ApiError {
    fn from(error: std::io::Error) -> Self {
        Self::internal(error.to_string())
    }
}
impl From<StorageError> for ApiError {
    fn from(error: StorageError) -> Self {
        Self::internal(error.to_string())
    }
}
impl From<AdminAuthError> for ApiError {
    fn from(error: AdminAuthError) -> Self {
        match error {
            AdminAuthError::Rejected => Self::unauthorized(error.to_string()),
            _ => Self::internal(error.to_string()),
        }
    }
}
impl From<PlaybackError> for ApiError {
    fn from(error: PlaybackError) -> Self {
        match error {
            PlaybackError::InvalidSession | PlaybackError::FingerprintMismatch => {
                Self::unauthorized(error.to_string())
            }
            PlaybackError::TrackUnavailable => Self::not_found(error.to_string()),
            PlaybackError::Database(_)
            | PlaybackError::KeyVault(_)
            | PlaybackError::Json(_)
            | PlaybackError::CorruptAsset => Self::internal(error.to_string()),
            _ => Self::bad_request(error.to_string()),
        }
    }
}
impl From<IngestError> for ApiError {
    fn from(error: IngestError) -> Self {
        match &error {
            IngestError::Archive(
                crate::ingest::ArchiveError::ArchiveTooLarge
                | crate::ingest::ArchiveError::ExtractedTooLarge,
            ) => Self::payload_too_large(error.to_string()),
            IngestError::Database(_) | IngestError::Storage(_) | IngestError::Io(_) => {
                Self::internal(error.to_string())
            }
            _ => Self::bad_request(error.to_string()),
        }
    }
}
