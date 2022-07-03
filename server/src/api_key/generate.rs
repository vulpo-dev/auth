use crate::api_key::data::ApiKey;

use crate::response::error::ApiError;
use crate::session::data::AccessToken;
use crate::user::data::User;
use crate::{crypto::Token, db::Db};

use base64;
use chrono::{DateTime, Utc};
use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct Payload {
    pub expire_at: Option<DateTime<Utc>>,
    pub name: Option<String>,
}

#[derive(Serialize)]
pub struct ApiKeyResponse {
    pub api_key: String,
}

#[post("/generate", format = "json", data = "<body>")]
pub async fn generate(
    pool: Db,
    access_token: AccessToken,
    body: Json<Payload>,
) -> Result<Json<ApiKeyResponse>, ApiError> {
    let token = Token::create();
    let hashed_token = Token::hash(&token)?;

    let user_id = access_token.sub();

    let project_id = User::project(&pool, &user_id)
        .await?
        .ok_or(ApiError::BadRequest)?;

    let id = ApiKey::insert(
        &pool,
        &hashed_token,
        &user_id,
        &body.expire_at,
        &body.name,
        &project_id,
    )
    .await?;

    let token = format!("{}:{}", id, token);
    let api_key = base64::encode(token);
    Ok(Json(ApiKeyResponse { api_key }))
}
