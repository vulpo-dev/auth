use rocket::Route;

pub mod data;
mod keys;
mod public_keys;

pub fn routes() -> Vec<Route> {
    routes![public_keys::handler, keys::public]
}
