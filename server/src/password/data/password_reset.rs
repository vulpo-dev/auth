use crate::response::error::ApiError;

use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

pub struct PasswordReset {
    pub token: String,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
}

impl PasswordReset {
    pub async fn insert(pool: &PgPool, user_id: &Uuid, token: String) -> Result<Uuid, ApiError> {
        sqlx::query!(
            r#"
            insert into password_change_requests (token, user_id)
            values ($1, $2)
            returning id
        "#,
            token,
            user_id
        )
        .fetch_one(pool)
        .await
        .map(|row| row.id)
        .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn get(pool: &PgPool, id: &Uuid) -> Result<PasswordReset, ApiError> {
        let row = sqlx::query_as!(
            PasswordReset,
            r#"
            select token, user_id, created_at
              from password_change_requests
             where id = $1
        "#,
            id
        )
        .fetch_optional(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        match row {
            None => Err(ApiError::ResetTokenNotFound),
            Some(entry) => Ok(entry),
        }
    }

    pub async fn remove(pool: &PgPool, user_id: &Uuid) -> Result<(), ApiError> {
        sqlx::query!(
            r#"
            delete from password_change_requests
             where user_id = $1
        "#,
            user_id
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }
}
