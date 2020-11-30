use crate::response::error::ApiError;
use crate::SQL;

use rocket_contrib::database;
use rocket_contrib::databases::postgres;

#[database("auth")]
pub struct AuthDb(postgres::Client);

// TODO: Proper Error Response
pub fn get_query(path: &str) -> Result<&str, ApiError> {
    let mut path = String::from(path);

    if !path.ends_with(".sql") {
        path.push_str(".sql");
    }

    let file = match SQL.get_file(path) {
        Some(file) => file,
        None => return Err(ApiError::InternalServerError),
    };

    match file.contents_utf8() {
        Some(content) => Ok(content),
        None => return Err(ApiError::InternalServerError),
    }
}
