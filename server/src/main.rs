mod admin;
mod api_key;
mod cli;
mod config;
mod cors;
mod crypto;
mod file;
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

use figment::{
    providers::{Format, Toml},
    Figment,
};
use include_dir::{include_dir, Dir};
use werkbank::clap::{get_config_dir, run_migration, run_server};
use werkbank::otel;

const ADMIN_CLIENT: Dir = include_dir!("$CARGO_MANIFEST_DIR/../admin/build");
const TEMPLATE: Dir = include_dir!("$CARGO_MANIFEST_DIR/template");

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

    if let Some(matches) = run_server(&matches) {
        otel::init("vulpo_auth_server", &figment);
        let port = server::get_port(matches.get_one::<String>("port"));
        server::start(&figment, port, secret_config).await;
    }
}
