use crate::password::data::PasswordAlg;

use sqlx::PgPool;
use std::path::PathBuf;
use tracing::{error, info};
use uuid::Uuid;
use werkbank::rocket::Cache;

pub struct Project;

impl Project {
    pub async fn set_settings(
        cache: &Cache,
        pool: &PgPool,
        project: &Uuid,
        email: &str,
        domain: &str,
    ) -> sqlx::Result<()> {
        sqlx::query_file!(
            "src/project/sql/set_project_settings.sql",
            project,
            email,
            domain
        )
        .execute(pool)
        .await?;

        let mut key_path = PathBuf::from("vulpo_project_domain");
        key_path.push(project.to_string());

        match cache.set(&key_path, &domain).await {
            Some(_) => info!("CACHE UPDATE doamin {}", domain),
            None => error!("CACHE failed to update doamin {}", domain),
        };

        Ok(())
    }

    pub async fn domain(cache: &Cache, pool: &PgPool, project: &Uuid) -> sqlx::Result<String> {
        let mut key_path = PathBuf::from("vulpo_project_domain");
        key_path.push(project.to_string());

        if let Some(domain) = cache.get(&key_path).await {
            return Ok(domain);
        }

        let domain = sqlx::query_file!("src/project/sql/get_project_domain.sql", project)
            .fetch_one(pool)
            .await
            .map(|row| row.domain);

        if let Ok(ref domain) = domain {
            match cache.set(&key_path, &domain).await {
                Some(()) => info!("CACHE set doamin {}", domain),
                None => error!("CACHE failed to set domain {}", domain),
            };
        }

        domain
    }

    pub async fn is_admin(pool: &PgPool, project: &Uuid) -> sqlx::Result<bool> {
        sqlx::query_file!("src/project/sql/is_admin.sql", project)
            .fetch_one(pool)
            .await
            .map(|row| row.is_admin)
    }

    pub async fn delete(pool: &PgPool, project: &Uuid) -> sqlx::Result<()> {
        sqlx::query_file!("src/project/sql/delete_project.sql", project)
            .execute(pool)
            .await?;

        Ok(())
    }

    pub async fn password_alg(pool: &PgPool, project: &Uuid) -> sqlx::Result<PasswordAlg> {
        sqlx::query_file!("src/project/sql/get_password_alg.sql", project)
            .fetch_one(pool)
            .await
            .map(|row| row.alg)
    }

    pub async fn password_alg_by_user(pool: &PgPool, user: &Uuid) -> sqlx::Result<PasswordAlg> {
        sqlx::query_file!("src/project/sql/get_password_alg_by_user.sql", user)
            .fetch_one(pool)
            .await
            .map(|row| row.alg)
    }
}
