use crate::api_key::data::ApiKey;
use crate::crypto::Token;
use crate::response::error::ApiError;

use chrono::Utc;
use rocket::serde::json::Json;
use serde::Deserialize;
use vulpo::Claims;
use werkbank::rocket::Db;

#[derive(Deserialize)]
pub struct VerifyPayload {
    pub api_key: String,
}

pub async fn verify_api_key(pool: &Db, token: &str) -> Result<Claims, ApiError> {
    let (id, raw_token) = ApiKey::parse_token(token)?;

    let api_key = ApiKey::get_token(&pool, &id)
        .await?
        .ok_or_else(|| ApiError::TokenNotFound)?;

    if let Some(expire_at) = api_key.expire_at {
        if Utc::now() > expire_at {
            return Err(ApiError::TokenExpired);
        }
    }

    let is_valid = Token::verify(&raw_token, &api_key.token)?;

    if !is_valid {
        return Err(ApiError::TokenInvalid);
    }

    let claims = ApiKey::get_claims(&pool, &id).await?;
    Ok(claims)
}

#[post("/verify", format = "json", data = "<body>")]
pub async fn verify(pool: Db, body: Json<VerifyPayload>) -> Result<Json<Claims>, ApiError> {
    verify_api_key(&pool, &body.api_key).await.map(Json)
}
