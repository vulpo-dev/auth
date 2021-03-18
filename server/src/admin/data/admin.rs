use crate::db::Db;
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::AccessToken;
use crate::session::data::{NewProjectKeys, ProjectKeys};
use crate::user::data::User;

use rocket::http::Status;
use rocket::request::Outcome;
use rocket::request::{self, FromRequest, Request};

use bcrypt::{hash, DEFAULT_COST};
use serde::{Deserialize, Serialize};
use serde_json::json;
use serde_json::value::Value;
use sqlx::postgres::PgDatabaseError;
use sqlx::{self, Error, PgPool};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct PartialProject {
    pub id: Uuid,
    pub name: String,
    pub domain: String,
}

#[derive(Debug, Deserialize)]
pub struct NewProject {
    pub name: String,
    pub domain: String,
}

#[derive(Debug, Deserialize)]
pub struct NewAdmin {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct NewUser {
    pub email: String,
    pub project_id: Uuid,
    pub password: Option<String>,
    pub display_name: Option<String>,
    pub data: Option<Value>,
    pub provider_id: Option<String>,
}

#[derive(Debug)]
pub struct Admin(User);

impl Admin {
    pub async fn create(pool: &PgPool, body: NewAdmin, project: Uuid) -> Result<Uuid, ApiError> {
        let password = match hash(body.password, DEFAULT_COST) {
            Err(_) => return Err(ApiError::InternalServerError),
            Ok(hashed) => hashed,
        };

        let row = sqlx::query!(
            r#"
            insert into users
                 ( email
                 , password
                 , project_id
                 , traits
                 , data
                 , provider_id
                 )
            values
                 ( $1
                 , $2
                 , $3
                 , '{ "Admin" }'
                 , '{}'::jsonb
                 , 'email'
                 )
            returning id
            "#,
            &body.email,
            &password,
            &project
        )
        .fetch_one(pool)
        .await
        .map_err(|err| match err {
            Error::Database(err) => {
                let err = err.downcast::<PgDatabaseError>();
                match err.constraint() {
                    Some("users_project_id_fkey") => ApiError::ProjectNotFound,
                    Some("users_project_id_email_key") => ApiError::AdminExists,
                    _ => ApiError::InternalServerError,
                }
            }
            _ => ApiError::InternalServerError,
        })?;

        Ok(row.id)
    }

