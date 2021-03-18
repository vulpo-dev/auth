use crate::admin::data::Admin;
use crate::db::Db;
use crate::response::error::ApiError;
use crate::settings::data::{EmailSettings, ProjectEmail};

use rocket_contrib::json::Json;
use rocket_contrib::uuid::Uuid;

#[get("/email?<project>")]
pub async fn get_handler(
    pool: Db<'_>,
    project: Uuid,
    _admin: Admin,
) -> Result<Json<Option<EmailSettings>>, ApiError> {
    let project_id = project.into_inner();
    let settings = ProjectEmail::from_project(pool.inner(), project_id).await?;
    Ok(Json(settings))
}

#[post("/email?<project>", data = "<body>")]
pub async fn create_handler(
    pool: Db<'_>,
    project: Uuid,
    body: Json<EmailSettings>,
) -> Result<(), ApiError> {
    let settings = body.into_inner();
    let project_id = project.into_inner();
    ProjectEmail::insert(pool.inner(), project_id, settings).await?;

    Ok(())
}
