use rocket::Route;

pub mod data;
mod generate;
mod verify;

pub fn routes() -> Vec<Route> {
    routes![generate::generate, verify::verify]
}
