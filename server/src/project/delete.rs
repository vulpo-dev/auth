use crate::admin::data::Admin;
use crate::project::data::Project;

use rocket::http::Status;
use rocket::serde::json::Json;
use serde::Deserialize;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

#[derive(Deserialize)]
pub struct Payload {
    pub project: Uuid,
}

pub async fn delete(pool: &Db, project_id: &Uuid) -> Result<(), ApiError> {
    Project::delete(&pool, project_id).await?;
    Ok(())
}

#[post("/delete", data = "<body>")]
pub async fn handler(pool: Db, body: Json<Payload>, _admin: Admin) -> Result<Status, ApiError> {
    delete(&pool, &body.project).await?;
    Ok(Status::Ok)
}
