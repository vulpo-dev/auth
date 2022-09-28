use chrono::{DateTime, Duration, Utc};
use jsonwebtoken as jwt;
use jsonwebtoken::EncodingKey;
use rocket::http::{ContentType, Status};
use rocket::request::Request;
use rocket::response::{self, Responder, Response};
use serde::{Deserialize, Serialize};
use serde_json;
use std::io::Cursor;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshAccessToken {
    pub value: String,
}

impl RefreshAccessToken {
    pub fn new(key: &[u8]) -> Option<RefreshAccessToken> {
        let exp = Utc::now() + Duration::seconds(30);

        let claims = RefreshAccessTokenClaims {
            jti: Uuid::new_v4(),
            exp: exp.timestamp(),
        };

        let claims = Self::to_jwt(&claims, key)?;
        let token = RefreshAccessToken { value: claims };
        Some(token)
    }

    fn to_jwt(claims: &RefreshAccessTokenClaims, key: &[u8]) -> Option<String> {
        let encoding_key = EncodingKey::from_ec_pem(key).ok()?;
        let header = jwt::Header::new(jwt::Algorithm::ES384);
        jwt::encode(&header, claims, &encoding_key).ok()
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshAccessTokenClaims {
    pub exp: i64,
    pub jti: Uuid,
}

#[derive(Serialize, Deserialize, Debug)]
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
            .header(ContentType::JSON)
            .sized_body(body.len(), Cursor::new(body))
            .ok()
    }
}
