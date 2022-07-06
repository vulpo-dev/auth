use crate::admin::data::{Admin, NewAdmin};
use crate::db::Db;
use crate::password::data::{Password, PasswordAlg};
use crate::project::Project;
use crate::response::error::ApiError;

use rocket;
use rocket::serde::json::Json;
use uuid::Uuid;

#[post("/__/create", format = "json", data = "<body>")]
pub async fn handler(
    pool: Db,
    body: Json<NewAdmin>,
    project: Project,
    _admin: Admin,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let password = Password::hash(&body.password, &PasswordAlg::Argon2id)
        .map_err(|_| ApiError::InternalServerError)?;

    let admin = NewAdmin {
        password,
        ..body.into_inner()
    };

    let id = Admin::create(&pool, admin, project.id).await?;
    Ok(Json([id]))
}

#[post("/__/create_once", format = "json", data = "<body>")]
pub async fn create_once(
    pool: Db,
    body: Json<NewAdmin>,
    project: Project,
) -> Result<Json<[Uuid; 1]>, ApiError> {
    let has_admin = Admin::has_admin(&pool).await?;

    if has_admin {
        return Err(ApiError::AdminHasAdmin);
    }

    let password = Password::hash(&body.password, &PasswordAlg::Argon2id)
        .map_err(|_| ApiError::InternalServerError)?;

    let admin = NewAdmin {
        password,
        ..body.into_inner()
    };

    let id = Admin::create(&pool, admin, project.id).await?;
    Ok(Json([id]))
}
