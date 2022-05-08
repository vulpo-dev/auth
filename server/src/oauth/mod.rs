use rocket::Route;

mod data;
mod google;

pub fn routes() -> Vec<Route> {
    routes![
        google::get_auth_url,
        google::exchange_code,
        google::set_config,
        google::get_config,
    ]
}
