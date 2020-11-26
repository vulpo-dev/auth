use crate::SQL;
use rocket::http::Status;
use rocket_contrib::database;
use rocket_contrib::databases::postgres;

#[database("auth")]
pub struct AuthDb(postgres::Client);

pub fn get_query(path: &str) -> Result<&str, Status> {
    let file = match SQL.get_file(path) {
        Some(file) => file,
        None => return Err(Status::NotFound),
    };

    match file.contents_utf8() {
        Some(content) => Ok(content),
        None => return Err(Status::NotFound),
    }
}
