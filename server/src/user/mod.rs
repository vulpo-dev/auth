use rocket::Route;

mod get;
mod list;

pub fn routes() -> Vec<Route> {
    routes![get::handler, list::handler, list::total]
}
