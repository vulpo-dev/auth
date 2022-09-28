use serde::Deserialize;
use sqlx::PgPool;
use std::collections::HashMap;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;

#[derive(Deserialize)]
pub struct SetTranslation {
    pub project: Uuid,
    pub template: String,
    pub content: serde_json::Value,
    pub language: String,
}

#[derive(Deserialize)]
pub struct DeleteTranslation {
    pub project: Uuid,
    pub template: String,
    pub language: String,
}

#[derive(Deserialize)]
pub struct Translations {
    pub value: HashMap<String, serde_json::Value>,
}

pub type Translation = HashMap<String, String>;

impl Translations {
    pub async fn get_by_project(
        pool: &PgPool,
        project: &Uuid,
        template: &str,
    ) -> sqlx::Result<Translations> {
        let rows = sqlx::query_file!(
            "src/template/sql/get_translations_by_project.sql",
            project,
            template,
        )
        .fetch_all(pool)
        .await?;

        let value = rows
            .into_iter()
            .map(|row| (row.language, row.content))
            .collect::<HashMap<String, serde_json::Value>>();

        Ok(Translations { value })
    }

    pub async fn set(pool: &PgPool, translation: &SetTranslation) -> sqlx::Result<()> {
        sqlx::query_file!(
            "src/template/sql/set_translation.sql",
            translation.project,
            translation.template,
            translation.language,
            translation.content,
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn delete(pool: &PgPool, data: &DeleteTranslation) -> sqlx::Result<()> {
        sqlx::query_file!(
            "src/template/sql/remove_translation.sql",
            data.language,
            data.project,
            data.template,
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn get_by_user(
        pool: &PgPool,
        user_id: &Uuid,
        name: &str,
    ) -> Result<HashMap<String, String>, ApiError> {
        let translation =
            sqlx::query_file!("src/template/sql/get_user_translation.sql", user_id, name)
                .fetch_one(pool)
                .await
                .map_err(|_| ApiError::InternalServerError)?;

        serde_json::from_value(translation.content).map_err(|_| ApiError::InternalServerError)
    }

    pub async fn get_by_languages(
        pool: &PgPool,
        project_id: &Uuid,
        languages: &Vec<String>,
        name: &str,
    ) -> Result<HashMap<String, String>, ApiError> {
        let translation = sqlx::query_file!(
            "src/template/sql/get_translation_by_lang_code.sql",
            project_id,
            languages,
            name,
        )
        .fetch_one(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        serde_json::from_value(translation.content).map_err(|_| ApiError::InternalServerError)
    }
}
