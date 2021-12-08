use bcrypt::{self, DEFAULT_COST};
use sqlx::PgPool;
use uuid::Uuid;

use crate::response::error::ApiError;

#[derive(sqlx::Type, PartialEq)]
#[sqlx(type_name = "email_change_state")]
#[sqlx(rename_all = "lowercase")]
pub enum PasswordAlg {
    Bcrypt,
    Argon2id,
    Sha1,
    Scrypt,
    PBKDF2,
    MD5,
}

pub struct Password {
    hash: String,
    alg: PasswordAlg,
}

impl Password {
    pub async fn get_by_email(
        pool: &PgPool,
        email: &str,
        project: &Uuid,
    ) -> Result<Password, ApiError> {
        sqlx::query_file_as!(
            Password,
            "src/password/sql/get_by_email.sql",
            email,
            project
        )
        .fetch_one(pool)
        .await
        .map_err(|_| ApiError::UserInvalidPassword)
    }

    pub async fn set_password(
        pool: &PgPool,
        user_id: &Uuid,
        password: &str,
    ) -> Result<(), ApiError> {
        let password = match bcrypt::hash(password, DEFAULT_COST) {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(hashed) => hashed,
        };

        sqlx::query_file!("src/password/sql/set_password.sql", user_id, password)
            .execute(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn create_password(
        pool: &PgPool,
        user_id: &Uuid,
        password: &str,
    ) -> Result<(), ApiError> {
        let password = match bcrypt::hash(password, DEFAULT_COST) {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(hashed) => hashed,
        };

        sqlx::query_file!("src/password/sql/create_password.sql", user_id, password)
            .execute(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }
}

impl Password {
    pub fn verify(self, password: &str) -> bool {
        match self.alg {
            PasswordAlg::Bcrypt => bcrypt::verify(password, &self.hash).unwrap_or(false),
            _ => false,
        }
    }
}
