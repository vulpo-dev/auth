use diesel::pg::PgConnection;
use diesel::prelude::*;

use rocket;
use rocket_contrib::databases::Config;

embed_migrations!();

pub fn establish_connection() -> PgConnection {
    let rocket = rocket::ignite();
    let config = Config::from("auth", &rocket).expect("global.databases.auth missing");
    PgConnection::establish(&config.url).expect(&format!("Error connecting to {}", config.url))
}

pub fn run() -> std::result::Result<(), diesel_migrations::RunMigrationsError> {
    let conn = establish_connection();
    embedded_migrations::run(&conn)
}
