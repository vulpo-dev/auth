use crate::admin::data::Admin;
use crate::project::data::Project;

use rocket::http::Status;
use rocket::serde::json::Json;
use serde::Deserialize;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::{Cache, Db};

#[derive(Deserialize)]
pub struct SetProjectSettings {
    pub project: Uuid,
    pub name: String,
    pub domain: String,
}

pub async fn set_project_settings(
    cache: &Cache,
    pool: &Db,
    settings: SetProjectSettings,
) -> Result<(), ApiError> {
    Project::set_settings(
        &cache,
        &pool,
        &settings.project,
        &settings.name,
        &settings.domain,
    )
    .await?;
    Ok(())
}

#[post("/project", format = "json", data = "<body>")]
pub async fn handler(
    pool: Db,
    body: Json<SetProjectSettings>,
    cache: Cache,
    _admin: Admin,
) -> Result<Status, ApiError> {
    set_project_settings(&cache, &pool, body.into_inner()).await?;
    Ok(Status::Ok)
}
