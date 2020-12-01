use crate::data::admin::{Admin, NewProject};
use crate::data::AuthDb;
use crate::response::error::ApiError;

use rocket;
use rocket_contrib::json::Json;
use uuid::Uuid;

#[post("/__/create_project", data = "<body>")]
pub async fn handler(
    conn: AuthDb,
    body: Json<NewProject>,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let id = conn
        .run(|client| Admin::create_project(client, body.into_inner()))
        .await?;

    Ok(Json([id]))
}
