use crate::db::get_query;
use crate::db::AuthDb;
use crate::response::error::ApiError;
use rocket::Route;
use rocket_contrib::json::Json;
use rocket_contrib::uuid::Uuid;
use serde::Serialize;
use uuid;

#[derive(Serialize)]
pub struct PartialUser {
    pub id: uuid::Uuid,
    pub display_name: String,
    pub email: String,
}

#[get("/<id>")]
async fn get_user(conn: AuthDb, id: Uuid) -> Result<Json<PartialUser>, ApiError> {
    let query = get_query("user/get.sql")?;
    let row = conn
        .run(move |c| c.query_one(query, &[&id.to_string()]))
        .await;

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
