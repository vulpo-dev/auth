use figment::{providers::Env, Figment};
use serde::{Deserialize, Serialize};

use std::num::NonZeroUsize;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct Secrets {
    pub passphrase: String,
}

pub fn secrets(figment: &Figment) -> Secrets {
    figment
        .clone()
        .select("secrets")
        .merge(Env::prefixed("VULPO_SECRETS_").global())
        .extract::<Secrets>()
        .expect("Invalid Secrets config")
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct CacheConfig {
    pub url: Option<String>,
    pub cache_size: Option<NonZeroUsize>,
    pub off: Option<bool>,
}

pub fn cache(figment: &Figment) -> CacheConfig {
    figment
        .clone()
        .select("secrets")
        .merge(Env::prefixed("VULPO_CACHE_").global())
        .extract::<CacheConfig>()
        .unwrap_or_else(|_| CacheConfig {
            url: None,
            cache_size: None,
            off: Some(false),
        })
}
