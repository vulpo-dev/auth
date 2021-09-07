use crate::config::DbConfig;

use diesel::pg::PgConnection;
use diesel::prelude::*;
use diesel::result::Error;

embed_migrations!();

pub fn run(config: &DbConfig) {
    // todo: create database if not exist
    let url = config.to_string();
    let conn = PgConnection::establish(&url).expect(&format!("Error connecting to {}", url));
    match embedded_migrations::run(&conn) {
        Ok(_) => println!("Migrations done"),
        Err(err) => {
            println!("Failed to run migrations");
            panic!("{:?}", err);
        }
    };
}

pub fn init(config: &DbConfig) {
    println!("Create Database if not exists");
    let url = config.to_postgres_string();
    let conn = PgConnection::establish(&url).expect(&format!("Error connecting to {}", url));
    let db_name = config.database_name.clone().unwrap_or(String::from("auth"));
    let query = format!("create database {}", &db_name);

    match diesel::sql_query(query).execute(&conn) {
        Ok(_) => println!("Database {} created", db_name),
        Err(err) => {
            if let Error::DatabaseError(_, msg) = err {
                println!("{:?}", msg);
            }
        }
    };

    println!("Running Migrations");
    run(&config);

    println!("Your database is set up, type 'vulpo server' to continue the setup process");
}
