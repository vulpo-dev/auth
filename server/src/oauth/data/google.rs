use crate::response::error::ApiError;

use serde::{Deserialize, Serialize};
use serde_json;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Deserialize, Serialize, Debug)]
pub struct GoogleConfig {
    pub client_id: String,
    pub client_secret: String,
    pub redirect_uri: String,
}

impl GoogleConfig {
    pub async fn upsert(
        pool: &PgPool,
        project_id: &Uuid,
        config: &GoogleConfig,
    ) -> Result<(), ApiError> {
        let config = serde_json::to_value(config).map_err(|_| ApiError::BadRequest)?;

        sqlx::query_file!(
            "src/oauth/sql/insert_config.sql",
            project_id,
            "google",
            config,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn get(pool: &PgPool, project: &Uuid) -> sqlx::Result<Option<GoogleConfig>> {
        let row = sqlx::query_file!("src/oauth/sql/get_config.sql", project, "google",)
            .fetch_optional(pool)
            .await?;

        Ok(row
            .map(|row| serde_json::from_value(row.settings).ok())
            .flatten())
    }
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GoogleMeResponse {
    pub resource_name: String,
    pub metadata: GoogleMetaData,
    pub names: Vec<GoogleNames>,
    pub photos: Vec<GooglePhotos>,
    pub email_addresses: Vec<GoogleEmails>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GoogleMetaData {
    pub sources: Vec<GoogleMetaDataSources>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GoogleMetaDataSources {
    pub id: String,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GoogleNames {
    pub display_name: String,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GooglePhotos {
    pub url: String,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GoogleEmails {
    pub value: String,
}
