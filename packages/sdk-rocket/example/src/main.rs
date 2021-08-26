#[macro_use]
extern crate rocket;

use rocket::http::Status;
use serde::Deserialize;
use vulpo::{AccessToken, Authorize};
use vulpo_rocket::{Auth, AuthClient, Claims};

type User = Auth<AccessToken>;

#[get("/")]
fn test(_auth: User) -> Status {
    Status::Ok
}

#[derive(Deserialize)]
struct Admin;

impl Authorize for Admin {
    fn authorize(claims: &Claims) -> Result<bool, u16> {
        Ok(claims.traits.contains(&String::from("admin")))
    }
}

type AdminUser = Auth<Admin>;

#[get("/admin")]
fn admin(_auth: AdminUser) -> Status {
    Status::Ok
}

#[derive(Deserialize)]
struct InternalError;

impl Authorize for InternalError {
    fn authorize(_claims: &Claims) -> Result<bool, u16> {
        Err(500)
    }
}

#[get("/error")]
fn internal_error(_auth: Auth<InternalError>) -> Status {
    Status::Ok
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .attach(AuthClient::fairing(
            "http://127.0.0.1:7000/keys".to_string(),
        ))
        .mount("/", routes![test, admin, internal_error])
}
