use crate::response::error::ApiError;

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
        sqlx::query!(
            r#"
            update project_settings
               set name = $2
                 , domain = $3
             where project_id = $1
        "#,
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
        sqlx::query!(
            r#"
            select domain
              from project_settings
             where project_id = $1 
        "#,
            project
        )
        .fetch_one(pool)
        .await
        .map(|row| row.domain)
        .map_err(|_| ApiError::InternalServerError)
    }
}
