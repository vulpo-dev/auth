mod admin;
mod cli;
mod config;
mod cors;
mod db;
mod file;
mod keys;
mod mail;
mod migration;
mod password;
mod passwordless;
mod project;
mod response;
mod server;
mod session;
mod settings;
mod template;
mod user;

#[macro_use]
extern crate rocket;

#[macro_use]
extern crate diesel_migrations;
extern crate openssl;

use figment::{
    providers::{Env, Format, Toml},
    Figment,
};
use include_dir::{include_dir, Dir};

const ADMIN_CLIENT: Dir = include_dir!("../admin/build");
const TEMPLATE: Dir = include_dir!("./template");

#[rocket::main]
async fn main() {
    let matches = cli::get_matches();
    let file = config::get_dir(matches.value_of("config"));
    let figment = Figment::new().merge(Toml::file(file).nested());
    let db_config = config::db(&figment);
    let secret_config = config::secrets(&figment);

    if let Some(_) = matches.subcommand_matches("init") {
        migration::init(&db_config);
    }

    if let Some(matches) = matches.subcommand_matches("server") {
        let port = server::get_port(matches.value_of("port"));

        let rocket_config = Figment::from(rocket::Config::default())
            .merge(figment.clone().select("server"))
            .merge(Env::prefixed("VULPO_SERVER_").global());

        let config = match port {
            None => rocket_config,
            Some(port) => rocket_config.merge(("port", port)),
        };

        server::start(config, &db_config, secret_config).await;
    }

    if let Some(_) = matches.subcommand_matches("migrations") {
        migration::run(&db_config);
    }
}
