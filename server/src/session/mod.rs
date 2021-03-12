use rocket::Route;

pub mod data;
mod refresh;

pub fn routes() -> Vec<Route> {
    routes![refresh::handler]
}
