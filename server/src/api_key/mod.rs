use rocket::Route;

pub mod data;
pub mod delete;
mod generate;
pub mod list;
pub mod verify;

pub fn routes() -> Vec<Route> {
    routes![
        generate::generate,
        verify::verify,
        list::handler,
        delete::handler
    ]
}
