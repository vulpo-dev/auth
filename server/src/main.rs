mod admin;
mod data;
mod file;
mod mail;
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
extern crate openssl;

use clap::App;
use include_dir::{include_dir, Dir};
use rocket::http::Method;
use rocket_cors::AllowedOrigins;

const SQL: Dir = include_dir!("./sql");
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

    if matches.is_present("server") {
        let allowed_origins = AllowedOrigins::all();

        // You can also deserialize this
        let cors = rocket_cors::CorsOptions {
            allowed_origins,
            allowed_methods: vec![Method::Get, Method::Post]
                .into_iter()
                .map(From::from)
                .collect(),
            allow_credentials: true,
            ..Default::default()
        }
        .to_cors()
        .unwrap();

        let _ = rocket::ignite()
            .attach(data::AuthDb::fairing())
            .attach(cors)
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
        };
    }
}
