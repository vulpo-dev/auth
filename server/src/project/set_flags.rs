use crate::admin::data::Admin;
use crate::db::Db;
use crate::project::data::Flags;
use crate::response::error::ApiError;
use rocket::http::Status;
use uuid::Uuid;

use rocket::serde::json::Json;
use serde::Deserialize;

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
