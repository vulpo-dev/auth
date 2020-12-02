use rocket::http::Status;
use rocket::http::{Cookie, SameSite};
use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use serde_json::json;
use std::io::Cursor;
use time::{Duration, OffsetDateTime};

pub struct Token {
    pub access_token: String,
    pub refresh_token: String,
    pub created: bool,
}

impl<'r> Responder<'r, 'static> for Token {
    fn respond_to(self, req: &'r Request<'_>) -> response::Result<'static> {
        let expire = OffsetDateTime::now_utc() + Duration::days(90);
        let expires_in = 15 * 60; // 15 minutes

        let body = json!({
            "access_token": self.access_token,
            "type": "Bearer",
            "expires_in": expires_in,
            "refresh_token": self.refresh_token,
            "created": self.created,
        });

        let body = body.to_string();

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
