use base64;
use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use std::str::{self, FromStr};
use uuid::Uuid;
use vulpo::Claims;
use vulpo_auth_types::error::ApiError;

#[derive(Serialize)]
pub struct ApiKey {
    pub id: Uuid,
    pub name: Option<String>,
    pub expire_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
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

    pub async fn get_claims(pool: &PgPool, id: &Uuid) -> sqlx::Result<Claims> {
        sqlx::query_file_as!(Claims, "src/api_key/sql/get_claims.sql", id)
            .fetch_one(pool)
            .await
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

    pub async fn list(
        pool: &PgPool,
        user_id: &Uuid,
        project_id: &Uuid,
    ) -> sqlx::Result<Vec<ApiKey>> {
        sqlx::query_file_as!(
            ApiKey,
            "src/api_key/sql/list_api_keys.sql",
            user_id,
            project_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn delete(
        pool: &PgPool,
        id: &Uuid,
        user_id: &Uuid,
        project_id: &Uuid,
    ) -> sqlx::Result<()> {
        sqlx::query_file!(
            "src/api_key/sql/delete_api_key.sql",
            id,
            project_id,
            user_id,
        )
        .execute(pool)
        .await?;

        Ok(())
    }
}

#[derive(Serialize)]
pub struct ApiKeys {
    pub keys: Vec<ApiKey>,
}
