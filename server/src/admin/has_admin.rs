use crate::admin::data::Admin;
use crate::db::Db;
use crate::response::error::ApiError;

use rocket_contrib::json::Json;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct HasAdmin {
    has_admin: bool,
}

#[get("/__/has_admin")]
pub async fn handler(pool: Db<'_>) -> Result<Json<HasAdmin>, ApiError> {
    Admin::has_admin(pool.inner())
        .await
        .map(|has_admin| HasAdmin { has_admin })
        .map(Json)
}
