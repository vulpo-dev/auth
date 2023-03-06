use crate::admin::data::Admin;

use rocket::serde::json::Json;
use serde::Serialize;
use sqlx::PgPool;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

pub async fn server_has_admin(pool: &PgPool) -> Result<bool, ApiError> {
    let result = Admin::has_admin(&pool).await?;
    result.ok_or(ApiError::InternalServerError)
}

#[derive(Debug, Serialize)]
pub struct HasAdmin {
    has_admin: bool,
}

#[get("/has_admin")]
pub async fn handler(pool: Db) -> Result<Json<HasAdmin>, ApiError> {
    let has_admin = server_has_admin(&pool).await?;
    Ok(Json(HasAdmin { has_admin }))
}
