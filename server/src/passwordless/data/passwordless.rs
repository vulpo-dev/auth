use bcrypt;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug)]
pub struct Passwordless {
    pub id: Uuid,
    pub created_at: DateTime<Utc>,
    pub expire_at: DateTime<Utc>,
    pub user_id: Option<Uuid>,
    pub email: String,
    pub token: String,
    pub is_valid: bool,
    pub project_id: Uuid,
    pub confirmed: bool,
}

impl Passwordless {
    pub async fn create_token(
        pool: &PgPool,
        id: Option<Uuid>,
        email: &str,
        verification_token: &str,
        project: &Uuid,
        session_id: &Uuid,
    ) -> sqlx::Result<Uuid> {
        sqlx::query_file!(
            "src/passwordless/sql/insert_passwordless_token.sql",
            id,
            email,
            verification_token,
            project,
            session_id
        )
        .fetch_one(pool)
        .await
        .map(|row| row.id)
    }

    pub async fn get(pool: &PgPool, id: &Uuid) -> sqlx::Result<Option<Passwordless>> {
        sqlx::query_file_as!(
            Passwordless,
            "src/passwordless/sql/get_passwordless.sql",
            id
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn confirm(pool: &PgPool, id: &Uuid) -> sqlx::Result<()> {
        sqlx::query_file!("src/passwordless/sql/confirm_passwordless.sql", id)
            .execute(pool)
            .await?;

        Ok(())
    }

    pub async fn remove_all(pool: &PgPool, email: &str, project: &Uuid) -> sqlx::Result<()> {
        sqlx::query_file!("src/passwordless/sql/remove_all.sql", email, project)
            .execute(pool)
            .await?;

        Ok(())
    }

    pub fn compare(&self, token: &str) -> bool {
        bcrypt::verify(token, &self.token).unwrap_or(false)
    }
}
