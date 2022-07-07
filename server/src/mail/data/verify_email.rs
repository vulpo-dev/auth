use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

pub struct VerifyEmail {
    pub token: String,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub expire_at: DateTime<Utc>,
}

impl VerifyEmail {
    pub async fn insert(
        pool: &PgPool,
        user_id: &Uuid,
        token: String,
        project_id: &Uuid,
    ) -> sqlx::Result<Uuid> {
        sqlx::query_file!(
            "src/mail/sql/insert_verify_email.sql",
            token,
            user_id,
            project_id
        )
        .fetch_one(pool)
        .await
        .map(|row| row.id)
    }

    pub async fn get(pool: &PgPool, id: &Uuid) -> sqlx::Result<Option<VerifyEmail>> {
        sqlx::query_file_as!(VerifyEmail, "src/mail/sql/get_verify_email.sql", id)
            .fetch_optional(pool)
            .await
    }

    pub async fn verify(pool: &PgPool, user_id: &Uuid) -> sqlx::Result<()> {
        sqlx::query_file!("src/mail/sql/verify_email.sql", user_id)
            .execute(pool)
            .await?;

        Ok(())
    }

    pub async fn unverify(pool: &PgPool, user_id: &Uuid) -> sqlx::Result<String> {
        sqlx::query_file!("src/mail/sql/unverify_email.sql", user_id)
            .fetch_one(pool)
            .await
            .map(|row| row.email)
    }
}
