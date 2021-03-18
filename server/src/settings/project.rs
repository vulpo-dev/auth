use crate::admin::data::Admin;
use crate::db::Db;
use crate::project::data::Project;
use crate::response::error::ApiError;

use rocket_contrib::json::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct SetProjectSettings {
    pub project: Uuid,
    pub name: String,
    pub domain: String,
}

#[post("/project", data = "<body>")]
pub async fn set_settings(
    pool: Db<'_>,
    body: Json<SetProjectSettings>,
    _admin: Admin,
) -> Result<(), ApiError> {
    Project::set_settings(pool.inner(), &body.project, &body.name, &body.domain).await?;
    Ok(())
}
