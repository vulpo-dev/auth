use rocket::http::ContentType;
use rocket::http::Status;
use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use serde::Serialize;
use serde_json;
use std::io::Cursor;

#[derive(Debug, Serialize)]
pub struct Message {
    pub code: ApiError,
}

#[derive(Debug, Serialize)]
pub enum ApiError {
    #[serde(rename = "internal_error")]
    InternalServerError,

    #[serde(rename = "bad_request")]
    BadRequest,

    #[serde(rename = "not_found")]
    NotFound,

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
}

impl ApiError {
    fn get_status(&self) -> Status {
        match self {
            ApiError::InternalServerError => Status::InternalServerError,
            ApiError::NotFound => Status::NotFound,
            _ => Status::BadRequest,
        }
    }
}

impl<'r> Responder<'r, 'static> for ApiError {
    fn respond_to(self, _: &'r Request<'_>) -> response::Result<'static> {
        let status = self.get_status();
        let body = Message { code: self };
        let body = match serde_json::to_string(&body) {
            Ok(json) => json,
            Err(_) => return Response::build().status(Status::InternalServerError).ok(),
        };

        Response::build()
            .status(status)
            .sized_body(body.len(), Cursor::new(body))
            .header(ContentType::new("text", "json"))
            .ok()
    }
}
