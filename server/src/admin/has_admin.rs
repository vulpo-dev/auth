use crate::db::{get_query, AuthDb};
use crate::response::error::ApiError;
use rocket_contrib::json::Json;
use serde::Serialize;

pub async fn has_admin(conn: &AuthDb) -> Result<bool, ApiError> {
    let query = get_query("admin/has_admin")?;
    let row = conn.run(move |c| c.query_one(query, &[])).await;

    match row {
        Ok(result) => Ok(result.get("has_admin")),
        Err(_) => Err(ApiError::InternalServerError),
    }
}

#[derive(Debug, Serialize)]
pub struct HasAdmin {
    has_admin: bool,
}

#[get("/__/has_admin")]
pub async fn handler(conn: AuthDb) -> Result<Json<HasAdmin>, ApiError> {
    let has = has_admin(&conn).await?;
    Ok(Json(HasAdmin { has_admin: has }))
}
