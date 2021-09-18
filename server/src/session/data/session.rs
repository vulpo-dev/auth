use crate::response::error::ApiError;
use crate::session::data::SessionClaims;

use chrono::{DateTime, Utc, TimeZone};
use jsonwebtoken as jwt;
use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

pub struct Session {
    pub id: Uuid,
    pub project_id: Option<Uuid>,
    pub public_key: Vec<u8>,
    pub expire_at: DateTime<Utc>,
    pub user_id: Option<Uuid>,
}

impl Session {
    pub async fn create(pool: &PgPool, session: Session) -> Result<Session, ApiError> {
        sqlx::query_file_as!(
            Session,
            "src/session/sql/create_session.sql",
            session.id,
            session.public_key,
            session.expire_at,
            session.user_id,
            session.project_id,
        )
        .fetch_one(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn get(pool: &PgPool, session: &Uuid) -> Result<Session, ApiError> {
        let row = sqlx::query_file_as!(Session, "src/session/sql/get_session.sql", session)
            .fetch_optional(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        row.ok_or_else(|| ApiError::TokenInvalid)
    }

    pub async fn confirm(
        pool: &PgPool,
        session: &Uuid,
        user_id: &Uuid,
        expire_at: &DateTime<Utc>,
    ) -> Result<Session, ApiError> {
        sqlx::query_file_as!(
            Session,
            "src/session/sql/confirm_session.sql",
            &session,
            &user_id,
            &expire_at
        )
        .fetch_one(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn extend(
        pool: &PgPool,
        session: &Uuid,
        expire_at: &DateTime<Utc>,
    ) -> Result<(), ApiError> {
        sqlx::query_file!("src/session/sql/extend_session.sql", session, expire_at)
            .execute(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn delete(pool: &PgPool, session: &Uuid) -> Result<(), ApiError> {
        sqlx::query_file!("src/session/sql/remove_session.sql", session)
            .execute(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn delete_all(pool: &PgPool, session: &Uuid) -> Result<(), ApiError> {
        sqlx::query_file!("src/session/sql/remove_all_sessions.sql", session)
            .execute(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn delete_by_user(pool: &PgPool, user: &Uuid) -> Result<(), ApiError> {
        sqlx::query_file!("src/session/sql/remove_user_sessions.sql", user)
            .execute(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn is_valid(
        pool: &PgPool,
        claims: &SessionClaims,
        session: &Uuid,
    ) -> Result<bool, ApiError> {
        let exp = Utc.timestamp(claims.exp.into(), 0);
        let row = sqlx::query_file!(
            "src/session/sql/token_is_valid.sql",
            claims.jti,
            session,
            exp
        )
        .fetch_one(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        match row.is_valid {
            None => Ok(false),
            Some(value) => Ok(value),
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
            Err(_) => return Err(ApiError::Forbidden),
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
