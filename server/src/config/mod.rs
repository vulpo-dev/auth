use figment::{providers::Env, Figment};
use log::LevelFilter;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct Secrets {
    pub passphrase: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct DbConfig {
    pub username: Option<String>,
    pub password: Option<String>,
    pub port: Option<u16>,
    pub host: Option<String>,
    pub database_name: Option<String>,
    pub max_connections: Option<u32>,
    pub log_level: Option<LevelFilter>,
}

impl DbConfig {
    pub fn to_postgres_string(&self) -> String {
        let default_host = String::from("localhost");
        let default_user = String::from("postgres");
        let default_pass = String::from("postgres");

        let port = self.port.unwrap_or(5432);
        let host = self.host.as_ref().unwrap_or(&default_host);
        let username = self.username.as_ref().unwrap_or(&default_user);
        let password = self.password.as_ref().unwrap_or(&default_pass);

        let url = format!(
            "postgres://{}:{}@{}:{}/postgres",
            username, password, host, port
        );

        url
    }
}

impl ToString for DbConfig {
    fn to_string(&self) -> String {
        let default_host = String::from("localhost");
        let default_name = String::from("auth");
        let default_user = String::from("postgres");
        let default_pass = String::from("postgres");

        let port = self.port.unwrap_or(5432);
        let host = self.host.as_ref().unwrap_or(&default_host);
        let database_name = self.database_name.as_ref().unwrap_or(&default_name);
        let username = self.username.as_ref().unwrap_or(&default_user);
        let password = self.password.as_ref().unwrap_or(&default_pass);

        let url = format!(
            "postgres://{}:{}@{}:{}/{}",
            username, password, host, port, database_name
        );

        url
    }
}

pub fn db(figment: &Figment) -> DbConfig {
    figment
        .clone()
        .select("database")
        .merge(Env::prefixed("VULPO_DB_").global())
        .extract::<DbConfig>()
        .expect("Invalid Database config")
}

pub fn secrets(figment: &Figment) -> Secrets {
    figment
        .clone()
        .select("secrets")
        .merge(Env::prefixed("VULPO_SECRETS_").global())
        .extract::<Secrets>()
        .expect("Invalid Secrets config")
}

pub fn get_dir(dir: Option<&str>) -> &str {
    dir.unwrap_or("Vulpo.toml")
}
