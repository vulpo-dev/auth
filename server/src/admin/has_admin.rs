use crate::admin::data::Admin;

use rocket::serde::json::Json;
use serde::Serialize;
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

pub async fn server_has_admin(pool: &Db) -> Result<bool, ApiError> {
    let result = Admin::has_admin(&pool).await?;
    result.ok_or(ApiError::InternalServerError)
}

#[derive(Debug, Serialize)]
pub struct HasAdmin {
    has_admin: bool,
}

#[get("/__/has_admin")]
pub async fn handler(pool: Db) -> Result<Json<HasAdmin>, ApiError> {
    let has_admin = server_has_admin(&pool).await?;
    Ok(Json(HasAdmin { has_admin }))
}
