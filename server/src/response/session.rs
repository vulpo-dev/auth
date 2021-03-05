use chrono::{DateTime, Utc};
use rocket::http::Status;

use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use serde::Serialize;
use serde_json;

use std::io::Cursor;

use uuid::Uuid;

#[derive(Serialize)]
pub struct SessionResponse {
    pub access_token: String,
    pub created: bool,
    pub user_id: Uuid,
    pub expire_at: DateTime<Utc>,
    pub session: Uuid,
}

impl<'r> Responder<'r, 'static> for SessionResponse {
    fn respond_to(self, _req: &'r Request<'_>) -> response::Result<'static> {
        let body = match serde_json::to_string(&self) {
            Ok(body) => body,
            Err(_) => return Response::build().status(Status::InternalServerError).ok(),
        };

        Response::build()
            .status(Status::Ok)
            .sized_body(body.len(), Cursor::new(body))
            .ok()
    }
}
