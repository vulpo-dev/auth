use crate::data::token::UserId;
use crate::data::{get_query, GenericClient};
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
    fn from_row(row: &Row) -> User {
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

    pub fn get_by_email<C: GenericClient>(
        client: &mut C,
        email: String,
        project: Uuid,
    ) -> Result<User, ApiError> {
        let query = get_query("user/get_by_email")?;
        let row = client.query_one(query, &[&email, &project]);

        match row {
            Err(_) => Err(ApiError::NotFound),
            Ok(user) => Ok(User::from_row(&user)),
        }
    }

    pub fn get_by_id<C: GenericClient>(
        client: &mut C,
        id: Uuid,
        project: Uuid,
    ) -> Result<User, ApiError> {
        let query = get_query("user/get_by_id")?;
        let row = client.query_one(query, &[&id, &project]);

        match row {
            Err(_) => Err(ApiError::NotFound),
            Ok(user) => Ok(User::from_row(&user)),
        }
    }

    pub fn get_ids<C: GenericClient>(
        client: &mut C,
        ids: Vec<Uuid>,
        project: &Uuid,
    ) -> Result<Vec<User>, ApiError> {
        let query = get_query("user/get_ids")?;

        let users = match UserId::to_rows(ids) {
            Ok(rows) => rows,
            Err(_) => return Err(ApiError::InternalServerError),
        };

        println!("{:?}", users);
        let rows = match client.query(query, &[&users, &project]) {
            Err(err) => {
                println!("{:?}", err);
                return Err(ApiError::NotFound);
            }
            Ok(rows) => rows,
        };

        let users = rows
            .iter()
            .map(move |row| User::from_row(row))
            .collect::<Vec<User>>();

        Ok(users)
    }

    pub fn password<C: GenericClient>(
        client: &mut C,
        email: String,
        project: Uuid,
    ) -> Result<User, ApiError> {
        let query = get_query("user/get_password")?;

        let row = client.query_one(query, &[&email, &project]);

        let row = match row {
            Err(_) => return Err(ApiError::UserNotFound),
            Ok(user) => user,
        };

        Ok(User::from_row(&row))
    }

    pub fn create<C: GenericClient>(
        client: &mut C,
        email: String,
        password: String,
        project: Uuid,
    ) -> Result<User, ApiError> {
        let query = get_query("user/sign_up")?;

        let password = match hash(password.clone(), DEFAULT_COST) {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(hashed) => hashed,
        };

        let row = client.query_one(query, &[&email, &password, &project]);

        match row {
            Ok(user) => Ok(User::from_row(&user)),
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
