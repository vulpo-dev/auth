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
