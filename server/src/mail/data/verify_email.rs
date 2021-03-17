use crate::response::error::ApiError;

use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

pub struct VerifyEmail {
    pub token: String,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
}

impl VerifyEmail {
    pub async fn insert(pool: &PgPool, user_id: &Uuid, token: String) -> Result<Uuid, ApiError> {
        sqlx::query!(
            r#"
            insert into verify_email (token, user_id)
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

    pub async fn get(pool: &PgPool, id: &Uuid) -> Result<VerifyEmail, ApiError> {
        let rows = sqlx::query!(
            r#"
            select token, user_id, created_at
              from verify_email
             where id = $1
        "#,
            id
        )
        .fetch_all(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        if rows.len() == 0 {
            Err(ApiError::TokenNotFound)
        } else {
            let row = rows.get(0).unwrap();
            Ok(VerifyEmail {
                token: row.token.clone(),
                user_id: row.user_id,
                created_at: row.created_at,
            })
        }
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
