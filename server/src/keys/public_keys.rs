use crate::db::Db;
use crate::keys::data::PublicKey;
use crate::response::error::ApiError;

use chrono::{DateTime, Duration, Utc};
use rocket_contrib::json::Json;
use serde::Serialize;

#[derive(Serialize)]
pub struct PublicKeys {
    pub expire_at: DateTime<Utc>,
    pub keys: Vec<PublicKey>,
}

#[get("/")]
pub async fn handler(pool: Db<'_>) -> Result<Json<PublicKeys>, ApiError> {
    let keys = PublicKey::get_all(pool.inner()).await?;
    let expire_at = Utc::now() + Duration::hours(6);
    Ok(Json(PublicKeys { keys, expire_at }))
}
