use crate::db::get_query;
use crate::response::error::ApiError;

use chrono::{DateTime, Utc};
use jsonwebtoken as jwt;
use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use rocket_contrib::databases::postgres::GenericClient;
use serde::Deserialize;
use uuid::Uuid;

pub struct Session {
    pub id: Uuid,
    pub public_key: Vec<u8>,
    pub expire_at: DateTime<Utc>,
    pub user_id: Option<Uuid>,
}

impl Session {
    pub fn create<C: GenericClient>(client: &mut C, session: Session) -> Result<Session, ApiError> {
        let query = get_query("session/create")?;
        match client.query_one(
            query,
            &[
                &session.id,
                &session.public_key,
                &session.expire_at,
                &session.user_id,
            ],
        ) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(row) => Ok(Session {
                id: row.get("id"),
                public_key: row.get("public_key"),
                expire_at: row.get("expire_at"),
                user_id: row.get("user_id"),
            }),
        }
    }

    pub fn get<C: GenericClient>(client: &mut C, session: &Uuid) -> Result<Session, ApiError> {
        let query = get_query("session/get")?;
        let rows = match client.query(query, &[&session]) {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(rows) => rows,
        };

        match rows.get(0) {
            None => return Err(ApiError::TokenInvalid),
            Some(row) => Ok(Session {
                id: row.get("id"),
                public_key: row.get("public_key"),
                expire_at: row.get("expire_at"),
                user_id: row.get("user_id"),
            }),
        }
    }

    pub fn confirm<C: GenericClient>(
        client: &mut C,
        session: &Uuid,
        user_id: &Uuid,
        expire_at: &DateTime<Utc>,
    ) -> Result<Session, ApiError> {
        let query = get_query("session/confirm")?;
        match client.query_one(query, &[&session, &user_id, &expire_at]) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(row) => Ok(Session {
                id: row.get("id"),
                public_key: row.get("public_key"),
                expire_at: row.get("expire_at"),
                user_id: row.get("user_id"),
            }),
        }
    }

    pub fn extend<C: GenericClient>(
        client: &mut C,
        session: &Uuid,
        expire_at: &DateTime<Utc>,
    ) -> Result<(), ApiError> {
        let query = get_query("session/extend")?;
        match client.query(query, &[&session, &expire_at]) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(_) => Ok(()),
        }
    }

    pub fn delete<C: GenericClient>(client: &mut C, session: &Uuid) -> Result<(), ApiError> {
        let query = get_query("session/delete")?;
        match client.query(query, &[&session]) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(_) => Ok(()),
        }
    }

    pub fn delete_all<C: GenericClient>(client: &mut C, session: &Uuid) -> Result<(), ApiError> {
        let query = get_query("session/delete_all")?;
        match client.query(query, &[&session]) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(_) => Ok(()),
        }
    }

    pub fn delete_by_user<C: GenericClient>(client: &mut C, user: &Uuid) -> Result<(), ApiError> {
        let query = get_query("session/delete_by_user")?;
        match client.query(query, &[&user]) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(_) => Ok(()),
        }
    }
}

#[derive(Deserialize)]
pub struct RefreshAccessToken {
    pub value: String,
}

#[derive(Deserialize)]
pub struct Claims {
    pub exp: i32,
    pub jti: Uuid,
}

impl Session {
    pub fn validate_token(session: &Session, rat: &RefreshAccessToken) -> Result<Claims, ApiError> {
        let header = match jwt::decode_header(&rat.value) {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(h) => h,
        };

        let public_key = match header.alg {
            Algorithm::ES384 => DecodingKey::from_ec_pem(&session.public_key),
            Algorithm::RS256 => DecodingKey::from_rsa_pem(&session.public_key),
            _ => return Err(ApiError::BadRequest),
        };

        let claims = match jwt::decode::<Claims>(
            &rat.value,
            &public_key.unwrap(),
            &Validation::new(header.alg),
        ) {
            Err(_err) => return Err(ApiError::Forbidden),
            Ok(body) => body,
        };

        let expire = claims.claims.exp as i64;
        let now = Utc::now().timestamp();
        let delta = expire - now;

        if delta < 0 {
            Err(ApiError::Forbidden)
        } else {
            Ok(claims.claims)
        }
    }
}
