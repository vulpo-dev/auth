use crate::admin::data::Admin;
use crate::db::Db;
use crate::project::data::Project;
use crate::response::error::ApiError;

use rocket::http::Status;
use rocket::serde::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct Payload {
    pub project: Uuid,
}

#[post("/delete", data = "<body>")]
pub async fn delete_project(
    pool: Db,
    body: Json<Payload>,
    _admin: Admin,
) -> Result<Status, ApiError> {
    Project::delete(&pool, &body.project).await?;
    Ok(Status::Ok)
}
