use crate::config::DbConfig;
use crate::response::error::ApiError;

use rocket::fairing::{AdHoc, Fairing};
use rocket::http::Status;
use rocket::request::Outcome;
use rocket::request::{FromRequest, Request};

use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

pub fn create_pool(config: &DbConfig) -> impl Fairing {
    let max_connections = config.max_connections.unwrap_or(100);
    let url = config.to_string();

    AdHoc::on_ignite("Add DB pool", move |rocket| async move {
        let pool = PgPoolOptions::new()
            .max_connections(max_connections)
            .connect(&url)
            .await
            .expect("Failed to connect");

        rocket.manage(pool)
    })
}

pub struct Db<'r>(&'r PgPool);

impl Db<'_> {
    pub fn inner(&self) -> &PgPool {
        self.0
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Db<'r> {
    type Error = ApiError;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        match request.rocket().state::<PgPool>() {
            None => Outcome::Failure((Status::InternalServerError, ApiError::AuthTokenMissing)),
            Some(pool) => Outcome::Success(Db(pool)),
        }
    }
}
