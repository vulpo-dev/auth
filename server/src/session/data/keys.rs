use crate::response::error::ApiError;

use chrono::{DateTime, Utc};
use openssl::pkey::PKey;
use openssl::rsa::Rsa;
use openssl::symm::Cipher;
use sqlx::PgPool;
use uuid::Uuid;

pub struct ProjectKeys {
    pub id: Uuid,
    pub project_id: Uuid,
    pub public_key: String,
    pub private_key: String,
    pub is_active: bool,
    pub expire_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug)]
pub struct NewProjectKeys {
    pub public_key: String,
    pub private_key: String,
    pub expire_at: Option<DateTime<Utc>>,
    pub is_active: bool,
}

impl ProjectKeys {
    pub async fn get_private_key(
        pool: &PgPool,
        project_id: &Uuid,
        passphrase: &str,
    ) -> Result<String, ApiError> {
        let row = sqlx::query!(
            r#"
            select private_key
              from project_keys
             where project_id = $1
               and is_active = true
        "#,
            project_id
        )
        .fetch_one(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        // TODO: Refactor this mess of unwraps
        let key = PKey::private_key_from_pem_passphrase(
            row.private_key.as_bytes(),
            passphrase.as_bytes(),
        )
        .unwrap();

        let private_key = String::from_utf8(key.private_key_to_pem_pkcs8().unwrap()).unwrap();

        Ok(private_key)
    }

    pub async fn get_public_key(pool: &PgPool, project_id: &Uuid) -> Result<String, ApiError> {
        sqlx::query!(
            r#"
            select public_key
              from project_keys
             where project_id = $1
               and is_active = true
        "#,
            project_id
        )
        .fetch_one(pool)
        .await
        .map(|row| row.public_key)
        .map_err(|_| ApiError::InternalServerError)
    }

    pub fn create_keys(
        is_active: bool,
        expire_at: Option<DateTime<Utc>>,
        passphrase: &str,
    ) -> NewProjectKeys {
        let rsa = Rsa::generate(2048).unwrap();
        let pkey = PKey::from_rsa(rsa).unwrap();
        let public_key: Vec<u8> = pkey.public_key_to_pem().unwrap();

        let private_key = pkey
            .private_key_to_pem_pkcs8_passphrase(Cipher::des_ede3_cbc(), passphrase.as_bytes())
            .unwrap();

        NewProjectKeys {
            is_active,
            expire_at,
            public_key: String::from_utf8(public_key).unwrap(),
            private_key: String::from_utf8(private_key).unwrap(),
        }
    }
}
