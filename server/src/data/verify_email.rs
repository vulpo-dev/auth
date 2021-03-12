use crate::data::get_query;
use crate::response::error::ApiError;

use chrono::{DateTime, Utc};
use rocket_contrib::databases::postgres::GenericClient;
use uuid::Uuid;

pub struct VerifyEmail {
    pub token: String,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
}

impl VerifyEmail {
    pub fn insert<C: GenericClient>(
        client: &mut C,
        user_id: &Uuid,
        token: String,
    ) -> Result<Uuid, ApiError> {
        let query = get_query("verify_email/insert_token")?;
        let row = client.query_one(query, &[&token, &user_id]);
        match row {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(row) => Ok(row.get("id")),
        }
    }

    pub fn get<C: GenericClient>(client: &mut C, id: &Uuid) -> Result<VerifyEmail, ApiError> {
        let query = get_query("verify_email/get_token")?;
        let row = client.query(query, &[&id]);
        match row {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(entries) => {
                if entries.len() == 0 {
                    return Err(ApiError::TokenNotFound);
                }

                let row = entries.get(0).unwrap();
                let entry = VerifyEmail {
                    token: row.get("token"),
                    user_id: row.get("user_id"),
                    created_at: row.get("created_at"),
                };

                Ok(entry)
            }
        }
    }

    pub fn verify<C: GenericClient>(client: &mut C, user_id: &Uuid) -> Result<(), ApiError> {
        let query = get_query("verify_email/verify")?;
        match client.query(query, &[&user_id]) {
            Err(err) => {
                println!("{:?}", err);
                Err(ApiError::InternalServerError)
            }
            Ok(_) => Ok(()),
        }
    }

    pub fn unverify<C: GenericClient>(client: &mut C, user_id: &Uuid) -> Result<String, ApiError> {
        let query = get_query("verify_email/unverify")?;
        match client.query_one(query, &[&user_id]) {
            Err(err) => {
                println!("{:?}", err);
                Err(ApiError::InternalServerError)
            }
            Ok(row) => Ok(row.get("email")),
        }
    }
}
