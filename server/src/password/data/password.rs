use crate::response::error::ApiError;

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use bcrypt::{self, DEFAULT_COST};
use pbkdf2::Pbkdf2;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(sqlx::Type, PartialEq, Debug)]
#[sqlx(type_name = "password_alg")]
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
    pub alg: PasswordAlg,
}

impl Password {
    pub async fn get_by_email(
        pool: &PgPool,
        email: &str,
        project: &Uuid,
    ) -> sqlx::Result<Password> {
        sqlx::query_file_as!(
            Password,
            "src/password/sql/get_by_email.sql",
            email,
            project
        )
        .fetch_one(pool)
        .await
    }

    pub async fn set_password(
        pool: &PgPool,
        user_id: &Uuid,
        password: &str,
        alg: &PasswordAlg,
        project_id: &Uuid,
    ) -> Result<(), ApiError> {
        let password = Password::hash(password, alg).map_err(|_| ApiError::InternalServerError)?;

        sqlx::query_file!(
            "src/password/sql/set_password.sql",
            user_id,
            password,
            alg as &PasswordAlg,
            project_id,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn create_password(
        pool: &PgPool,
        user_id: &Uuid,
        password: &str,
        alg: &PasswordAlg,
        project_id: &Uuid,
    ) -> Result<(), ApiError> {
        let password = Password::hash(password, alg).map_err(|_| ApiError::InternalServerError)?;

        sqlx::query_file!(
            "src/password/sql/create_password.sql",
            user_id,
            password,
            alg as &PasswordAlg,
            project_id,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }
}

impl Password {
    pub fn verify(&self, password: &str) -> bool {
        match self.alg {
            PasswordAlg::Bcrypt => bcrypt::verify(password, &self.hash).unwrap_or(false),
            PasswordAlg::Argon2id => {
                let parsed_hash = match PasswordHash::new(&self.hash) {
                    Ok(hash) => hash,
                    Err(_) => return false,
                };

                Argon2::default()
                    .verify_password(password.as_bytes(), &parsed_hash)
                    .is_ok()
            }
            PasswordAlg::PBKDF2 => {
                let parsed_hash = match PasswordHash::new(&self.hash) {
                    Ok(hash) => hash,
                    Err(_) => return false,
                };

                Pbkdf2
                    .verify_password(password.as_bytes(), &parsed_hash)
                    .is_ok()
            }
            _ => false,
        }
    }

    pub fn hash(password: &str, alg: &PasswordAlg) -> Result<String, ()> {
        match alg {
            PasswordAlg::Bcrypt => bcrypt::hash(password, DEFAULT_COST).map_err(|_| ()),
            PasswordAlg::Argon2id => {
                let salt = SaltString::generate(&mut OsRng);
                Argon2::default()
                    .hash_password(password.as_bytes(), &salt)
                    .map(|hash| hash.to_string())
                    .map_err(|_| ())
            }

            PasswordAlg::PBKDF2 => {
                let salt = SaltString::generate(&mut OsRng);
                Pbkdf2
                    .hash_password(password.as_bytes(), &salt)
                    .map(|hash| hash.to_string())
                    .map_err(|_| ())
            }
            _ => Err(()),
        }
    }
}
