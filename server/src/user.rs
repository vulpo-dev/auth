use crate::db::get_query;
use crate::error::ApiError;
use rocket::http::RawStr;
use rocket::request::FromParam;
use rocket::Route;
use rocket_contrib::json::Json;

use crate::db::AuthDb;
use serde::Serialize;
use uuid;

struct Uuid(uuid::Uuid);

impl<'r> FromParam<'r> for Uuid {
    type Error = &'r RawStr;

    fn from_param(param: &'r RawStr) -> Result<Self, Self::Error> {
        match uuid::Uuid::parse_str(param) {
            Ok(id) => Ok(Uuid(id)),
            Err(_) => Err(param),
        }
    }
}

#[derive(Serialize)]
pub struct User {
    pub id: uuid::Uuid,
    pub display_name: String,
    pub email: String,
}

#[get("/<id>")]
async fn get_user(conn: AuthDb, id: Uuid) -> Result<Json<User>, ApiError> {
    let query = get_query("user/get.sql")?;
    let Uuid(id) = id;
    let row = conn.run(move |c| c.query_one(query, &[&id])).await;

    match row {
        Ok(user) => Ok(Json(User {
            id: user.get("id"),
            display_name: user.get("display_name"),
            email: user.get("email"),
        })),

        Err(_) => Err(ApiError::NotFound),
    }
}

pub fn routes() -> Vec<Route> {
    routes![get_user]
}
