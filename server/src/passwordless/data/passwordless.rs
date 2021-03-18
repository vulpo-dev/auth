use crate::response::error::ApiError;

use bcrypt;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug)]
pub struct Passwordless {
    pub id: Uuid,
    pub created_at: DateTime<Utc>,
    pub user_id: Option<Uuid>,
    pub email: String,
    pub token: String,
    pub is_valid: bool,
    pub project_id: Uuid,
    pub confirmed: bool,
}

impl Passwordless {
    pub async fn create_token(
        pool: &PgPool,
        id: Option<Uuid>,
        email: &str,
        verification_token: &str,
        project: &Uuid,
        session_id: &Uuid,
    ) -> Result<Uuid, ApiError> {
        sqlx::query!(
            r#"
            insert into passwordless (user_id, email, token, project_id, session_id)
            values ($1, $2, $3, $4, $5)
            returning id
        "#,
            id,
            email,
            verification_token,
            project,
            session_id
        )
        .fetch_one(pool)
        .await
        .map(|row| row.id)
        .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn get(pool: &PgPool, id: &Uuid) -> Result<Passwordless, ApiError> {
        let row = sqlx::query_as!(
            Passwordless,
            r#"
            select id
                 , created_at
                 , user_id
                 , email
                 , token
                 , is_valid
                 , project_id
                 , confirmed
              from passwordless
             where id = $1
        "#,
            id
        )
        .fetch_optional(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        row.ok_or_else(|| ApiError::NotFound)
    }

    pub async fn confirm(pool: &PgPool, id: &Uuid) -> Result<(), ApiError> {
        sqlx::query!(
            r#"
            with confirm_token as (
                update passwordless
                   set confirmed = True
                 where id = $1
             returning email, project_id, id
            )
            update passwordless
               set is_valid = False
              from confirm_token
             where passwordless.email = confirm_token.email
               and passwordless.project_id = confirm_token.project_id
               and passwordless.id != confirm_token.id
        "#,
            id
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn remove_all(pool: &PgPool, email: &str, project: &Uuid) -> Result<(), ApiError> {
        sqlx::query!(
            r#"
            delete from passwordless
             where email = $1
               and project_id = $2
        "#,
            email,
            project
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub fn compare(&self, token: &str) -> bool {
        bcrypt::verify(token, &self.token).unwrap_or(false)
    }
}
