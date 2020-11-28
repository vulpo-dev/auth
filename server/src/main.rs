mod admin;
mod db;
mod error;
mod file;
mod migration;
mod passwordless;
mod project;
mod template;
mod user;

#[macro_use]
extern crate rocket;

#[macro_use]
extern crate diesel_migrations;

use include_dir::{include_dir, Dir};

use crate::db::AuthDb;
use crate::error::ApiError;

use clap::{App, Arg};

const SQL: Dir = include_dir!("./src/sql");
const ADMIN_CLIENT: Dir = include_dir!("../admin/build");

#[get("/")]
fn index() -> Result<String, ApiError> {
    Err(ApiError::Test(Some("message".to_string())))
}

#[rocket::main]
async fn main() {
    let matches = App::new("Auth")
        .version("1.0")
        .author("Michael Riezler. <michael@riezler.co>")
        .arg(
            Arg::new("server")
                .short('s')
                .long("server")
                .about("start server"),
        )
        .arg(Arg::new("migrate").about("run migrations").long("migrate"))
        .get_matches();

    if matches.is_present("server") {
        let _ = rocket::ignite()
            .attach(AuthDb::fairing())
            .mount("/", routes![index])
            .mount("/admin", admin::routes())
            .mount("/user", user::routes())
            .mount("/passwordless", passwordless::routes())
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
