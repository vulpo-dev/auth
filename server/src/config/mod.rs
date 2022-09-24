use figment::{providers::Env, Figment};
use serde::{Deserialize, Serialize};

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
