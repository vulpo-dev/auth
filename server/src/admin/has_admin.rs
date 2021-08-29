use crate::admin::data::Admin;
use crate::db::Db;
use crate::response::error::ApiError;

use rocket::serde::json::Json;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct HasAdmin {
    has_admin: bool,
}

#[get("/__/has_admin")]
pub async fn handler(pool: Db) -> Result<Json<HasAdmin>, ApiError> {
    Admin::has_admin(&pool)
        .await
        .map(|has_admin| HasAdmin { has_admin })
        .map(Json)
}
