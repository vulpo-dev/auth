use crate::admin::data::Admin;
use crate::project::data::Flags;
use rocket::http::Status;
use uuid::Uuid;

use rocket::serde::json::Json;
use serde::Deserialize;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

pub async fn set_flags(pool: &Db, flags: &[Flags], project_id: &Uuid) -> Result<(), ApiError> {
    Flags::set_flags(&pool, &project_id, &flags).await?;
    Ok(())
}

#[post("/set_flags", format = "json", data = "<body>")]
pub async fn handler(pool: Db, body: Json<Payload>, _admin: Admin) -> Result<Status, ApiError> {
    set_flags(&pool, &body.flags, &body.project).await?;
    Ok(Status::Ok)
}

#[derive(Deserialize)]
pub struct Payload {
    pub flags: Vec<Flags>,
    pub project: Uuid,
}
