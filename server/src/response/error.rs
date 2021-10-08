use rocket::http::Status;
use rocket::http::{ContentType, Cookie};
use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use serde::Serialize;
use serde_json;
use std::io::Cursor;

#[derive(Debug, Serialize)]
pub struct Message {
    pub code: ApiError,
}

#[derive(Debug, Serialize, PartialEq, Copy, Clone)]
pub enum ApiError {
    #[serde(rename = "internal_error")]
    InternalServerError,

    #[serde(rename = "bad_request")]
    BadRequest,

    #[serde(rename = "not_found")]
    NotFound,

    #[serde(rename = "forbidden")]
    Forbidden,

    #[serde(rename = "project/name_exists")]
    ProjectNameExists,

    #[serde(rename = "project/not_found")]
    ProjectNotFound,

    #[serde(rename = "user/exists")]
    UserExists,

    #[serde(rename = "user/invalid_project")]
    UserInvalidProject,

    #[serde(rename = "admin/has_admin")]
    AdminHasAdmin,

    #[serde(rename = "admin/admin_project_exists")]
    AdminProjectExists,

    #[serde(rename = "admin/auth")]
    AdminAuth,

    #[serde(rename = "admin/exits")]
    AdminExists,

    #[serde(rename = "auth/token_missing")]
    AuthTokenMissing,

    #[serde(rename = "password/min_length")]
    PasswordMinLength,

    #[serde(rename = "password/max_length")]
    PasswordMaxLength,

    #[serde(rename = "auth/refresh_token_missing")]
    AuthRefreshTokenMissing,

    #[serde(rename = "auth/refresh_token_not_found")]
    AuthRefreshTokenNotFound,

    #[serde(rename = "auth/refresh_token_invalid_format")]
    AuthRefreshTokenInvalidFormat,

    #[serde(rename = "auth/invalid_email_password")]
    UserNotFound,

    #[serde(rename = "auth/invalid_email_password")]
    UserInvalidPassword,

    #[serde(rename = "user/duplicate")]
    UserDuplicate,

    #[serde(rename = "user/disabled")]
    UserDisabled,

    #[serde(rename = "token/not_found")]
    TokenNotFound,

    #[serde(rename = "token/invalid")]
    TokenInvalid,

    #[serde(rename = "token/expired")]
    TokenExpired,

    #[serde(rename = "reset/invalid_token")]
    ResetInvalidToken,

    #[serde(rename = "reset/token_not_found")]
    ResetTokenNotFound,

    #[serde(rename = "reset/expired")]
    ResetExpired,

    #[serde(rename = "reset/password_mismatch")]
    ResetPasswordMismatch,

    #[serde(rename = "passwordless/invalid_token")]
    PasswordlessInvalidToken,

    #[serde(rename = "passwordless/token_expire")]
    PasswordlessTokenExpire,

    #[serde(rename = "passwordless/await_confirm")]
    PasswordlessAwaitConfirm,

    #[serde(rename = "template/render")]
    TemplateRender,

    #[serde(rename = "session/expired")]
    SessionExpired,
}

impl ApiError {
    fn get_status(&self) -> Status {
        match self {
            ApiError::InternalServerError | ApiError::TemplateRender => Status::InternalServerError,
            ApiError::NotFound => Status::NotFound,
            ApiError::Forbidden => Status::Forbidden,
            ApiError::TokenInvalid => Status::Forbidden,
            ApiError::ProjectNameExists | ApiError::UserExists => Status::Conflict,
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
        let body = Message { code: self };
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
