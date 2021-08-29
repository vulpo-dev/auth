use std::ops::Deref;

use crate::config::DbConfig;
use crate::response::error::ApiError;

use rocket::fairing::{AdHoc, Fairing};
use rocket::http::Status;
use rocket::request::Outcome;
use rocket::request::{FromRequest, Request};

use log::LevelFilter;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::ConnectOptions;
use sqlx::PgPool;

pub fn create_pool(config: &DbConfig) -> impl Fairing {
    let max_connections = config.max_connections.unwrap_or(100);
    let conf = config.clone();

    AdHoc::on_ignite("Add DB pool", move |rocket| async move {
        let default_host = String::from("localhost");
        let default_name = String::from("auth");
        let default_user = String::from("postgres");
        let default_pass = String::from("postgres");

        let port = conf.port.unwrap_or(5432);
        let host = conf.host.as_ref().unwrap_or(&default_host);
        let database_name = conf.database_name.as_ref().unwrap_or(&default_name);
        let username = conf.username.as_ref().unwrap_or(&default_user);
        let password = conf.password.as_ref().unwrap_or(&default_pass);
        let log_level = conf.log_level.unwrap_or(LevelFilter::Off);

        let mut options = PgConnectOptions::new()
            .host(&host)
            .port(port)
            .username(&username)
            .password(&password)
            .database(&database_name);

        let pool = PgPoolOptions::new()
            .max_connections(max_connections)
            .connect_with(options.log_statements(log_level).clone())
            .await
            .expect("Failed to connect");

        rocket.manage(pool)
    })
}

pub struct Db(PgPool);

impl Deref for Db {
    type Target = PgPool;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Db {
    type Error = ApiError;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        match request.rocket().state::<PgPool>() {
            None => Outcome::Failure((Status::InternalServerError, ApiError::AuthTokenMissing)),
            Some(pool) => Outcome::Success(Db(pool.to_owned())),
        }
    }
}
