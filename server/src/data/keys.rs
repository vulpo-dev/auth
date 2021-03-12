use crate::data::get_query;
use crate::response::error::ApiError;

use chrono::{DateTime, Utc};
use openssl::pkey::PKey;
use openssl::rsa::Rsa;
use openssl::symm::Cipher;
use rocket_contrib::databases::postgres::GenericClient;
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
    pub project_id: Uuid,
    pub expire_at: Option<DateTime<Utc>>,
    pub is_active: bool,
}

impl ProjectKeys {
    pub fn get_private_key<C: GenericClient>(
        client: &mut C,
        project_id: &Uuid,
        passphrase: &str,
    ) -> Result<String, ApiError> {
        let query = get_query("project_keys/get_private_key")?;

        // TODO: Refactor this mess of unwraps
        match client.query_one(query, &[&project_id]) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(row) => {
                let private_key: String = row.get("private_key");
                let key = PKey::private_key_from_pem_passphrase(
                    private_key.as_bytes(),
                    passphrase.as_bytes(),
                )
                .unwrap();

                let private_key =
                    String::from_utf8(key.private_key_to_pem_pkcs8().unwrap()).unwrap();

                Ok(private_key)
            }
        }
    }

    pub fn get_public_key<C: GenericClient>(
        client: &mut C,
        project_id: &Uuid,
    ) -> Result<String, ApiError> {
        let query = get_query("project_keys/get_public_key")?;

        match client.query_one(query, &[&project_id]) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(row) => Ok(row.get("public_key")),
        }
    }

    pub fn create_keys(
        project_id: Uuid,
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
            project_id,
            is_active,
            expire_at,
            public_key: String::from_utf8(public_key).unwrap(),
            private_key: String::from_utf8(private_key).unwrap(),
        }
    }

    pub fn insert<C: GenericClient>(
        client: &mut C,
        keys: &NewProjectKeys,
    ) -> Result<Uuid, ApiError> {
        let query = get_query("project_keys/create")?;

        let row = client.query_one(
            query,
            &[
                &keys.project_id,
                &keys.public_key,
                &keys.private_key,
                &keys.is_active,
                &keys.expire_at,
            ],
        );

        match row {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(row) => Ok(row.get("id")),
        }
    }
}
