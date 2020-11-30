use rocket::Route;

mod signin;
mod signup;

pub fn routes() -> Vec<Route> {
    routes![signup::sign_up, signin::sign_in]
}
