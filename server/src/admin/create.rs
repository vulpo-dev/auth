use crate::admin::data::{Admin, NewAdmin};
use crate::db::Db;
use crate::project::Project;
use crate::response::error::ApiError;

use rocket;
use rocket::serde::json::Json;
use uuid::Uuid;

#[post("/__/create", format = "json", data = "<body>")]
pub async fn handler(
    pool: Db<'_>,
    body: Json<NewAdmin>,
    project: Project,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    Admin::create(pool.inner(), body.into_inner(), project.id)
        .await
        .map(|id| [id])
        .map(Json)
}

#[post("/__/create_once", format = "json", data = "<body>")]
pub async fn create_once(
    pool: Db<'_>,
    body: Json<NewAdmin>,
    project: Project,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let has_admin = Admin::has_admin(pool.inner()).await?;

    if has_admin {
        return Err(ApiError::AdminHasAdmin);
    }

    Admin::create(pool.inner(), body.into_inner(), project.id)
        .await
        .map(|id| [id])
        .map(Json)
}
