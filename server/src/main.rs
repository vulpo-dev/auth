mod admin;
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
mod session;
mod settings;
mod template;
mod user;

use crate::config::{DbConfig, Secrets};
use crate::cors::CORS;

#[macro_use]
extern crate rocket;

#[macro_use]
extern crate diesel_migrations;
extern crate openssl;

use clap::{App, Arg};
use figment::{
    providers::{Env, Format, Toml},
    Figment,
};
use include_dir::{include_dir, Dir};
use rocket::fairing::AdHoc;

const ADMIN_CLIENT: Dir = include_dir!("../admin/build");
const TEMPLATE: Dir = include_dir!("./template");

#[rocket::main]
async fn main() {
    let matches = App::new("Auth")
        .version("1.0")
        .author("Michael Riezler. <michael@riezler.co>")
        .subcommand(
            App::new("server").about("start server").arg(
                Arg::new("port")
                    .short('p')
                    .long("port")
                    .required(false)
                    .value_name("PORT")
                    .takes_value(true),
            ),
        )
        .subcommand(App::new("migrate").about("run migrations"))
        .subcommand(App::new("init").about("init the server"))
        .get_matches();

    let figment = Figment::new().merge(Toml::file("Vulpo.toml").nested());

    let db_config = figment
        .clone()
        .select("database")
        .merge(Env::prefixed("VULPO_DB_").global())
        .extract::<DbConfig>()
        .expect("Invalid Database config");

    let secret_config = figment
        .clone()
        .select("secrets")
        .merge(Env::prefixed("VULPO_SECRETS_").global())
        .extract::<Secrets>()
        .expect("Invalid Secrets config");

    if let Some(matches) = matches.subcommand_matches("server") {
        let port = get_port(matches.value_of("port"));

        let rocket_config = Figment::from(rocket::Config::default())
            .merge(figment.clone().select("server"))
            .merge(Env::prefixed("VULPO_SERVER_").global());

        let config = match port {
            None => rocket_config,
            Some(port) => rocket_config.merge(("port", port)),
        };

        let _ = rocket::custom(config)
            .attach(CORS())
            .attach(AdHoc::on_ignite("Add Secrets", |rocket| async move {
                rocket.manage(secret_config)
            }))
            .attach(db::create_pool(&db_config))
            .mount("/admin", admin::routes())
            .mount("/user", user::routes())
            .mount("/passwordless", passwordless::routes())
            .mount("/password", password::routes())
            .mount("/token", session::routes())
            .mount("/project", project::routes())
            .mount("/settings", settings::routes())
            .mount("/template", template::routes())
            .mount("/keys", keys::routes())
            .launch()
            .await;
    }

    if let Some(_) = matches.subcommand_matches("migrate") {
        match migration::run(&db_config) {
            Ok(_) => println!("Migrations done"),
            Err(err) => {
                println!("Migration Error");
                println!("{:?}", err);
            }
        };
    }
}

fn get_port(port: Option<&str>) -> Option<u16> {
    port.and_then(|value| value.parse::<u16>().ok())
}
