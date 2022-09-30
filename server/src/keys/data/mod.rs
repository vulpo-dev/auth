use std::path::PathBuf;

use crate::cache::Cache;
use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;

use ecdsa::SigningKey;
use p384::NistP384;
use pkcs8::{DecodePrivateKey, EncodePrivateKey, EncodePublicKey, LineEnding};
use rand_core::OsRng;
use tracing::{error, info};

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
        cache: &Cache,
        pool: &PgPool,
        project_id: &Uuid,
        passphrase: &str,
    ) -> Result<Vec<u8>, ApiError> {
        let mut cache_key = PathBuf::from("vulpo_private_key");
        cache_key.push(project_id.to_string());

        if let Some(value) = cache.get(&cache_key).await {
            return Ok(value.as_bytes().to_vec());
        }

        let row = sqlx::query_file!("src/keys/sql/get_private_key.sql", project_id)
            .fetch_one(pool)
            .await?;

        let key = String::from_utf8(row.private_key).map_err(|_| ApiError::InternalServerError)?;

        let private_key: SigningKey<NistP384> =
            SigningKey::from_pkcs8_encrypted_pem(&key, passphrase)
                .map_err(|_| ApiError::InternalServerError)?;

        let key = private_key
            .to_pkcs8_pem(LineEnding::LF)
            .map_err(|_| ApiError::InternalServerError)?;

        match cache.set(&cache_key, &key).await {
            Some(_) => info!("CACHE set vulpo_private_key/{}", project_id),
            None => error!("CACHE failed to set vulpo_private_key/{}", project_id),
        }

        Ok(key.as_bytes().to_vec())
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
        let signing_key: SigningKey<NistP384> = SigningKey::random(&mut OsRng);
        let verifying_key = signing_key.verifying_key();

        let public_key = verifying_key
            .to_public_key_pem(LineEnding::LF)
            .unwrap()
            .as_bytes()
            .to_vec();

        let private_key = signing_key
            .to_pkcs8_encrypted_der(&mut OsRng, passphrase)
            .unwrap()
            .as_bytes()
            .to_vec();

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
