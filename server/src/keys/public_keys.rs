use crate::db::Db;
use crate::keys::data::PublicKey;
use crate::response::error::ApiError;

use chrono::{DateTime, Duration, Utc};
use rocket::serde::{json::Json, Serialize};

#[derive(Serialize)]
pub struct PublicKeys {
    pub expire_at: DateTime<Utc>,
    pub keys: Vec<PublicKey>,
}

#[get("/")]
pub async fn handler(pool: Db) -> Result<Json<PublicKeys>, ApiError> {
    let expire_at = Utc::now() + Duration::hours(6);
    let keys = PublicKey::get_all(&pool).await?;

    Ok(Json(PublicKeys { keys, expire_at }))
}
