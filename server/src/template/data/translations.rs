use crate::response::error::ApiError;

use serde::Deserialize;
use sqlx::PgPool;
use std::collections::HashMap;
use uuid::Uuid;

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

impl Translations {
    pub async fn get_by_project(
        pool: &PgPool,
        project: &Uuid,
        template: &str,
    ) -> Result<Translations, ApiError> {
        let rows = sqlx::query!(
            r#"
    			select template_translations.language
    			     , template_translations.content
    			  from templates
    			  join template_translations on template_translations.template_id = templates.id
    			 where templates.project_id = $1
    			   and templates.name = $2
    		"#,
            project,
            template,
        )
        .fetch_all(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        let value = rows
            .into_iter()
            .map(|row| (row.language, row.content))
            .collect::<HashMap<String, serde_json::Value>>();

        Ok(Translations { value })
    }

    pub async fn set(pool: &PgPool, translation: &SetTranslation) -> Result<(), ApiError> {
        sqlx::query!(
            r#"
    			with template as (
    				select id
    				  from templates
    				 where project_id = $1
    				   and name = $2
    			)
    			insert into template_translations(template_id, language, content)
    			select template.id as template_id
    			     , $3 as language
    			     , $4 as content
    			  from template
    			on conflict (template_id, language)
    			   do update set content = $4
    		"#,
            translation.project,
            translation.template,
            translation.language,
            translation.content,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn delete(pool: &PgPool, data: &DeleteTranslation) -> Result<(), ApiError> {
        sqlx::query!(
            r#"
                delete from template_translations
                 where template_translations.language = $1
                   and template_translations.template_id in (
                    select id
                      from templates
                     where project_id = $2
                       and name = $3
                   )
            "#,
            data.language,
            data.project,
            data.template,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }
}
