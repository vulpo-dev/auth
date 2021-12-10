use crate::{password::data::PasswordAlg, response::error::ApiError};

use sqlx::PgPool;
use uuid::Uuid;

pub struct Project;

impl Project {
    pub async fn set_settings(
        pool: &PgPool,
        project: &Uuid,
        email: &str,
        domain: &str,
    ) -> Result<(), ApiError> {
        sqlx::query_file!(
            "src/project/sql/set_project_settings.sql",
            project,
            email,
            domain
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn domain(pool: &PgPool, project: &Uuid) -> Result<String, ApiError> {
        sqlx::query_file!("src/project/sql/get_project_domain.sql", project)
            .fetch_one(pool)
            .await
            .map(|row| row.domain)
            .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn is_admin(pool: &PgPool, project: &Uuid) -> Result<bool, ApiError> {
        sqlx::query_file!("src/project/sql/is_admin.sql", project)
            .fetch_one(pool)
            .await
            .map(|row| row.is_admin)
            .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn delete(pool: &PgPool, project: &Uuid) -> Result<(), ApiError> {
        sqlx::query_file!("src/project/sql/delete_project.sql", project)
            .execute(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn password_alg(pool: &PgPool, project: &Uuid) -> Result<PasswordAlg, ApiError> {
        sqlx::query_file!("src/project/sql/get_password_alg.sql", project)
            .fetch_one(pool)
            .await
            .map(|row| row.alg)
            .map_err(|_| ApiError::InternalServerError)
    }

    pub async fn password_alg_by_user(pool: &PgPool, user: &Uuid) -> Result<PasswordAlg, ApiError> {
        sqlx::query_file!("src/project/sql/get_password_alg_by_user.sql", user)
            .fetch_one(pool)
            .await
            .map(|row| row.alg)
            .map_err(|_| ApiError::InternalServerError)
    }
}
