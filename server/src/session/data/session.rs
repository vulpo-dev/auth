use crate::response::error::ApiError;

use chrono::{DateTime, Utc};
use jsonwebtoken as jwt;
use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

pub struct Session {
    pub id: Uuid,
    pub public_key: Vec<u8>,
    pub expire_at: DateTime<Utc>,
    pub user_id: Option<Uuid>,
}

impl Session {
    pub async fn create(pool: &PgPool, session: Session) -> Result<Session, ApiError> {
        sqlx::query_as!(
            Session,
            r#"
            insert into sessions(id, public_key, expire_at, user_id)
            values($1, $2, $3, $4)
            on conflict(id)
               do update
                     set id = uuid_generate_v4()
            returning id, public_key, expire_at, user_id
        "#,
            session.id,
            session.public_key,
            session.expire_at,
            session.user_id,
        )
        .fetch_one(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn get(pool: &PgPool, session: &Uuid) -> Result<Session, ApiError> {
        let row = sqlx::query_as!(
            Session,
            r#"
            select id
                 , public_key
                 , expire_at
                 , user_id
              from sessions
             where id = $1 
        "#,
            session
        )
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
        sqlx::query_as!(
            Session,
            r#"
                update sessions
                   set user_id = $2
                     , expire_at = $3
                 where id = $1
                returning id, expire_at, user_id, public_key
            "#,
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
        sqlx::query!(
            r#"
                update sessions
                   set expire_at = $2
                 where id = $1
            "#,
            session,
            expire_at
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn delete(pool: &PgPool, session: &Uuid) -> Result<(), ApiError> {
        sqlx::query!(
            r#"
                delete from sessions
                 where id = $1
            "#,
            session,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn delete_all(pool: &PgPool, session: &Uuid) -> Result<(), ApiError> {
        sqlx::query!(
            r#"
               delete from sessions
                where user_id in (
                    select user_sessions.user_id
                      from sessions
                      join sessions user_sessions on user_sessions.user_id = sessions.id
                     where sessions.id = $1 
                )
            "#,
            session,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn delete_by_user(pool: &PgPool, user: &Uuid) -> Result<(), ApiError> {
        sqlx::query!(
            r#"
               delete from sessions
                where user_id = $1 
            "#,
            user,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
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
