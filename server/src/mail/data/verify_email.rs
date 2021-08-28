use crate::response::error::ApiError;

use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

pub struct VerifyEmail {
    pub token: String,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub expire_at: DateTime<Utc>,
}

impl VerifyEmail {
    pub async fn insert(
        pool: &PgPool,
        user_id: &Uuid,
        token: String,
        project_id: &Uuid,
    ) -> Result<Uuid, ApiError> {
        sqlx::query!(
            r#"
            insert into verify_email (token, user_id, project_id)
            values ($1, $2, $3)
            returning id
        "#,
            token,
            user_id,
            project_id
        )
        .fetch_one(pool)
        .await
        .map(|row| row.id)
        .map_err(|_err| ApiError::InternalServerError)
    }

    pub async fn get(pool: &PgPool, id: &Uuid) -> Result<VerifyEmail, ApiError> {
        let row = sqlx::query_as!(
            VerifyEmail,
            r#"
            select token
                 , user_id
                 , created_at
                 , expire_at
              from verify_email
             where id = $1
        "#,
            id
        )
        .fetch_optional(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        row.ok_or_else(|| ApiError::TokenNotFound)
    }

    pub async fn verify(pool: &PgPool, user_id: &Uuid) -> Result<(), ApiError> {
        sqlx::query!(
            r#"
            with delete_token as (
                delete from verify_email
                 where user_id = $1
                 returning user_id
            )
            update users
               set email_verified = true
              from delete_token
             where id = delete_token.user_id
        "#,
            user_id
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn unverify(pool: &PgPool, user_id: &Uuid) -> Result<String, ApiError> {
        sqlx::query!(
            r#"
            update users
               set email_verified = false
             where id = $1
            returning users.email
        "#,
            user_id
        )
        .fetch_one(pool)
        .await
        .map(|row| row.email)
        .map_err(|_| ApiError::InternalServerError)
    }
}
