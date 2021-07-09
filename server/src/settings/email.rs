use crate::admin::data::Admin;
use crate::db::Db;
use crate::response::error::ApiError;
use crate::settings::data::{EmailSettings, ProjectEmail};

use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;

#[get("/email?<project_id>")]
pub async fn get_handler(
    pool: Db<'_>,
    project_id: Uuid,
    _admin: Admin,
) -> Result<Json<Option<EmailSettings>>, ApiError> {
    let settings = ProjectEmail::from_project(pool.inner(), project_id).await?;
    Ok(Json(settings))
}

#[post("/email?<project_id>", format = "json", data = "<body>")]
pub async fn create_handler(
    pool: Db<'_>,
    project_id: Uuid,
    body: Json<EmailSettings>,
) -> Result<(), ApiError> {
    let settings = body.into_inner();
    ProjectEmail::insert(pool.inner(), project_id, settings).await?;

    Ok(())
}
