mod request_passwordless;

use rocket::Route;

pub fn routes() -> Vec<Route> {
    routes![request_passwordless::request_passwordless]
}
