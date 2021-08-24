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

use clap::App;
use figment::{
    providers::{Env, Format, Serialized, Toml},
    Figment,
};
use include_dir::{include_dir, Dir};
use rocket::fairing::AdHoc;
use rocket::Config;

const ADMIN_CLIENT: Dir = include_dir!("../admin/build");
const TEMPLATE: Dir = include_dir!("./template");

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

    let db_config = figment.clone().select("database");
    let db_config = db_config
        .extract::<DbConfig>()
        .expect("Invalid Database config");

    let secret_config = figment
        .clone()
        .select("secrets")
        .extract::<Secrets>()
        .expect("Invalid Secrets config");

    if let Some(_) = matches.subcommand_matches("server") {
        let _ = rocket::custom(figment)
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
