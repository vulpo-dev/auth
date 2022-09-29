use crate::keys::data::ProjectKeys;
use crate::project::Project;

use chrono::{DateTime, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use rocket::http::Status;
use rocket::request::Outcome;
use rocket::request::{FromRequest, Request};
use vulpo_auth_types::error::ApiError;
use werkbank::rocket::Db;

use uuid::Uuid;
pub use vulpo::Claims;

pub struct AccessToken(Claims);

impl AccessToken {
    pub fn sub(&self) -> Uuid {
        self.0.sub
    }
}

impl AccessToken {
    pub fn new(user_id: &Uuid, traits: &Vec<String>, exp: DateTime<Utc>) -> AccessToken {
        let claims = Claims {
            sub: user_id.clone(),
            exp: exp.timestamp(),
            traits: traits.clone(),
        };

        AccessToken(claims)
    }

    pub fn to_jwt(&self, project: &Uuid, key: &[u8]) -> Result<String, ApiError> {
        println!("BBBB:: {:?}", String::from_utf8(key.to_vec()));
        let encoding_key = EncodingKey::from_ec_pem(key).map_err(|err| {
            println!("DEFUG: {:#?}", err);
            ApiError::InternalServerError
        })?;
        let mut header = Header::new(Algorithm::ES384);
        header.kid = Some(project.to_string());
        encode(&header, &self.0, &encoding_key).map_err(|_| ApiError::InternalServerError)
    }

    pub fn decode(token: &str, key: &[u8]) -> Result<Claims, ApiError> {
        let decoding_key =
            DecodingKey::from_ec_pem(key).map_err(|_| ApiError::InternalServerError)?;

        match decode::<Claims>(&token, &decoding_key, &Validation::new(Algorithm::ES384)) {
            Ok(token_data) => Ok(token_data.claims),
            Err(err) => {
                println!("{:?}", err);
                Err(ApiError::InternalServerError)
            }
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

        let key = match ProjectKeys::get_public_key(&db, &project.id).await {
            Ok(key) => key,
            Err(_) => {
                return Outcome::Failure((Status::InternalServerError, ApiError::AuthTokenMissing));
            }
        };

        let end = token_string.len();
        let start = "Bearer ".len();
        let token = &token_string[start..end];
        let claims = match AccessToken::decode(token, &key) {
            Ok(token) => token,
            Err(_) => {
                return Outcome::Failure((Status::Unauthorized, ApiError::BadRequest));
            }
        };
        Outcome::Success(AccessToken(claims))
    }
}
