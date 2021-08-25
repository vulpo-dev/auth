#[macro_use]
extern crate rocket;

use rocket::http::Status;
use vulpo_rocket::Auth;

#[get("/")]
fn test(_auth: Auth) -> Status {
    Status::Ok
}

#[get("/admin")]
fn admin(auth: Auth) -> Status {
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
        .attach(Auth::fairing("http://127.0.0.1:7000/keys".to_string()))
        .mount("/", routes![test, admin])
}
