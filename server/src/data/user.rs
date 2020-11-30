use crate::db::{get_query, AuthDb};
use crate::response::error::ApiError;

use bcrypt::{hash, DEFAULT_COST};
use chrono::{DateTime, Utc};
use rocket_contrib::databases::postgres::error::DbError;
use rocket_contrib::databases::postgres::Row;
use serde::{Deserialize, Serialize};
use serde_json::value::Value;
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct User {
    pub id: Uuid,
    pub display_name: Option<String>,
    pub email: String,
    pub email_verified: bool,
    pub photo_url: Option<String>,
    pub traits: Vec<String>,
    pub data: Value,
    pub provider_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(skip_serializing)]
    pub password: Option<String>,
}

impl User {
    fn from_row(row: Row) -> User {
        let password: Option<String> = match row.try_get("password") {
            Ok(password) => Some(password),
            Err(_) => None,
        };

        User {
            id: row.get("id"),
            password,
            display_name: row.get("display_name"),
            email: row.get("email"),
            email_verified: row.get("email_verified"),
            photo_url: row.get("photo_url"),
            traits: row.get("traits"),
            data: row.get("data"),
            provider_id: row.get("provider_id"),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        }
    }

    pub async fn get_by_email(
        conn: &AuthDb,
        email: String,
        project: Uuid,
    ) -> Result<User, ApiError> {
        let query = get_query("user/get_by_email")?;

        let row = conn
            .run(move |c| c.query_one(query, &[&email, &project]))
            .await;

        match row {
            Err(_) => Err(ApiError::NotFound),
            Ok(user) => Ok(User::from_row(user)),
        }
    }

    pub async fn get_by_id(conn: &AuthDb, id: Uuid, project: Uuid) -> Result<User, ApiError> {
        let query = get_query("user/get_by_id")?;

        let row = conn
            .run(move |c| c.query_one(query, &[&id, &project]))
            .await;

        match row {
            Err(_) => Err(ApiError::NotFound),
            Ok(user) => Ok(User::from_row(user)),
        }
    }

    pub async fn password(conn: &AuthDb, email: String, project: Uuid) -> Result<User, ApiError> {
        let query = get_query("user/get_password")?;

        let row = conn
            .run(move |c| c.query_one(query, &[&email, &project]))
            .await;

        let row = match row {
            Err(_) => return Err(ApiError::UserNotFound),
            Ok(user) => user,
        };

        Ok(User::from_row(row))
    }

    pub async fn create(
        conn: &AuthDb,
        email: String,
        password: String,
        project: Uuid,
    ) -> Result<User, ApiError> {
        let query = get_query("user/sign_up")?;

        let password = match hash(password.clone(), DEFAULT_COST) {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(hashed) => hashed,
        };

        let row = conn
            .run(move |c| c.query_one(query, &[&email, &password, &project]))
            .await;

        match row {
            Ok(user) => Ok(User::from_row(user)),
            Err(err) => match err.into_source() {
                None => Err(ApiError::InternalServerError),
                Some(source) => {
                    if let Some(db_error) = source.downcast_ref::<DbError>() {
                        match db_error.constraint() {
                            Some("users_project_id_fkey") => Err(ApiError::ProjectNotFound),
                            Some("users_project_id_email_key") => Err(ApiError::UserDuplicate),
                            _ => Err(ApiError::InternalServerError),
                        }
                    } else {
                        Err(ApiError::InternalServerError)
                    }
                }
            },
        }
    }
}
