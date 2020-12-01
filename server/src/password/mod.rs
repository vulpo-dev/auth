mod signin;
mod signup;

use rocket::Route;

pub fn routes() -> Vec<Route> {
    routes![signup::sign_up, signin::sign_in]
}
