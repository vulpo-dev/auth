use crate::db::Db;
use crate::keys::data::ProjectKeys;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::user::data::User;

use chrono::{DateTime, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use rocket::http::Status;
use rocket::request::Outcome;
use rocket::request::{FromRequest, Request};

use uuid::Uuid;
pub use vulpo::Claims;

pub struct AccessToken(Claims);

impl AccessToken {
    pub fn sub(&self) -> Uuid {
        self.0.sub
    }
}

impl AccessToken {
    pub fn new(user: &User, exp: DateTime<Utc>, project: &Uuid) -> AccessToken {
        let claims = Claims {
            sub: user.id.clone(),
            exp: exp.timestamp(),
            traits: user.traits.clone(),
            iss: project.clone(),
        };

        AccessToken(claims)
    }

    pub fn to_jwt_rsa(&self, key: &String) -> Result<String, ApiError> {
        let key = key.as_bytes();
        let encoding_key = match EncodingKey::from_rsa_pem(key) {
            Ok(key) => key,
            Err(_) => {
                return Err(ApiError::InternalServerError);
            }
        };

        let header = Header::new(Algorithm::RS256);
        encode(&header, &self.0, &encoding_key).map_err(|_| ApiError::InternalServerError)
    }

    pub fn from_rsa(token: String, key: &[u8]) -> Result<Claims, ApiError> {
        let decoding_key =
            DecodingKey::from_rsa_pem(key).map_err(|_| ApiError::InternalServerError)?;

        match decode::<Claims>(&token, &decoding_key, &Validation::new(Algorithm::RS256)) {
            Ok(token_data) => Ok(token_data.claims),
            Err(_) => Err(ApiError::InternalServerError),
        }
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AccessToken {
    type Error = ApiError;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let token_string = match req.headers().get_one("Authorization") {
            None => return Outcome::Failure((Status::BadRequest, ApiError::AuthTokenMissing)),
            Some(token) => token,
        };

        let project = match Project::from_request(req).await.succeeded() {
            None => return Outcome::Failure((Status::BadRequest, ApiError::AuthTokenMissing)),
            Some(project) => project,
        };

        let db = match Db::from_request(req).await.succeeded() {
            None => {
                return Outcome::Failure((Status::ServiceUnavailable, ApiError::AuthTokenMissing))
            }
            Some(pool) => pool,
        };

        let key = match ProjectKeys::get_public_key(db.inner(), &project.id).await {
            Ok(key) => key,
            Err(_) => {
                return Outcome::Failure((Status::InternalServerError, ApiError::AuthTokenMissing));
            }
        };

        let end = token_string.len();
        let start = "Bearer ".len();
        let token = &token_string[start..end];
        let claims = match AccessToken::from_rsa(token.to_string(), &key) {
            Ok(token) => token,
            Err(_) => {
                return Outcome::Failure((Status::Unauthorized, ApiError::BadRequest));
            }
        };
        Outcome::Success(AccessToken(claims))
    }
}
