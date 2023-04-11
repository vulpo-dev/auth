use crate::file::File;
use crate::ADMIN_CLIENT;

use handlebars::Handlebars;
use rocket::response::Redirect;
use rocket::Route;
use std::collections::BTreeMap;
use std::path::PathBuf;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

mod create;
mod create_user;
pub mod data;
mod has_admin;
mod project;

pub use create::create_admin;
pub use project::create_admin_project;

use self::data::Admin;

async fn render_index(pool: &Db) -> Result<Option<File>, ApiError> {
    let file = match ADMIN_CLIENT.get_file("index.html") {
        Some(file) => file,
        None => return Ok(None),
    };

    let id = match Admin::get_project(&pool).await? {
        Some(id) => id,
        None => return Ok(None),
    };

    let content = match String::from_utf8(file.contents().to_vec()) {
        Ok(content) => content,
        // TODO: Better error handling
        Err(_) => return Ok(None),
    };

    let handlebars = Handlebars::new();

    let mut data = BTreeMap::new();
    data.insert("VULPO_ADMIN_ID".to_string(), id.to_string());
    let content = match handlebars.render_template(&content, &data) {
        Ok(content) => content.into_bytes(),
        // TODO: Better error handling
        Err(_) => return Ok(None),
    };

    let index = File::new(&file.path().to_str().unwrap(), &content.to_owned());

    Ok(Some(index))
}

#[get("/<path..>")]
async fn files(path: Option<PathBuf>, pool: Db) -> Result<Option<File>, ApiError> {
    let file = match path {
        Some(file) => file,
        None => PathBuf::from("index.html"),
    };

    if let Some(file) = ADMIN_CLIENT.get_file(&file) {
        return Ok(Some(File::from(file.to_owned())));
    }

    render_index(&pool).await
}

#[get("/")]
async fn admin_index(pool: Db) -> Result<Option<File>, ApiError> {
    render_index(&pool).await
}

#[get("/")]
fn admin_redirect() -> Redirect {
    Redirect::to("/dashboard")
}

pub fn redirect() -> Vec<Route> {
    routes![admin_redirect]
}

pub fn dashboard() -> Vec<Route> {
    routes![files, admin_index,]
}

pub fn routes() -> Vec<Route> {
    routes![
        create_user::handler,
        has_admin::handler,
        project::has,
        project::create,
        project::list,
    ]
}
