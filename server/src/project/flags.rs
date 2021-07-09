use crate::db::Db;
use crate::project::data::Flags;
use crate::response::error::ApiError;
use rocket::serde::uuid::Uuid;

use rocket::serde::{json::Json, Serialize};

#[get("/flags?<project>")]
pub async fn handler(pool: Db<'_>, project: Uuid) -> Result<Json<Response>, ApiError> {
    Flags::from_project(pool.inner(), &project)
        .await
        .map(|items| Response { items })
        .map(Json)
}

#[derive(Serialize)]
pub struct Response {
    pub items: Vec<Flags>,
}
