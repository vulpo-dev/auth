use crate::data::user::User;
use crate::data::{get_query, GenericClient};
use crate::response::error::ApiError;

use bcrypt::{hash, DEFAULT_COST};
use chrono::{DateTime, Duration as CDuration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use serde_json;
use serde_json::Error;
use time::{Duration, OffsetDateTime};
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize)]
pub struct Claims {
    pub user: User,
    pub exp: i64,
}

#[derive(Deserialize, Serialize)]
pub struct UserId {
    pub user_id: Uuid,
}

impl UserId {
    pub fn to_rows(ids: Vec<Uuid>) -> Result<serde_json::Value, Error> {
        let rows: Vec<UserId> = ids
            .iter()
            .map(|user_id| UserId { user_id: *user_id })
            .collect();

        serde_json::to_value(&rows)
    }
}

#[derive(Debug, Clone)]
pub struct RefreshToken {
    pub users: Vec<Uuid>,
    pub expire: DateTime<Utc>,
    pub project: Uuid,
    pub id: Uuid,
}

impl RefreshToken {
    pub fn get<C: GenericClient>(client: &mut C, id: Uuid) -> Result<RefreshToken, ApiError> {
        let query = get_query("token/get")?;

        let token = match client.query_one(query, &[&id]) {
            Err(_) => return Err(ApiError::AuthRefreshTokenNotFound),
            Ok(row) => row,
        };

        Ok(RefreshToken {
            users: token.get("user_ids"),
            expire: token.get("expire"),
            project: token.get("project_id"),
            id: token.get("id"),
        })
    }

    pub fn create<C: GenericClient>(
        client: &mut C,
        users: Vec<Uuid>,
        expire: DateTime<Utc>,
        project: Uuid,
    ) -> Result<Uuid, ApiError> {
        let query = get_query("token/create")?;

        let users = match UserId::to_rows(users) {
            Ok(rows) => rows,
            Err(_) => return Err(ApiError::InternalServerError),
        };

        let row = client.query_one(query, &[&expire, &project, &users]);
        match row {
            Err(_) => Err(ApiError::TokenGenerate),
            Ok(row) => Ok(row.get("token_id")),
        }
    }

    pub fn expire() -> DateTime<Utc> {
        Utc::now() + CDuration::days(90)
    }

    pub fn set_expire<C: GenericClient>(client: &mut C, id: Uuid) -> Result<(), ApiError> {
        let query = get_query("token/expire")?;
        match client.query(query, &[&id]) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(_) => Ok(()),
        }
    }
}

pub struct AccessToken(Claims);

impl AccessToken {
    pub fn new(user: &User) -> AccessToken {
        let exp = OffsetDateTime::now_utc() + Duration::minutes(15);
        let claims = Claims {
            user: user.clone(),
            exp: exp.unix_timestamp(),
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

#[derive(Debug)]
pub struct Passwordless;

impl Passwordless {
    pub fn create_token<C: GenericClient>(
        client: &mut C,
        id: Uuid,
        email: String,
        verification_token: String,
        project: Uuid,
    ) -> Result<Uuid, ApiError> {
        let query = get_query("passwordless/create")?;
        let row = client.query_one(query, &[&id, &email, &verification_token, &project]);

        match row {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(result) => Ok(result.get("id")),
        }
    }

    pub fn get_token() -> String {
        Uuid::new_v4().to_string()
    }

    pub fn hash_token(token: &String) -> Result<String, ApiError> {
        match hash(token.clone(), DEFAULT_COST) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(hashed) => Ok(hashed),
        }
    }
}
