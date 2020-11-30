use crate::data::user::User;
use crate::db::get_query;
use crate::response::error::ApiError;

use crate::db::GenericClient;
use chrono::{DateTime, Duration as CDuration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use time::{Duration, OffsetDateTime};
use uuid::Uuid;

#[derive(Deserialize, Serialize)]
pub struct Claims {
    pub user: User,
    pub exp: i64,
}

#[derive(Debug, Clone)]
pub struct RefreshToken {
    pub user: Uuid,
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
            user: token.get("user_id"),
            expire: token.get("expire"),
            project: token.get("project_id"),
            id: token.get("id"),
        })
    }

    pub fn create<C: GenericClient>(
        client: &mut C,
        user: Uuid,
        expire: DateTime<Utc>,
        project: Uuid,
    ) -> Result<Uuid, ApiError> {
        let query = get_query("token/create")?;

        let row = client.query_one(query, &[&user, &expire, &project]);
        match row {
            Err(_) => Err(ApiError::TokenGenerate),
            Ok(row) => Ok(row.get("id")),
        }
    }

    pub fn expire() -> DateTime<Utc> {
        Utc::now() + CDuration::days(90)
    }

    pub fn set_expire<C: GenericClient>(client: &mut C, id: Uuid) -> Result<(), ApiError> {
        let query = get_query("token/expire")?;
        match client.query_one(query, &[&id]) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(_) => Ok(()),
        }
    }
}

pub struct Token;

impl Token {
    pub fn access_token(user: &User) -> Result<String, ApiError> {
        let exp = OffsetDateTime::now_utc() + Duration::minutes(15);
        let claims = Claims {
            user: user.clone(),
            exp: exp.unix_timestamp(),
        };

        match encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret("secret".as_ref()),
        ) {
            Ok(token) => Ok(token),
            Err(_) => Err(ApiError::InternalServerError),
        }
    }
}
