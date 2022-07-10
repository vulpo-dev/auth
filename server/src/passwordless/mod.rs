mod confirm;
pub mod data;
mod request_passwordless;
mod verify;

use rocket::Route;

pub fn routes() -> Vec<Route> {
    routes![
        request_passwordless::handler,
        confirm::handler,
        verify::handler
    ]
}
