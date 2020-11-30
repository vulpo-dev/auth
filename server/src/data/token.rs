use crate::data::user::User;
use crate::db::{get_query, AuthDb};
use crate::response::error::ApiError;

use chrono::{DateTime, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use time::{Duration, OffsetDateTime};
use uuid::Uuid;

#[derive(Deserialize, Serialize)]
pub struct Claims {
    pub user: User,
    pub exp: i64,
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

    pub async fn refresh_token(
        conn: &AuthDb,
        user: Uuid,
        expire: DateTime<Utc>,
        project: Uuid,
    ) -> Result<Uuid, ApiError> {
        let query = get_query("token/create")?;

        let row = conn
            .run(move |c| c.query_one(query, &[&user, &expire, &project]))
            .await;

        match row {
            Err(_) => Err(ApiError::TokenGenerate),
            Ok(row) => Ok(row.get("id")),
        }
    }
}
