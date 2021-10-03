use crate::file::File;
use crate::ADMIN_CLIENT;

use rocket::Route;
use std::path::PathBuf;

mod create;
mod create_user;
pub mod data;
mod has_admin;
mod project;

#[get("/<path..>")]
fn files(path: Option<PathBuf>) -> Option<File> {
    let file = match path {
        Some(file) => file,
        None => PathBuf::from("index.html"),
    };

    let file = match ADMIN_CLIENT.get_file(&file) {
        Some(file) => file,
        None => match ADMIN_CLIENT.get_file("index.html") {
            Some(file) => file,
            None => return None,
        },
    };

    Some(File::from(file))
}

#[get("/")]
fn admin_index() -> Option<File> {
    let file = match ADMIN_CLIENT.get_file("index.html") {
        Some(file) => file,
        None => return None,
    };

    Some(File::from(file))
}


pub fn dashboard() -> Vec<Route> {
    routes![
        files,
        admin_index,
    ]
}

pub fn routes() -> Vec<Route> {
    routes![
        create::handler,
        create::create_once,
        create_user::handler,
        has_admin::handler,
        project::has,
        project::create_admin,
        project::create,
        project::list,
    ]
}
