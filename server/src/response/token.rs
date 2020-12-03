use rocket::http::Status;
use rocket::http::{Cookie, SameSite};
use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use serde_json;
use serde_json::json;
use std::io::Cursor;
use time::{Duration, OffsetDateTime};

pub struct Token {
    pub access_tokens: Vec<String>,
    pub refresh_token: String,
    pub created: bool,
    pub users: Vec<uuid::Uuid>,
}

impl<'r> Responder<'r, 'static> for Token {
    fn respond_to(self, req: &'r Request<'_>) -> response::Result<'static> {
        let expire = OffsetDateTime::now_utc() + Duration::days(90);
        let expires_in = 15 * 60; // 15 minutes

        let tokens = self
            .access_tokens
            .iter()
            .map(|access_token| {
                json!({
                    "access_token": access_token,
                    "type": "Bearer",
                    "expires_in": expires_in,
                    "refresh_token": self.refresh_token,
                    "created": self.created,
                })
            })
            .collect::<Vec<serde_json::Value>>();

        let body = json!({
            "tokens": tokens,
            "users": self.users,
        });

        let body = match serde_json::to_string(&body) {
            Ok(body) => body,
            Err(_) => return Response::build().status(Status::InternalServerError).ok(),
        };

        let cookies = req.cookies();

        let refresh_token = Cookie::build("refresh_token", self.refresh_token)
            .http_only(true)
            .same_site(SameSite::Strict)
            .expires(expire)
            .finish();

        cookies.add(refresh_token);

        Response::build()
            .status(Status::Ok)
            .sized_body(body.len(), Cursor::new(body))
            .ok()
    }
}
