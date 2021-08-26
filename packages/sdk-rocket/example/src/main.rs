#[macro_use]
extern crate rocket;

use rocket::http::Status;

use serde::Deserialize;
use uuid::Uuid;
use vulpo::Authorize;
use vulpo_rocket::{Auth, AuthClient, Claims};

#[get("/")]
fn test(_auth: Auth<Claims>) -> Status {
    Status::Ok
}

#[derive(Deserialize)]
struct Admin {
    pub sub: Uuid,
    pub exp: i64,
    pub iss: Uuid,
    pub traits: Vec<String>,
}

impl Authorize for Admin {
    type Error = ();
    fn authorize(&self) -> Result<bool, Self::Error> {
        Ok(self.traits.contains(&String::from("admin")))
    }

    fn issuer(&self) -> Uuid {
        self.iss
    }
}

#[get("/admin")]
fn admin(auth: Auth<Admin>) -> Status {
    let claims = auth.inner();

    if claims.traits.contains(&String::from("admin")) {
        Status::Ok
    } else {
        Status::Forbidden
    }
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .attach(AuthClient::fairing(
            "http://127.0.0.1:7000/keys".to_string(),
        ))
        .mount("/", routes![test, admin])
}
