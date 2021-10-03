use crate::response::error::ApiError;

use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

pub struct ApiKey {
    pub api_key: String,
}

impl ApiKey {
    pub async fn insert(
        pool: &PgPool,
        token: &str,
        user_id: &Uuid,
        expire_at: &Option<DateTime<Utc>>,
        name: &Option<String>,
    ) -> Result<Uuid, ApiError> {
        let default_name = String::from("");
        let name = name.as_ref().unwrap_or(&default_name);
        sqlx::query_file!(
            "src/api_key/sql/create_api_key.sql",
            token,
            user_id,
            *expire_at,
            name,
        )
        .fetch_one(pool)
        .await
        .map(|row| row.id)
        .map_err(|_| ApiError::InternalServerError)
    }
}
