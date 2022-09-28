use chrono::{DateTime, Utc};
use openssl::pkey::PKey;
use openssl::rsa::Rsa;
use openssl::symm::Cipher;
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;

pub struct ProjectKeys {
    pub id: Uuid,
    pub project_id: Uuid,
    pub public_key: Vec<u8>,
    pub private_key: Vec<u8>,
    pub is_active: bool,
    pub expire_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug)]
pub struct NewProjectKeys {
    pub public_key: Vec<u8>,
    pub private_key: Vec<u8>,
    pub expire_at: Option<DateTime<Utc>>,
    pub is_active: bool,
}

impl ProjectKeys {
    pub async fn get_private_key(
        pool: &PgPool,
        project_id: &Uuid,
        passphrase: &str,
    ) -> Result<String, ApiError> {
        let row = sqlx::query_file!("src/keys/sql/get_private_key.sql", project_id)
            .fetch_one(pool)
            .await?;

        let key = PKey::private_key_from_pem_passphrase(&row.private_key, passphrase.as_bytes())
            .map_err(|_| ApiError::InternalServerError)?;

        let private_key = key
            .private_key_to_pem_pkcs8()
            .map(String::from_utf8)
            .map_err(|_| ApiError::InternalServerError)?;

        private_key.map_err(|_| ApiError::InternalServerError)
    }

    pub async fn get_public_key(pool: &PgPool, project_id: &Uuid) -> sqlx::Result<Vec<u8>> {
        sqlx::query_file!("src/keys/sql/get_public_key.sql", project_id)
            .fetch_one(pool)
            .await
            .map(|row| row.public_key)
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
            public_key,
            private_key,
        }
    }
}

#[derive(Serialize)]
pub struct PublicKey {
    pub id: Uuid,
    pub key: Vec<u8>,
}

impl PublicKey {
    pub async fn get_all(pool: &PgPool) -> sqlx::Result<Vec<PublicKey>> {
        sqlx::query_file_as!(PublicKey, "src/keys/sql/get_public_keys.sql")
            .fetch_all(pool)
            .await
    }

    pub async fn get_by_project(pool: &PgPool, project_id: &Uuid) -> sqlx::Result<Vec<PublicKey>> {
        sqlx::query_file_as!(PublicKey, "src/keys/sql/get_by_project.sql", project_id)
            .fetch_all(pool)
            .await
    }
}
