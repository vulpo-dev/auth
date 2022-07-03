use crate::response::error::ApiError;

use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(sqlx::Type, PartialEq)]
#[sqlx(type_name = "email_change_state")]
#[sqlx(rename_all = "lowercase")]
pub enum EmailChangeState {
    Request,
    Reject,
    Accept,
    Reset,
}

pub struct NewChangeRequest {
    pub old_email: String,
    pub new_email: String,
    pub user_id: Uuid,
    pub token: String,
    pub reset_token: String,
}

pub struct ConfirmToken {
    pub token: String,
    pub state: EmailChangeState,
    pub expire_at: DateTime<Utc>,
}

pub struct ResetToken {
    pub token: String,
    pub state: EmailChangeState,
}

pub struct EmailChangeRequest;

impl EmailChangeRequest {
    pub async fn create(
        pool: &PgPool,
        request: &NewChangeRequest,
        project_id: &Uuid,
    ) -> Result<Uuid, ApiError> {
        sqlx::query_file!(
            "src/user/sql/email/insert_change_request.sql",
            request.old_email,
            request.new_email,
            request.user_id,
            request.token,
            request.reset_token,
            project_id,
        )
        .fetch_one(pool)
        .await
        .map(|row| row.id)
        .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn get_confirm_token(
        pool: &PgPool,
        token_id: &Uuid,
    ) -> Result<ConfirmToken, ApiError> {
        sqlx::query_file_as!(
            ConfirmToken,
            "src/user/sql/email/get_confirm_token.sql",
            token_id
        )
        .fetch_one(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn get_reset_token(pool: &PgPool, token_id: &Uuid) -> Result<ResetToken, ApiError> {
        sqlx::query_file_as!(
            ResetToken,
            "src/user/sql/email/get_reset_token.sql",
            token_id
        )
        .fetch_one(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn set_email(pool: &PgPool, token_id: &Uuid) -> Result<(), ApiError> {
        sqlx::query_file!("src/user/sql/email/set_email.sql", token_id)
            .execute(pool)
            .await
            .map(|_| ())
            .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn reset_email(pool: &PgPool, token_id: &Uuid) -> Result<(), ApiError> {
        sqlx::query_file!("src/user/sql/email/reset_email.sql", token_id)
            .execute(pool)
            .await
            .map(|_| ())
            .map_err(|_| ApiError::InternalServerError)
    }
}
