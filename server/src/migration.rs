use crate::config::DbConfig;

use diesel::pg::PgConnection;
use diesel::prelude::*;

embed_migrations!();

pub fn run(config: &DbConfig) -> std::result::Result<(), diesel_migrations::RunMigrationsError> {
    // todo: create database if not exist
    let url = config.to_string();
    let conn = PgConnection::establish(&url).expect(&format!("Error connecting to {}", url));
    embedded_migrations::run(&conn)
}
