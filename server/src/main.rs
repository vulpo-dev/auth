mod admin;
mod config;
mod cors;
mod data;
mod file;
mod mail;
mod migration;
mod password;
mod passwordless;
mod project;
mod response;
mod session;
mod settings;
mod template;
mod token;
mod user;

use crate::cors::CORS;
use config::secrets::Secrets;

#[macro_use]
extern crate rocket;

#[macro_use]
extern crate diesel_migrations;
extern crate openssl;

use serde::Deserialize;

use clap::App;
use figment::{
    providers::{Env, Format, Serialized, Toml},
    Figment,
};
use include_dir::{include_dir, Dir};
use rocket::fairing::AdHoc;
use rocket::Config;

const SQL: Dir = include_dir!("./sql");
const ADMIN_CLIENT: Dir = include_dir!("../admin/build");
const TEMPLATE: Dir = include_dir!("./template");

#[derive(Deserialize, Debug)]
struct AppConfig {
    secrets_passphrase: String,
}

#[rocket::main]
async fn main() {
    let matches = App::new("Auth")
        .version("1.0")
        .author("Michael Riezler. <michael@riezler.co>")
        .subcommand(App::new("server").about("start server"))
        .subcommand(App::new("migrate").about("run migrations"))
        .subcommand(App::new("init").about("init the server"))
        .get_matches();

    let figment = Figment::from(rocket::Config::default())
        .merge(Serialized::defaults(Config::default()))
        .merge(Toml::file("Rocket.toml").nested())
        .merge(Env::prefixed("AUTH_").global());

    if matches.is_present("server") {
        let _ = rocket::custom(figment)
            .attach(data::AuthDb::fairing())
            .attach(CORS())
            .attach(AdHoc::config::<Secrets>())
            .mount("/admin", admin::routes())
            .mount("/user", user::routes())
            .mount("/passwordless", passwordless::routes())
            .mount("/password", password::routes())
            .mount("/token", token::routes())
            .mount("/project", project::routes())
            .mount("/settings", settings::routes())
            .mount("/template", template::routes())
            .launch()
            .await;
    }

    if matches.is_present("migrate") {
        match migration::run() {
            Ok(_) => println!("Migrations done"),
            Err(err) => {
                println!("Migration Error");
                println!("{:?}", err);
            }
        };
    }
}
