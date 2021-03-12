use crate::db::get_query;
use crate::response::error::ApiError;

use chrono::{DateTime, Utc};
use rocket_contrib::databases::postgres::GenericClient;
use uuid::Uuid;

pub struct PasswordReset {
    pub token: String,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
}

impl PasswordReset {
    pub fn insert<C: GenericClient>(
        client: &mut C,
        user_id: &Uuid,
        token: String,
    ) -> Result<Uuid, ApiError> {
        let query = get_query("password/insert_password_reset_token")?;
        let row = client.query_one(query, &[&token, &user_id]);
        match row {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(row) => Ok(row.get("id")),
        }
    }

    pub fn get<C: GenericClient>(client: &mut C, id: &Uuid) -> Result<PasswordReset, ApiError> {
        let query = get_query("password/get_reset_password_token")?;
        let row = client.query(query, &[&id]);
        match row {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(entries) => {
                if entries.len() == 0 {
                    return Err(ApiError::ResetTokenNotFound);
                }

                let row = entries.get(0).unwrap();
                let entry = PasswordReset {
                    token: row.get("token"),
                    user_id: row.get("user_id"),
                    created_at: row.get("created_at"),
                };

                Ok(entry)
            }
        }
    }

    pub fn remove<C: GenericClient>(client: &mut C, user_id: &Uuid) -> Result<(), ApiError> {
        let query = get_query("password/remove_password_reset_tokens")?;
        match client.query(query, &[&user_id]) {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(_) => Ok(()),
        }
    }
}
