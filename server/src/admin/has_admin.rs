use crate::data::admin::Admin;
use crate::data::AuthDb;
use crate::response::error::ApiError;

use rocket_contrib::json::Json;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct HasAdmin {
    has_admin: bool,
}

#[get("/__/has_admin")]
pub async fn handler(conn: AuthDb) -> Result<Json<HasAdmin>, ApiError> {
    let has = conn.run(|client| Admin::has_admin(client)).await?;
    Ok(Json(HasAdmin { has_admin: has }))
}
