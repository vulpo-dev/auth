use rocket::Route;

pub mod data;
mod email;
mod project;

pub fn routes() -> Vec<Route> {
    routes![email::get_handler, email::create_handler, project::handler]
}
