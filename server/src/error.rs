use rocket::http::ContentType;
use rocket::http::Status;
use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use serde::Serialize;
use serde_json;
use std::io::Cursor;

#[derive(Debug, Serialize)]
pub enum ErrorCode {
    #[serde(rename = "test")]
    Test,

    #[serde(rename = "internal_error")]
    InternalServerError,

    #[serde(rename = "not_found")]
    NotFound,
}

#[derive(Debug, Serialize)]
pub struct Message<'a> {
    pub code: ErrorCode,
    pub message: &'a Option<String>,
}

#[derive(Debug)]
pub enum ApiError {
    Test(Option<String>),
    InternalServerError,
    NotFound,
}

impl ApiError {
    fn get_status(&self) -> Status {
        match self {
            ApiError::Test(_) => Status::InternalServerError,
            ApiError::InternalServerError => Status::InternalServerError,
            ApiError::NotFound => Status::NotFound,
        }
    }

    fn get_body(&self) -> Message {
        match self {
            ApiError::Test(message) => Message {
                code: ErrorCode::Test,
                message,
            },

            ApiError::InternalServerError => Message {
                code: ErrorCode::InternalServerError,
                message: &None,
            },

            ApiError::NotFound => Message {
                code: ErrorCode::NotFound,
                message: &None,
            },
        }
    }
}

impl<'r> Responder<'r, 'static> for ApiError {
    fn respond_to(self, _: &'r Request<'_>) -> response::Result<'static> {
        let status = self.get_status();
        let body = self.get_body();
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
