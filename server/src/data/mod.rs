pub mod admin;
pub mod keys;
pub mod password_reset;
pub mod project;
pub mod token;
pub mod user;
pub mod verify_email;

use crate::response::error::ApiError;
use crate::SQL;

use rocket_contrib::database;
use rocket_contrib::databases::postgres;
use rocket_contrib::databases::postgres::error::Error;
use rocket_contrib::databases::postgres::types::ToSql;
use rocket_contrib::databases::postgres::Row;
use rocket_contrib::databases::postgres::ToStatement;

#[database("auth")]
pub struct AuthDb(postgres::Client);

// TODO Proper Error Response
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

// workaround until rocket_contrib uses postgres 0.18.0
pub trait GenericClient {
    fn query_one<T: ?Sized + ToStatement>(
        &mut self,
        query: &T,
        params: &[&(dyn ToSql + Sync)],
    ) -> Result<Row, Error>;

    fn query<T: ?Sized + ToStatement>(
        &mut self,
        query: &T,
        params: &[&(dyn ToSql + Sync)],
    ) -> Result<Vec<Row>, Error>;
}

impl GenericClient for postgres::Client {
    fn query_one<T: ?Sized + ToStatement>(
        &mut self,
        query: &T,
        params: &[&(dyn ToSql + Sync)],
    ) -> Result<Row, Error> {
        self.query_one(query, params)
    }

    fn query<T: ?Sized + ToStatement>(
        &mut self,
        query: &T,
        params: &[&(dyn ToSql + Sync)],
    ) -> Result<Vec<Row>, Error> {
        self.query(query, params)
    }
}

impl GenericClient for postgres::Transaction<'_> {
    fn query_one<T: ?Sized + ToStatement>(
        &mut self,
        query: &T,
        params: &[&(dyn ToSql + Sync)],
    ) -> Result<Row, Error> {
        self.query_one(query, params)
    }

    fn query<T: ?Sized + ToStatement>(
        &mut self,
        query: &T,
        params: &[&(dyn ToSql + Sync)],
    ) -> Result<Vec<Row>, Error> {
        self.query(query, params)
    }
}
