use crate::db::Db;
use crate::project::data::Flags;
use crate::response::error::ApiError;
use rocket::serde::uuid::Uuid;

use rocket::serde::{json::Json, Serialize};

pub async fn get_flags(pool: &Db, project: &Uuid) -> Result<Vec<Flags>, ApiError> {
    let items = Flags::from_project(&pool, &project).await?;
    Ok(items)
}

#[get("/flags?<project>")]
pub async fn handler(pool: Db, project: Uuid) -> Result<Json<Response>, ApiError> {
    let items = get_flags(&pool, &project).await?;
    Ok(Json(Response { items }))
}

#[derive(Serialize)]
pub struct Response {
    pub items: Vec<Flags>,
}
