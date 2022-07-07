use crate::crypto::Token;
use crate::response::error::ApiError;

use base64;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use std::str::{self, FromStr};
use uuid::Uuid;
use vulpo::Claims;

pub struct ApiKey {
    pub api_key: String,
}

pub struct ApiKeyToken {
    pub token: String,
    pub expire_at: Option<DateTime<Utc>>,
}

impl ApiKey {
    pub async fn insert(
        pool: &PgPool,
        token: &str,
        user_id: &Uuid,
        expire_at: &Option<DateTime<Utc>>,
        name: &Option<String>,
        project_id: &Uuid,
    ) -> sqlx::Result<Uuid> {
        let default_name = String::from("");
        let name = name.as_ref().unwrap_or(&default_name);
        sqlx::query_file!(
            "src/api_key/sql/create_api_key.sql",
            token,
            user_id,
            *expire_at,
            name,
            project_id,
        )
        .fetch_one(pool)
        .await
        .map(|row| row.id)
    }

    pub async fn get_token(pool: &PgPool, id: &Uuid) -> sqlx::Result<Option<ApiKeyToken>> {
        sqlx::query_file_as!(ApiKeyToken, "src/api_key/sql/get_token.sql", id)
            .fetch_optional(pool)
            .await
    }

    pub async fn get_claims(pool: &PgPool, token: &str) -> Result<Claims, ApiError> {
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

        sqlx::query_file_as!(Claims, "src/api_key/sql/get_claims.sql", id)
            .fetch_one(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)
    }

    pub fn parse_token(token: &str) -> Result<(Uuid, String), ApiError> {
        let token = base64::decode(token).map_err(|_| ApiError::BadRequest)?;

        let token = str::from_utf8(&token).map_err(|_| ApiError::BadRequest)?;

        let token_stream: Vec<&str> = token.split(":").collect();

        let id = token_stream
            .get(0)
            .and_then(|id| Uuid::parse_str(id).ok())
            .ok_or_else(|| ApiError::BadRequest)?;

        let raw_token = token_stream
            .get(1)
            .ok_or_else(|| ApiError::BadRequest)?
            .to_owned();

        let token = String::from_str(raw_token).map_err(|_| ApiError::InternalServerError)?;

        Ok((id, token))
    }
}
