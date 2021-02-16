use crate::data::{get_query, GenericClient};
use crate::response::error::ApiError;

use bcrypt::{hash, DEFAULT_COST};
use chrono::{DateTime, Utc};
use rocket_contrib::databases::postgres::error::DbError;
use rocket_contrib::databases::postgres::Row;
use serde::{Deserialize, Serialize};
use serde_json::value::Value;
use std::str::FromStr;
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
    ) -> Result<Option<User>, ApiError> {
        let query = get_query("user/get_by_email")?;
        let rows = match client.query(query, &[&email, &project]) {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(rows) => rows,
        };

        match rows.get(0) {
            None => Ok(None),
            Some(row) => Ok(Some(User::from_row(row))),
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

    pub fn set_password<C: GenericClient>(
        client: &mut C,
        user_id: Uuid,
        password: String,
    ) -> Result<(), ApiError> {
        let query = get_query("user/set_password")?;

        let password = match hash(password.clone(), DEFAULT_COST) {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(hashed) => hashed,
        };

        let res = client.query(query, &[&user_id, &password]);

        match res {
            Err(_) => Err(ApiError::InternalServerError),
            Ok(_) => Ok(()),
        }
    }

    pub fn list<C: GenericClient>(
        client: &mut C,
        project: &Uuid,
        order_by: &UserOrder,
        direction: SortDirection,
        offset: i64,
        limit: i64,
    ) -> Result<Vec<PartialUser>, ApiError> {
        let query = get_query("user/list")?;
        let direction = direction.to_string();
        let query = query.replace(":direction", &direction);

        let rows = client.query(
            query.as_str(),
            &[&project, &order_by.to_string(), &offset, &limit],
        );

        let rows = match rows {
            Err(_) => {
                return Err(ApiError::InternalServerError);
            }
            Ok(rows) => rows,
        };

        let users: Vec<PartialUser> = rows
            .iter()
            .map(|row| PartialUser {
                id: row.get("id"),
                email: row.get("email"),
                email_verified: row.get("email_verified"),
                provider_id: row.get("provider_id"),
                created_at: row.get("created_at"),
            })
            .collect();

        Ok(users)
    }

    pub fn total<C: GenericClient>(client: &mut C, project: &Uuid) -> Result<TotalUsers, ApiError> {
        let query = get_query("user/total")?;

        let row = client.query_one(query, &[&project]);

        let row = match row {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(count) => count,
        };

        Ok(TotalUsers {
            total_users: row.get("total_users"),
        })
    }

    pub fn remove<C: GenericClient>(client: &mut C, user_id: &Uuid) -> Result<(), ApiError> {
        let query = get_query("user/remove")?;
        let row = client.query(query, &[&user_id]);
        match row {
            Ok(_) => Ok(()),
            Err(_) => Err(ApiError::InternalServerError),
        }
    }

    pub fn remove_by_token<C: GenericClient>(
        client: &mut C,
        token_id: &Uuid,
    ) -> Result<(), ApiError> {
        let query = get_query("user/remove_by_token")?;
        let row = client.query(query, &[&token_id]);
        match row {
            Ok(_) => Ok(()),
            Err(_) => Err(ApiError::InternalServerError),
        }
    }
}

pub enum SortDirection {
    Asc,
    Desc,
}

impl ToString for SortDirection {
    fn to_string(&self) -> String {
        match self {
            SortDirection::Asc => String::from("asc"),
            SortDirection::Desc => String::from("desc"),
        }
    }
}

impl FromStr for SortDirection {
    type Err = ParamError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.trim() {
            "asc" => Ok(SortDirection::Asc),
            "desc" => Ok(SortDirection::Desc),
            _ => Err(ParamError::InvalidOption),
        }
    }
}

pub enum UserOrder {
    CreatedAt,
    Email,
}

impl ToString for UserOrder {
    fn to_string(&self) -> String {
        match self {
            UserOrder::CreatedAt => String::from("created_at"),
            UserOrder::Email => String::from("email"),
        }
    }
}

impl FromStr for UserOrder {
    type Err = ParamError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.trim() {
            "created_at" => Ok(UserOrder::CreatedAt),
            "email" => Ok(UserOrder::Email),
            _ => Err(ParamError::InvalidOption),
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PartialUser {
    id: Uuid,
    email: String,
    email_verified: bool,
    provider_id: String,
    created_at: DateTime<Utc>,
}

pub enum ParamError {
    InvalidOption,
}

#[derive(Serialize)]
pub struct TotalUsers {
    pub total_users: i64,
}
