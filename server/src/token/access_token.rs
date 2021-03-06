use crate::data::user::User;
use crate::response::error::ApiError;

use chrono::{DateTime, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct Claims {
    pub user: User,
    pub exp: i64,
}

pub struct AccessToken(Claims);

impl AccessToken {
    pub fn new(user: &User, exp: DateTime<Utc>) -> AccessToken {
        let claims = Claims {
            user: user.clone(),
            exp: exp.timestamp(),
        };

        AccessToken(claims)
    }

    pub fn to_jwt_rsa(&self, key: &String) -> Result<String, ApiError> {
        let key = key.as_bytes();
        let encodeing_key = match EncodingKey::from_rsa_pem(key) {
            Ok(key) => key,
            Err(_) => {
                return Err(ApiError::InternalServerError);
            }
        };

        let header = Header::new(Algorithm::RS256);
        match encode(&header, &self.0, &encodeing_key) {
            Ok(token) => Ok(token),
            Err(_) => Err(ApiError::InternalServerError),
        }
    }

    pub fn from_rsa(token: String, key: &String) -> Result<Claims, ApiError> {
        let decodeing_key = match DecodingKey::from_rsa_pem(key.as_bytes()) {
            Ok(key) => key,
            Err(_) => {
                return Err(ApiError::InternalServerError);
            }
        };

        match decode::<Claims>(&token, &decodeing_key, &Validation::new(Algorithm::RS256)) {
            Ok(token_data) => Ok(token_data.claims),
            Err(_) => {
                return Err(ApiError::InternalServerError);
            }
        }
    }
}
