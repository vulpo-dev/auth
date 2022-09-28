use crate::admin::data::Admin;
use crate::settings::data::{EmailSettings, ProjectEmail};

use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::serde::uuid::Uuid;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

pub async fn get_email_settings(
    pool: &Db,
    project_id: Uuid,
) -> Result<Option<EmailSettings>, ApiError> {
    let settings = ProjectEmail::from_project(&pool, project_id).await?;
    Ok(settings)
}

#[get("/email?<project_id>")]
pub async fn get_handler(
    pool: Db,
    project_id: Uuid,
    _admin: Admin,
) -> Result<Json<Option<EmailSettings>>, ApiError> {
    let settings = get_email_settings(&pool, project_id).await?;
    Ok(Json(settings))
}

pub async fn create_email_settings(
    pool: &Db,
    settings: EmailSettings,
    project_id: Uuid,
) -> Result<(), ApiError> {
    ProjectEmail::insert(&pool, project_id, settings).await?;
    Ok(())
}

#[post("/email?<project_id>", format = "json", data = "<body>")]
pub async fn create_handler(
    pool: Db,
    project_id: Uuid,
    body: Json<EmailSettings>,
) -> Result<Status, ApiError> {
    let settings = body.into_inner();
    create_email_settings(&pool, settings, project_id).await?;
    Ok(Status::Ok)
}
