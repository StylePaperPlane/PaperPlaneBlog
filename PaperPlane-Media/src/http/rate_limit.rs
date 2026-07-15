use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

use sha2::{Digest, Sha256};

#[derive(Clone)]
pub struct RequestLimits {
    sessions: FixedWindowLimiter,
    keys: FixedWindowLimiter,
    uploads: ExclusiveLimiter,
}

impl RequestLimits {
    pub fn production_defaults() -> Self {
        Self {
            sessions: FixedWindowLimiter::new(10, Duration::from_secs(60)),
            keys: FixedWindowLimiter::new(60, Duration::from_secs(60)),
            uploads: ExclusiveLimiter::default(),
        }
    }

    pub fn allow_session(&self, ip: impl ToString) -> bool {
        self.sessions.allow(&ip.to_string())
    }

    pub fn allow_key(&self, session_token: &str) -> bool {
        self.keys.allow(&digest_key(session_token))
    }

    pub fn acquire_upload(&self, authorization: &str) -> Option<ExclusivePermit> {
        self.uploads.acquire(digest_key(authorization))
    }
}

#[derive(Clone)]
struct FixedWindowLimiter {
    limit: u32,
    window: Duration,
    entries: Arc<Mutex<HashMap<String, WindowEntry>>>,
}

struct WindowEntry {
    started_at: Instant,
    count: u32,
}

impl FixedWindowLimiter {
    fn new(limit: u32, window: Duration) -> Self {
        Self {
            limit,
            window,
            entries: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    fn allow(&self, key: &str) -> bool {
        let now = Instant::now();
        let mut entries = self.entries.lock().expect("rate-limit lock poisoned");
        if entries.len() > 10_000 {
            entries.retain(|_, entry| now.duration_since(entry.started_at) < self.window);
        }
        let entry = entries.entry(key.to_owned()).or_insert(WindowEntry {
            started_at: now,
            count: 0,
        });
        if now.duration_since(entry.started_at) >= self.window {
            entry.started_at = now;
            entry.count = 0;
        }
        if entry.count >= self.limit {
            return false;
        }
        entry.count += 1;
        true
    }
}

#[derive(Clone, Default)]
struct ExclusiveLimiter {
    active: Arc<Mutex<Vec<String>>>,
}

impl ExclusiveLimiter {
    fn acquire(&self, key: String) -> Option<ExclusivePermit> {
        let mut active = self.active.lock().expect("upload-limit lock poisoned");
        if active.contains(&key) {
            return None;
        }
        active.push(key.clone());
        Some(ExclusivePermit {
            limiter: self.clone(),
            key,
        })
    }
}

pub struct ExclusivePermit {
    limiter: ExclusiveLimiter,
    key: String,
}

impl Drop for ExclusivePermit {
    fn drop(&mut self) {
        let mut active = self
            .limiter
            .active
            .lock()
            .expect("upload-limit lock poisoned");
        active.retain(|value| value != &self.key);
    }
}

fn digest_key(value: &str) -> String {
    Sha256::digest(value.as_bytes())
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fixed_window_stops_at_the_declared_limit() {
        let limiter = FixedWindowLimiter::new(2, Duration::from_secs(60));
        assert!(limiter.allow("device"));
        assert!(limiter.allow("device"));
        assert!(!limiter.allow("device"));
        assert!(limiter.allow("another-device"));
    }

    #[test]
    fn exclusive_permit_is_released_on_drop() {
        let limiter = ExclusiveLimiter::default();
        let permit = limiter.acquire("administrator".into()).unwrap();
        assert!(limiter.acquire("administrator".into()).is_none());
        drop(permit);
        assert!(limiter.acquire("administrator".into()).is_some());
    }
}
