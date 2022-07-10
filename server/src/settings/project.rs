use crate::admin::data::Admin;
use crate::db::Db;
use crate::project::data::Project;
use crate::response::error::ApiError;

use rocket::http::Status;
use rocket::serde::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct SetProjectSettings {
    pub project: Uuid,
    pub name: String,
    pub domain: String,
}

pub async fn set_project_settings(pool: &Db, settings: SetProjectSettings) -> Result<(), ApiError> {
    Project::set_settings(&pool, &settings.project, &settings.name, &settings.domain).await?;
    Ok(())
}

#[post("/project", format = "json", data = "<body>")]
pub async fn handler(
    pool: Db,
    body: Json<SetProjectSettings>,
    _admin: Admin,
) -> Result<Status, ApiError> {
    set_project_settings(&pool, body.into_inner()).await?;
    Ok(Status::Ok)
}
