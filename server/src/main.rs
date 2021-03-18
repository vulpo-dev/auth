mod admin;
mod config;
mod cors;
mod db;
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
mod user;

use crate::config::{DbConfig, Secrets};
use crate::cors::CORS;
use crate::db::Db;

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
use sqlx;

const ADMIN_CLIENT: Dir = include_dir!("../admin/build");
const TEMPLATE: Dir = include_dir!("./template");

#[derive(Deserialize, Debug)]
struct AppConfig {
    url: String,
    pool_size: Option<i32>,
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

    let db_config = figment.clone().select("database");
    let db_config = db_config
        .extract::<DbConfig>()
        .expect("Invalid Database config");

    if matches.is_present("server") {
        let _ = rocket::custom(figment)
            .attach(CORS())
            .attach(AdHoc::config::<Secrets>())
            .attach(db::create_pool(&db_config))
            .mount("/admin", admin::routes())
            .mount("/user", user::routes())
            .mount("/passwordless", passwordless::routes())
            .mount("/password", password::routes())
            .mount("/token", session::routes())
            .mount("/project", project::routes())
            .mount("/settings", settings::routes())
            .mount("/template", template::routes())
            .mount("/test", routes![test_db])
            .launch()
            .await;
    }

    if matches.is_present("migrate") {
        match migration::run(&db_config) {
            Ok(_) => println!("Migrations done"),
            Err(err) => {
                println!("Migration Error");
                println!("{:?}", err);
            }
        };
    }
}

#[get("/db")]
async fn test_db(pool: Db<'_>) -> rocket::http::Status {
    println!("AAAAAAAAAAAAA");
    let row = sqlx::query!("select count(*) from users")
        .fetch_one(pool.inner())
        .await
        .unwrap();

    println!("{:?}", row);

    rocket::http::Status::Ok
}
