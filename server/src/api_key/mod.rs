use rocket::Route;

pub mod data;
mod generate;

pub fn routes() -> Vec<Route> {
    routes![generate::generate]
}
