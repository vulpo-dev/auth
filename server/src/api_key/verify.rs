use crate::api_key::data::ApiKey;
use crate::db::Db;
use crate::response::error::ApiError;

use rocket::serde::json::Json;
use serde::Deserialize;
use vulpo::Claims;

#[derive(Deserialize)]
pub struct VerifyPayload {
    pub api_key: String,
}

#[post("/verify", format = "json", data = "<body>")]
pub async fn verify(pool: Db, body: Json<VerifyPayload>) -> Result<Json<Claims>, ApiError> {
    ApiKey::get_claims(&pool, &body.api_key).await.map(Json)
}
