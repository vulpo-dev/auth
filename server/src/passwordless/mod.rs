use rocket::Route;

mod request_passwordless;

pub fn routes() -> Vec<Route> {
    routes![request_passwordless::request_passwordless]
}
