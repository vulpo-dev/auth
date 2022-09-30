use std::ops::Deref;
use std::path::Path;
use std::sync::Arc;

use async_trait::async_trait;
use futures::lock::Mutex;
use lru::LruCache;
use redis::AsyncCommands;
use redis::Client;
use rocket::request::Outcome;
use rocket::request::{FromRequest, Request};
use std::num::NonZeroUsize;

#[async_trait]
pub trait CacheProvider {
    async fn get(&self, key: &Path) -> Option<String>;
    async fn set(&self, key: &Path, value: &str) -> Option<()>;
}

pub struct Cache(Arc<dyn CacheProvider + Sync + Send>);

impl Deref for Cache {
    type Target = Arc<dyn CacheProvider + Sync + Send>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Cache {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        if let Some(redis) = request.rocket().state::<Arc<RedisProvider>>() {
            return Outcome::Success(Cache(redis.clone()));
        }

        if let Some(memory) = request.rocket().state::<Arc<MemoryProvider>>() {
            return Outcome::Success(Cache(memory.clone()));
        }

        Outcome::Success(Cache(Arc::new(NoCacheProvider)))
    }
}

pub struct RedisProvider {
    client: Client,
}

impl RedisProvider {
    pub fn new(connection: &str) -> RedisProvider {
        let client = redis::Client::open(connection).unwrap();
        RedisProvider { client }
    }
}

#[async_trait]
impl CacheProvider for RedisProvider {
    async fn get(&self, key: &Path) -> Option<String> {
        let mut con = self.client.get_async_connection().await.ok()?;
        con.get(key.to_str()).await.ok()
    }

    async fn set(&self, key: &Path, value: &str) -> Option<()> {
        let mut con = self.client.get_async_connection().await.ok()?;
        let _: String = con.set(key.to_str(), value).await.ok()?;
        Some(())
    }
}

pub struct MemoryProvider {
    persitent: Arc<Mutex<LruCache<String, String>>>,
}

impl MemoryProvider {
    pub fn new(cache_size: Option<NonZeroUsize>) -> MemoryProvider {
        let lru = if let Some(size) = cache_size {
            LruCache::new(size)
        } else {
            LruCache::unbounded()
        };

        let persitent = Arc::new(Mutex::new(lru));
        MemoryProvider { persitent }
    }
}

#[async_trait]
impl CacheProvider for MemoryProvider {
    async fn get(&self, key: &Path) -> Option<String> {
        let key = key.to_str()?;
        let persitent = Arc::clone(&self.persitent);
        let mut store = persitent.lock().await;
        store.get(key).map(|value| value.clone())
    }

    async fn set(&self, key: &Path, value: &str) -> Option<()> {
        let key = key.to_str()?;
        let persitent = Arc::clone(&self.persitent);
        let mut store = persitent.lock().await;
        store.put(key.to_string(), value.to_string());
        Some(())
    }
}

struct NoCacheProvider;

#[async_trait]
impl CacheProvider for NoCacheProvider {
    async fn get(&self, _key: &Path) -> Option<String> {
        None
    }

    async fn set(&self, _key: &Path, _value: &str) -> Option<()> {
        Some(())
    }
}
