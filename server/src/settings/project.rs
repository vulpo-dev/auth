use crate::admin::data::Admin;
use crate::db::Db;
use crate::project::data::Project;
use crate::response::error::ApiError;

use rocket::serde::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct SetProjectSettings {
    pub project: Uuid,
    pub name: String,
    pub domain: String,
}

#[post("/project", format = "json", data = "<body>")]
pub async fn set_settings(
    pool: Db,
    body: Json<SetProjectSettings>,
    _admin: Admin,
) -> Result<(), ApiError> {
    Project::set_settings(&pool, &body.project, &body.name, &body.domain).await?;
    Ok(())
}
