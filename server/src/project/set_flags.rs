use crate::admin::data::Admin;
use crate::db::Db;
use crate::project::data::Flags;
use crate::response::error::ApiError;
use uuid::Uuid;

use rocket::serde::json::Json;
use serde::Deserialize;

#[post("/set_flags", format = "json", data = "<body>")]
pub async fn handler(pool: Db<'_>, body: Json<Payload>, _admin: Admin) -> Result<(), ApiError> {
    Flags::set_flags(pool.inner(), &body.project, &body.flags).await?;
    Ok(())
}

#[derive(Deserialize)]
pub struct Payload {
    pub flags: Vec<Flags>,
    pub project: Uuid,
}
