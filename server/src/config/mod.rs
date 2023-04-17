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

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct Admin {
    pub email: String,
    pub password: String,
    pub host: String,
}

pub fn admin(figment: &Figment) -> Option<Admin> {
    let user = figment
        .clone()
        .select("admin")
        .merge(Env::prefixed("VULPO_ADMIN_").global())
        .extract::<Option<Admin>>();

    match user {
        Ok(user) => user,
        Err(_) => None,
    }
}
