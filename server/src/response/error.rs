use rocket::http::Status;
use rocket::http::{ContentType, Cookie};
use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use serde::Serialize;
use serde_json;
use sqlx::postgres::PgDatabaseError;
use std::io::Cursor;
use thiserror::Error;

#[derive(Debug, Serialize)]
pub struct Message {
    pub code: String,
}

#[derive(Error, Debug, PartialEq, Copy, Clone)]
pub enum ApiError {
    #[error("internal_error")]
    InternalServerError,

    #[error("bad_request")]
    BadRequest,

    #[error("not_found")]
    NotFound,

    #[error("forbidden")]
    Forbidden,

    #[error("project/name_exists")]
    ProjectNameExists,

    #[error("project/not_found")]
    ProjectNotFound,

    #[error("user/exists")]
    UserExists,

    #[error("user/invalid_project")]
    UserInvalidProject,

    #[error("admin/has_admin")]
    AdminHasAdmin,

    #[error("admin/admin_project_exists")]
    AdminProjectExists,

    #[error("admin/auth")]
    AdminAuth,

    #[error("auth/token_missing")]
    AuthTokenMissing,

    #[error("password/min_length")]
    PasswordMinLength,

    #[error("password/max_length")]
    PasswordMaxLength,

    #[error("auth/refresh_token_missing")]
    AuthRefreshTokenMissing,

    #[error("auth/refresh_token_not_found")]
    AuthRefreshTokenNotFound,

    #[error("auth/refresh_token_invalid_format")]
    AuthRefreshTokenInvalidFormat,

    #[error("auth/invalid_email_password")]
    UserNotFound,

    #[error("auth/invalid_email_password")]
    UserInvalidPassword,

    #[error("user/duplicate")]
    UserDuplicate,

    #[error("user/disabled")]
    UserDisabled,

    #[error("token/not_found")]
    TokenNotFound,

    #[error("token/invalid")]
    TokenInvalid,

    #[error("token/expired")]
    TokenExpired,

    #[error("reset/invalid_token")]
    ResetInvalidToken,

    #[error("reset/token_not_found")]
    ResetTokenNotFound,

    #[error("reset/expired")]
    ResetExpired,

    #[error("reset/password_mismatch")]
    ResetPasswordMismatch,

    #[error("passwordless/invalid_token")]
    PasswordlessInvalidToken,

    #[error("passwordless/token_expire")]
    PasswordlessTokenExpire,

    #[error("passwordless/await_confirm")]
    PasswordlessAwaitConfirm,

    #[error("template/render")]
    TemplateRender,

    #[error("session/expired")]
    SessionExpired,
}

impl From<sqlx::Error> for ApiError {
    fn from(error: sqlx::Error) -> Self {
        match error {
            sqlx::Error::Database(err) => {
                let err = err.downcast::<PgDatabaseError>();
                match err.constraint() {
                    Some("project_settings_name_key") => ApiError::ProjectNameExists,
                    Some("users_project_id_email_key") => ApiError::UserExists,
                    Some("users_project_id_fkey") => ApiError::UserInvalidProject,
                    _ => ApiError::InternalServerError,
                }
            }
            _ => ApiError::InternalServerError,
        }
    }
}

impl From<lettre::error::Error> for ApiError {
    fn from(_error: lettre::error::Error) -> Self {
        ApiError::InternalServerError
    }
}

impl ApiError {
    fn get_status(&self) -> Status {
        match self {
            ApiError::InternalServerError | ApiError::TemplateRender => Status::InternalServerError,
            ApiError::NotFound => Status::NotFound,
            ApiError::Forbidden => Status::Forbidden,
            ApiError::TokenInvalid => Status::Forbidden,
            ApiError::ProjectNameExists | ApiError::UserExists => Status::BadRequest,
            ApiError::ProjectNotFound => Status::NotFound,
            ApiError::PasswordlessAwaitConfirm
            | ApiError::TokenExpired
            | ApiError::TokenNotFound
            | ApiError::AuthTokenMissing
            | ApiError::AuthRefreshTokenMissing
            | ApiError::AuthRefreshTokenNotFound => Status::Unauthorized,
            _ => Status::BadRequest,
        }
    }
}

impl<'r> Responder<'r, 'static> for ApiError {
    fn respond_to(self, req: &'r Request<'_>) -> response::Result<'static> {
        let status = self.get_status();
        let body = Message {
            code: format!("{}", self),
        };
        let body = match serde_json::to_string(&body) {
            Ok(json) => json,
            Err(_) => return Response::build().status(Status::InternalServerError).ok(),
        };

        let cookies = req.cookies();
        if self == ApiError::AuthRefreshTokenMissing
            || self == ApiError::AuthRefreshTokenInvalidFormat
            || self == ApiError::AuthRefreshTokenNotFound
        {
            cookies.remove(Cookie::named("refresh_token"))
        };

        Response::build()
            .status(status)
            .sized_body(body.len(), Cursor::new(body))
            .header(ContentType::new("text", "json"))
            .ok()
    }
}
