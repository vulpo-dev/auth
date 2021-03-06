use rocket::Route;

mod access_token;
mod refresh;

pub use access_token::{AccessToken, Claims};

pub fn routes() -> Vec<Route> {
    routes![refresh::handler]
}