    pub async fn has_admin(pool: &PgPool) -> Result<bool, ApiError> {
        let row = sqlx::query!(
            r#"
            select count(*) > 0 as has_admin
              from projects
              join users on users.id = projects.id
             where projects.is_admin = True
        "#
        )
        .fetch_one(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        row.has_admin.ok_or(ApiError::InternalServerError)
    }

    pub async fn create_project(
        pool: &PgPool,
        body: &NewProject,
        keys: &NewProjectKeys,
    ) -> Result<Uuid, ApiError> {
        let row = sqlx::query!(
            r#"
            with created_project as (
                   insert into projects
                  default values
                returning id
            ), create_project_settings as (
                insert into project_settings(project_id, name, domain)
                select created_project.id as "project_id"
                     , $1 as "name"
                     , $2 as "domain"
                  from created_project
                returning project_id
            )
            insert into project_keys(project_id, public_key, private_key, is_active, expire_at)
            select create_project_settings.project_id
                 , $3 as "public_key"
                 , $4 as "private_key"
                 , $5 as "is_active"
                 , $6 as "expire_at"
              from create_project_settings
            returning project_id as id
        "#,
            body.name,
            body.domain,
            keys.public_key,
            keys.private_key,
            keys.is_active,
            keys.expire_at,
        )
        .fetch_one(pool)
        .await
        .map_err(|err| match err {
            Error::Database(err) => {
                let err = err.downcast::<PgDatabaseError>();
                match err.code() {
                    "23505" => ApiError::ProjectNameExists,
                    _ => ApiError::InternalServerError,
                }
            }
            _ => ApiError::InternalServerError,
        })?;

        Ok(row.id)
    }

    pub async fn project_list(pool: &PgPool) -> Result<Vec<PartialProject>, ApiError> {
        sqlx::query_as!(
            PartialProject,
            r#"
            select id
                 , project_settings.name
                 , project_settings.domain
              from projects
              join project_settings on project_settings.project_id = projects.id
             where is_admin = False
             order by created_at
        "#
        )
        .fetch_all(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn set_admin(pool: &PgPool, id: &Uuid) -> Result<(), ApiError> {
        sqlx::query!(
            r#"
            update projects
               set is_admin = true
                 , flags = '{ "auth::signin", "method::email_password" }'
             where id = $1
        "#,
            id,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn get_project(pool: &PgPool) -> Result<Option<Uuid>, ApiError> {
        let rows = sqlx::query!(
            r#"
            select id
              from projects
             where is_admin = True
        "#
        )
        .fetch_all(pool)
        .await
        .map_err(|_err| ApiError::InternalServerError)?;

        let id = rows.get(0).and_then(|row| Some(row.id));
        Ok(id)
    }

    pub async fn create_user(pool: &PgPool, user: NewUser) -> Result<Uuid, ApiError> {
        let password = match user.password {
            Some(ref password) => match hash(password.clone(), DEFAULT_COST) {
                Err(_) => return Err(ApiError::InternalServerError),
                Ok(hashed) => Some(hashed),
            },
            None => None,
        };

        let data = match user.data {
            Some(ref json) => json.clone(),
            None => json!({}),
        };

        let provider = match user.provider_id {
            Some(ref id) => id.clone(),
            None => String::from("email"),
        };

        let row = sqlx::query!(
            r#"
            insert into users
                ( email
                , password
                , display_name
                , data
                , provider_id
                , project_id
                )
            values
                ( $1
                , $2
                , $3
                , $4::jsonb
                , $5
                , $6
                )
            returning id
        "#,
            user.email,
            password,
            user.display_name,
            data,
            provider,
            user.project_id,
        )
        .fetch_one(pool)
        .await
        .map_err(|err| match err {
            Error::Database(err) => {
                let db_err = err.downcast::<PgDatabaseError>();
                match db_err.code() {
                    "23505" => ApiError::UserExists,
                    "23503" => ApiError::UserInvalidProject,
                    _ => ApiError::InternalServerError,
                }
            }
            _ => ApiError::InternalServerError,
        })?;

        Ok(row.id)
    }
}

#[rocket::async_trait]
impl<'a, 'r> FromRequest<'a, 'r> for Admin {
    type Error = ApiError;

    async fn from_request(req: &'a Request<'r>) -> request::Outcome<Self, Self::Error> {
        let token_string = match req.headers().get_one("Authorization") {
            None => return Outcome::Failure((Status::BadRequest, ApiError::AuthTokenMissing)),
            Some(token) => token,
        };

        let project = match Project::from_request(req).await.succeeded() {
            None => return Outcome::Failure((Status::BadRequest, ApiError::AuthTokenMissing)),
            Some(project) => project,
        };

        let db = match Db::from_request(req).await.succeeded() {
            None => {
                return Outcome::Failure((Status::ServiceUnavailable, ApiError::AuthTokenMissing))
            }
            Some(pool) => pool,
        };

        let key = match ProjectKeys::get_public_key(db.inner(), &project.id).await {
            Ok(key) => key,
            Err(_) => {
                return Outcome::Failure((Status::InternalServerError, ApiError::AuthTokenMissing));
            }
        };

        let end = token_string.len();
        let start = "Bearer ".len();
        let token = &token_string[start..end];
        let claims = match AccessToken::from_rsa(token.to_string(), &key) {
            Ok(token) => token,
            Err(_) => {
                return Outcome::Failure((Status::Unauthorized, ApiError::BadRequest));
            }
        };

        if !claims.user.traits.contains(&String::from("Admin")) {
            return Outcome::Failure((Status::Forbidden, ApiError::AdminAuth));
        }

        Outcome::Success(Admin(claims.user))
    }
}
