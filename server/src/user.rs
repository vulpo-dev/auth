use crate::db::get_query;
use crate::db::AuthDb;
use crate::response::error::ApiError;
use rocket::http::RawStr;
use rocket::request::FromParam;
use rocket::Route;
use rocket_contrib::json::Json;
use serde::{Deserialize, Serialize};
use serde_json::value::Value;
use uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: uuid::Uuid,
    pub email: String,
    pub email_verified: bool,
    pub photo_url: Option<String>,
    pub traits: Vec<String>,
    pub data: Value,
    pub provider_id: String,
}

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
pub struct PartialUser {
    pub id: uuid::Uuid,
    pub display_name: String,
    pub email: String,
}

#[get("/<id>")]
async fn get_user(conn: AuthDb, id: Uuid) -> Result<Json<PartialUser>, ApiError> {
    let query = get_query("user/get.sql")?;
    let Uuid(id) = id;
    let row = conn.run(move |c| c.query_one(query, &[&id])).await;

    match row {
        Ok(user) => Ok(Json(PartialUser {
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
