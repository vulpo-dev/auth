use crate::error::ApiError;
use crate::file::File;
use crate::user::User;
use crate::ADMIN_CLIENT;
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use rocket::http::Status;
use rocket::request::Outcome;
use rocket::request::{self, FromRequest, Request};
use rocket::Route;
use std::path::PathBuf;

mod create;
mod create_project;
mod create_user;
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

pub fn routes() -> Vec<Route> {
    routes![
        files,
        admin_index,
        create::handler,
        create::create_once,
        create_user::handler,
        create_project::handler,
        has_admin::handler,
        project::has,
        project::create
    ]
}

#[derive(Debug)]
pub struct Admin(User);

#[rocket::async_trait]
impl<'a, 'r> FromRequest<'a, 'r> for Admin {
    type Error = ApiError;

    async fn from_request(req: &'a Request<'r>) -> request::Outcome<Self, Self::Error> {
        let token_string = match req.headers().get_one("Authorization") {
            None => return Outcome::Failure((Status::BadRequest, ApiError::AuthTokenMissing)),
            Some(token) => token,
        };

        let end = token_string.len();
        let start = "Bearer ".len();
        let token = &token_string[start..end];

        let token_data = match decode::<User>(
            &token,
            &DecodingKey::from_secret("secret".as_ref()),
            &Validation::new(Algorithm::HS256),
        ) {
            Ok(token) => token,
            Err(_) => return Outcome::Failure((Status::BadRequest, ApiError::BadRequest)),
        };

        let user = token_data.claims;

        if !user.traits.contains(&String::from("Admin")) {
            return Outcome::Failure((Status::BadRequest, ApiError::AdminAuth));
        }

        Outcome::Success(Admin(user))
    }
}
