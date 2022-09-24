use crate::keys::data::PublicKey;
use crate::response::error::ApiError;

use chrono::{DateTime, Duration, Utc};
use rocket::serde::{json::Json, Serialize};
use werkbank::rocket::Db;

#[derive(Serialize)]
pub struct PublicKeys {
    pub expire_at: DateTime<Utc>,
    pub keys: Vec<PublicKey>,
}

pub async fn get_public_keys(pool: &Db) -> Result<PublicKeys, ApiError> {
    let expire_at = Utc::now() + Duration::hours(6);
    let keys = PublicKey::get_all(&pool).await?;
    Ok(PublicKeys { keys, expire_at })
}

#[get("/")]
pub async fn handler(pool: Db) -> Result<Json<PublicKeys>, ApiError> {
    let keys = get_public_keys(&pool).await?;
    Ok(Json(keys))
}
