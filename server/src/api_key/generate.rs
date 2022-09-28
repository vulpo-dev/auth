use crate::api_key::data::ApiKey;
use crate::crypto::Token;
use crate::session::data::AccessToken;
use crate::user::data::User;

use base64;
use rocket::serde::json::Json;
use uuid::Uuid;
use vulpo_auth_types::api_key::{ApiKeyResponse, GenerateApiKeyPayload};
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::db::Db;

pub async fn generate_api_key(
    pool: &Db,
    user_id: &Uuid,
    config: GenerateApiKeyPayload,
) -> Result<(Uuid, String), ApiError> {
    let token = Token::create();
    let hashed_token = Token::hash(&token)?;

    let project_id = User::project(&pool, &user_id)
        .await?
        .ok_or(ApiError::BadRequest)?;

    let id = ApiKey::insert(
        &pool,
        &hashed_token,
        &user_id,
        &config.expire_at,
        &config.name,
        &project_id,
    )
    .await?;

    let token = format!("{}:{}", id, token);
    let api_key = base64::encode(token);
    Ok((id, api_key))
}

#[post("/generate", format = "json", data = "<body>")]
pub async fn generate(
    pool: Db,
    access_token: AccessToken,
    body: Json<GenerateApiKeyPayload>,
) -> Result<Json<ApiKeyResponse>, ApiError> {
    let user_id = access_token.sub();
    let (id, api_key) = generate_api_key(&pool, &user_id, body.into_inner()).await?;
    Ok(Json(ApiKeyResponse { id, api_key }))
}
