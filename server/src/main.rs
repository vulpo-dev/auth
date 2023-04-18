mod admin;
mod api_key;
mod cli;
mod config;
mod cors;
mod crypto;
mod file;
mod init;
mod keys;
mod mail;
mod migration;
mod oauth;
mod password;
mod passwordless;
mod project;
mod server;
mod session;
mod settings;
mod template;
mod user;

#[macro_use]
extern crate rocket;

use crate::config::{secrets, Secrets};

use figment::{
    providers::{Format, Toml},
    Figment,
};
use include_dir::{include_dir, Dir};
use keys::data::ProjectKeys;
use vulpo_auth_types::error::ApiError;
use werkbank::clap::{get_config_dir, run_migration, run_server};
use werkbank::otel;

const ADMIN_CLIENT: Dir = include_dir!("$CARGO_MANIFEST_DIR/../admin/dist");
const TEMPLATE: Dir = include_dir!("$CARGO_MANIFEST_DIR/../packages/email-templates/build");

#[rocket::main]
async fn main() {
    let version = option_env!("VulpoAuthVersion");

    let matches = cli::get_matches();
    let file = get_config_dir(matches.get_one::<String>("config"));
    let figment = Figment::new().merge(Toml::file(file).nested());
    let secret_config = config::secrets(&figment);

    if matches.get_flag("version") {
        version.map(|v| println!("Version: {:?}", v));
    }

    if run_migration(&matches) {
        migration::run(&figment).await;
    }

    if matches.subcommand_matches("init").is_some() || std::env::var("VULPO_RUN_MIGRATIONS").is_ok()
    {
        match init::init(&figment).await {
            Ok(_) => println!("Initialization done"),
            Err(ApiError::AdminHasAdmin) => println!("Admin User already exists"),
            Err(ApiError::AdminProjectExists) => println!("Admin Project already exists"),
            Err(err) => panic!("Failed to initialize admin: {:?}", err),
        };
    }

    if matches.subcommand_matches("key-gen").is_some() {
        let Secrets { passphrase } = secrets(&figment);
        let keys = ProjectKeys::create_keys(true, None, &passphrase);
        println!(
            "Public Key:\n{}",
            String::from_utf8(keys.public_key).unwrap()
        );
        println!(
            "Private Key:\n{}",
            String::from_utf8(keys.private_key).unwrap()
        );
    }

    if let Some(matches) = run_server(&matches) {
        otel::init("vulpo_auth_server", &figment);
        let port = server::get_port(matches.get_one::<String>("port"));
        server::start(&figment, port, secret_config).await;
    }
}
