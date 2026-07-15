use axum::{
    Json,
    response::{IntoResponse, Response},
};
use http::{HeaderValue, header};
use serde::Serialize;

#[derive(Serialize)]
pub struct Data<T> {
    pub data: T,
}

pub fn json<T: Serialize>(value: T) -> Response {
    let mut response = Json(Data { data: value }).into_response();
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    response
}
