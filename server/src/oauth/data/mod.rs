use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

pub mod google;

pub struct OAuthRequestState {
    pub request_id: Uuid,
    pub csrf_token: String,
    pub pkce_code_verifier: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl OAuthRequestState {
    pub async fn insert(
        pool: &PgPool,
        request_id: Uuid,
        csrf_token: Option<&str>,
        pkce_code_verifier: Option<&str>,
        project_id: &Uuid,
    ) -> sqlx::Result<()> {
        sqlx::query_file!(
            "src/oauth/sql/insert_oauth_request_state.sql",
            request_id,
            csrf_token,
            pkce_code_verifier,
            project_id,
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn get(pool: &PgPool, request_id: &Uuid) -> sqlx::Result<OAuthRequestState> {
        sqlx::query_file_as!(
            OAuthRequestState,
            "src/oauth/sql/get_oauth_request_state.sql",
            request_id
        )
        .fetch_one(pool)
        .await
    }
}

pub struct OAuthData;

impl OAuthData {
    pub async fn get_user_id(
        pool: &PgPool,
        provider_id: &str,
        provider: &str,
        project_id: &Uuid,
    ) -> sqlx::Result<Option<Uuid>> {
        sqlx::query_file!(
            "src/oauth/sql/get_user_id.sql",
            provider_id,
            provider,
            project_id
        )
        .fetch_optional(pool)
        .await
        .map(|row| row.map(|r| r.user_id))
    }

    pub async fn upsert(
        pool: &PgPool,
        provider_id: &str,
        provider: &str,
        email: &str,
        user_id: &Uuid,
        project_id: &Uuid,
    ) -> sqlx::Result<()> {
        sqlx::query_file!(
            "src/oauth/sql/upsert_oauth_data.sql",
            provider_id,
            provider,
            email,
            user_id,
            project_id,
        )
        .execute(pool)
        .await?;

        Ok(())
    }
}
