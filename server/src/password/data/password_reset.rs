use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;

pub struct PasswordReset {
    pub token: String,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub expire_at: DateTime<Utc>,
}

impl PasswordReset {
    pub async fn insert(
        pool: &PgPool,
        user_id: &Uuid,
        project_id: &Uuid,
        token: String,
    ) -> Result<Uuid, ApiError> {
        sqlx::query_file!(
            "src/password/sql/insert_password_change_request.sql",
            token,
            user_id,
            project_id
        )
        .fetch_one(pool)
        .await
        .map(|row| row.id)
        .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn get(pool: &PgPool, id: &Uuid) -> Result<PasswordReset, ApiError> {
        let row = sqlx::query_file_as!(
            PasswordReset,
            "src/password/sql/get_password_change_request.sql",
            id
        )
        .fetch_optional(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        row.ok_or_else(|| ApiError::ResetTokenNotFound)
    }

    pub async fn remove(pool: &PgPool, user_id: &Uuid) -> Result<(), ApiError> {
        sqlx::query_file!(
            "src/password/sql/remove_password_change_request.sql",
            user_id
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }
}
