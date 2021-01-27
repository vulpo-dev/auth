use rocket::Route;

pub mod data;
mod email;

pub fn routes() -> Vec<Route> {
    routes![email::get_handler, email::create_handler]
}
