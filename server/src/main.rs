mod admin;
mod data;
mod db;
mod file;
mod migration;
mod password;
mod passwordless;
mod project;
mod response;
mod template;
mod token;
mod user;

#[macro_use]
extern crate rocket;

#[macro_use]
extern crate diesel_migrations;

use include_dir::{include_dir, Dir};

use crate::db::AuthDb;
use crate::response::error::ApiError;
use clap::App;

const SQL: Dir = include_dir!("./sql");
const ADMIN_CLIENT: Dir = include_dir!("../admin/build");

#[rocket::main]
async fn main() {
    let matches = App::new("Auth")
        .version("1.0")
        .author("Michael Riezler. <michael@riezler.co>")
        .subcommand(App::new("server").about("start server"))
        .subcommand(App::new("migrate").about("run migrations"))
        .get_matches();

    if matches.is_present("server") {
        let _ = rocket::ignite()
            .attach(AuthDb::fairing())
            .mount("/admin", admin::routes())
            .mount("/user", user::routes())
            .mount("/passwordless", passwordless::routes())
            .mount("/password", password::routes())
            .mount("/token", token::routes())
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
        }
    }
}
