use std::{
    collections::HashMap,
    sync::Arc,
    time::{Duration, Instant},
};

use sha2::{Digest, Sha256};
use thiserror::Error;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct CoreAdminAuth {
    client: reqwest::Client,
    endpoint: String,
    service_token: String,
    cache: Arc<RwLock<HashMap<[u8; 32], Instant>>>,
}

impl CoreAdminAuth {
    pub fn new(endpoint: String, service_token: String) -> Self {
        Self {
            client: reqwest::Client::new(),
            endpoint,
            service_token,
            cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn verify(&self, authorization: &str) -> Result<(), AdminAuthError> {
        let hash: [u8; 32] = Sha256::digest(authorization.as_bytes()).into();
        if self
            .cache
            .read()
            .await
            .get(&hash)
            .is_some_and(|at| at.elapsed() < Duration::from_secs(30))
        {
            return Ok(());
        }
        let response = self
            .client
            .post(&self.endpoint)
            .header("Authorization", authorization)
            .header("X-PaperPlane-Service-Token", &self.service_token)
            .send()
            .await?;
        if response.status() != reqwest::StatusCode::NO_CONTENT {
            return Err(AdminAuthError::Rejected);
        }
        self.cache.write().await.insert(hash, Instant::now());
        Ok(())
    }
}

#[derive(Debug, Error)]
pub enum AdminAuthError {
    #[error("管理员身份无效或已过期")]
    Rejected,
    #[error("核心鉴权服务暂时不可用")]
    Unavailable(#[from] reqwest::Error),
}
