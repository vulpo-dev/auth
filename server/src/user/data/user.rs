use bcrypt::{hash, DEFAULT_COST};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json;
use serde_json::value::Value;
use sqlx::{postgres::PgDatabaseError, Error, PgPool};
use std::str::FromStr;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;

#[derive(sqlx::Type, PartialEq, Debug, Clone, Deserialize, Serialize)]
#[sqlx(type_name = "user_state")]
#[sqlx(rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum UserState {
    Active,
    Disabled,
    SetPassword,
}

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
    pub state: UserState,
    pub device_languages: Vec<String>,
}

#[derive(Deserialize)]
pub struct UpdateUser {
    pub display_name: Option<String>,
    pub email: String,
    pub traits: Vec<String>,
    pub data: Value,
}

pub struct UpdatedUser {
    pub id: Uuid,
    pub display_name: Option<String>,
    pub email: String,
    pub email_verified: bool,
    pub traits: Vec<String>,
    pub data: Value,
}

pub struct UserProvider {
    pub email: String,
    pub display_name: Option<String>,
    pub photo_url: Option<String>,
    pub provider_id: String,
    pub device_languages: Vec<String>,
}

impl User {
    pub async fn update(
        pool: &PgPool,
        user_id: &Uuid,
        user: &UpdateUser,
    ) -> sqlx::Result<UpdatedUser> {
        sqlx::query_file_as!(
            UpdatedUser,
            "src/user/sql/set_user.sql",
            user_id,
            user.display_name,
            user.email,
            &user.traits,
            user.data
        )
        .fetch_one(pool)
        .await
    }

    pub async fn get_by_email(
        pool: &PgPool,
        email: &str,
        project: &Uuid,
    ) -> sqlx::Result<Option<User>> {
        sqlx::query_file_as!(User, "src/user/sql/get_by_email.sql", email, project)
            .fetch_optional(pool)
            .await
    }

    pub async fn get_by_id(pool: &PgPool, id: &Uuid, project: &Uuid) -> sqlx::Result<Option<User>> {
        sqlx::query_file_as!(User, "src/user/sql/get_by_id.sql", id, project)
            .fetch_optional(pool)
            .await
    }

    pub async fn create(
        pool: &PgPool,
        email: &str,
        password: &str,
        project: Uuid,
        languages: &Vec<String>,
    ) -> Result<Uuid, ApiError> {
        let password =
            hash(password.clone(), DEFAULT_COST).map_err(|_| ApiError::InternalServerError)?;

        sqlx::query_file!(
            "src/user/sql/create_user.sql",
            email,
            password,
            project,
            languages,
        )
        .fetch_one(pool)
        .await
        .map(|row| row.id)
        .map_err(|err| match err {
            Error::Database(err) => {
                let err = err.downcast::<PgDatabaseError>();
                match err.constraint() {
                    Some("users_project_id_fkey") => ApiError::ProjectNotFound,
                    Some("users_project_id_email_key") => ApiError::UserDuplicate,
                    _ => ApiError::InternalServerError,
                }
            }
            _ => ApiError::InternalServerError,
        })
    }

    pub async fn create_passwordless(
        pool: &PgPool,
        email: &str,
        project: &Uuid,
        languages: &Vec<String>,
    ) -> sqlx::Result<User> {
        sqlx::query_file_as!(
            User,
            "src/user/sql/create_passwordless.sql",
            email,
            project,
            languages,
        )
        .fetch_one(pool)
        .await
    }

    pub async fn create_provider(
        pool: &PgPool,
        user: &UserProvider,
        project_id: &Uuid,
    ) -> sqlx::Result<User> {
        sqlx::query_file_as!(
            User,
            "src/user/sql/create_provider.sql",
            user.email,
            user.display_name,
            user.photo_url,
            user.provider_id,
            &user.device_languages,
            project_id,
        )
        .fetch_one(pool)
        .await
    }

    // todo: direction
    pub async fn list(
        pool: &PgPool,
        project: &Uuid,
        order_by: &UserOrder,
        _direction: SortDirection,
        offset: i64,
        limit: i64,
    ) -> sqlx::Result<Vec<PartialUser>> {
        sqlx::query_file_as!(
            PartialUser,
            "src/user/sql/get_users.sql",
            project,
            order_by.to_string(),
            offset,
            limit,
        )
        .fetch_all(pool)
        .await
    }

    pub async fn total(pool: &PgPool, project: &Uuid) -> sqlx::Result<TotalUsers> {
        let row = sqlx::query_file!("src/user/sql/get_user_count.sql", project)
            .fetch_one(pool)
            .await?;

        match row.total_users {
            None => Ok(TotalUsers { total_users: 0 }),
            Some(total_users) => Ok(TotalUsers { total_users }),
        }
    }

    pub async fn remove(pool: &PgPool, user_id: &Uuid) -> sqlx::Result<()> {
        sqlx::query_file!("src/user/sql/remove_user.sql", user_id)
            .execute(pool)
            .await?;

        Ok(())
    }

    pub async fn disable(pool: &PgPool, user: &Uuid, project: &Uuid) -> sqlx::Result<()> {
        sqlx::query_file!("src/user/sql/disable_user.sql", user, project)
            .execute(pool)
            .await?;

        Ok(())
    }

    pub async fn enable(pool: &PgPool, user: &Uuid, project: &Uuid) -> sqlx::Result<()> {
        sqlx::query_file!("src/user/sql/enable_user.sql", user, project)
            .execute(pool)
            .await?;

        Ok(())
    }

    pub async fn project(pool: &PgPool, user_id: &Uuid) -> sqlx::Result<Option<Uuid>> {
        let row = sqlx::query_file!("src/user/sql/get_project_id.sql", user_id)
            .fetch_optional(pool)
            .await?;

        Ok(row.map(|r| r.project_id))
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
    state: UserState,
}

pub enum ParamError {
    InvalidOption,
}

#[derive(Serialize)]
pub struct TotalUsers {
    pub total_users: i64,
}
