use std::ops::Deref;
use std::path::Path;
use std::sync::Arc;

use async_trait::async_trait;
use redis::AsyncCommands;
use redis::Client;
use rocket::http::Status;
use rocket::request::Outcome;
use rocket::request::{FromRequest, Request};

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
        match request.rocket().state::<Arc<RedisProvider>>() {
            None => Outcome::Failure((Status::InternalServerError, ())),
            Some(cache) => Outcome::Success(Cache(cache.clone())),
        }
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
