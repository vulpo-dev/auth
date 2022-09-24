use crate::api_key::verify::verify_api_key;
use crate::keys::data::{NewProjectKeys, ProjectKeys};
use crate::project::Project;
use crate::response::error::ApiError;
use crate::session::data::{AccessToken, Claims};

use futures::join;
use rocket::http::Status;
use rocket::request::Outcome;
use rocket::request::{self, FromRequest, Request};
use serde::{Deserialize, Serialize};
use serde_json::json;
use serde_json::value::Value;
use werkbank::rocket::Db;

use sqlx::{self, PgPool};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct PartialProject {
    pub id: Uuid,
    pub name: String,
    pub domain: String,
    pub is_admin: bool,
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
    pub provider_id: String,
}

#[derive(Debug)]
pub struct Admin(Claims);

impl Admin {
    pub async fn create(pool: &PgPool, body: NewAdmin, project: Uuid) -> sqlx::Result<Uuid> {
        let row = sqlx::query_file!(
            "src/admin/sql/create_admin.sql",
            &body.email,
            &body.password,
            &project
        )
        .fetch_one(pool)
        .await?;

        Ok(row.id)
    }

    pub async fn has_admin(pool: &PgPool) -> sqlx::Result<Option<bool>> {
        sqlx::query_file!("src/admin/sql/has_admin.sql")
            .fetch_one(pool)
            .await
            .map(|row| row.has_admin)
    }

    pub async fn create_project(
        pool: &PgPool,
        body: &NewProject,
        keys: &NewProjectKeys,
    ) -> sqlx::Result<Uuid> {
        let row = sqlx::query_file!(
            "src/admin/sql/create_project.sql",
            body.name,
            body.domain,
            keys.public_key,
            keys.private_key,
            keys.is_active,
            keys.expire_at,
        )
        .fetch_one(pool)
        .await?;

        Ok(row.id)
    }

    pub async fn project_list(pool: &PgPool) -> sqlx::Result<Vec<PartialProject>> {
        sqlx::query_file_as!(PartialProject, "src/admin/sql/project_list.sql")
            .fetch_all(pool)
            .await
    }

    pub async fn set_admin(pool: &PgPool, id: &Uuid) -> sqlx::Result<()> {
        sqlx::query_file!("src/admin/sql/set_admin.sql", id)
            .execute(pool)
            .await?;

        Ok(())
    }

    pub async fn get_project(pool: &PgPool) -> sqlx::Result<Option<Uuid>> {
        let rows = sqlx::query_file!("src/admin/sql/get_project.sql")
            .fetch_all(pool)
            .await?;

        let id = rows.get(0).and_then(|row| Some(row.id));
        Ok(id)
    }

    pub async fn create_user(pool: &PgPool, user: &NewUser) -> Result<Uuid, ApiError> {
        let data = user.data.clone().unwrap_or(json!({}));

        let row = sqlx::query_file!(
            "src/admin/sql/create_user.sql",
            user.email,
            user.display_name,
            data,
            user.provider_id,
            user.project_id,
        )
        .fetch_one(pool)
        .await?;

        Ok(row.id)
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Admin {
    type Error = ApiError;

    async fn from_request(req: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        let token_string = match req.headers().get_one("Authorization") {
            None => return Outcome::Failure((Status::BadRequest, ApiError::AuthTokenMissing)),
            Some(token) => token,
        };

        let mut token_stream = token_string.split_whitespace().map(|part| part.trim());

        let token_type = match token_stream.next() {
            Some(tt) => tt,
            None => return Outcome::Failure((Status::BadRequest, ApiError::AuthTokenMissing)),
        };

        let token = match token_stream.next() {
            Some(t) => t,
            None => return Outcome::Failure((Status::BadRequest, ApiError::AuthTokenMissing)),
        };

        let (project, db) = join!(Project::from_request(req), Db::from_request(req));

        let project = match project.succeeded() {
            None => return Outcome::Failure((Status::BadRequest, ApiError::AuthTokenMissing)),
            Some(project) => project,
        };

        let db = match db.succeeded() {
            None => {
                return Outcome::Failure((Status::ServiceUnavailable, ApiError::AuthTokenMissing))
            }
            Some(pool) => pool,
        };

        let claims = match token_type.to_lowercase().as_str() {
            "bearer" => {
                let key = match ProjectKeys::get_public_key(&db, &project.id).await {
                    Ok(key) => key,
                    Err(_) => {
                        return Outcome::Failure((
                            Status::InternalServerError,
                            ApiError::AuthTokenMissing,
                        ));
                    }
                };

                match AccessToken::from_rsa(token.to_string(), &key) {
                    Ok(token) => token,
                    Err(_) => {
                        return Outcome::Failure((Status::Unauthorized, ApiError::BadRequest));
                    }
                }
            }

            "apikey" => match verify_api_key(&db, &token).await {
                Ok(claim) => claim,
                Err(err) => match err {
                    ApiError::BadRequest
                    | ApiError::TokenNotFound
                    | ApiError::TokenExpired
                    | ApiError::TokenInvalid => {
                        return Outcome::Failure((Status::BadRequest, ApiError::BadRequest))
                    }
                    _ => {
                        return Outcome::Failure((
                            Status::InternalServerError,
                            ApiError::BadRequest,
                        ))
                    }
                },
            },

            _ => return Outcome::Failure((Status::BadRequest, ApiError::AuthTokenMissing)),
        };

        if !claims.traits.contains(&String::from("Admin")) {
            return Outcome::Failure((Status::Forbidden, ApiError::AdminAuth));
        }

        Outcome::Success(Admin(claims))
    }
}
