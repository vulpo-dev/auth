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

pub type Translation = HashMap<String, String>;

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

    pub async fn get_by_user(
        pool: &PgPool,
        user_id: &Uuid,
        name: &str,
    ) -> Result<HashMap<String, String>, ApiError> {
        let translation = sqlx::query!(
            r#"
                with languages as (
                    select array_append(users.device_languages, project_settings.default_language) as languages
                      from users
                      join project_settings on project_settings.project_id = users.project_id 
                     where id = $1

                )
                select lang.prio, template_translations.content
                  from languages, unnest(languages.languages) WITH ORDINALITY AS lang(code, prio)
                  join templates on templates.name = $2
                  join template_translations on template_translations.language = lang.code
                                            and template_translations.template_id  = templates.id
                 order by lang.prio
                 limit 1
            "#,
            user_id,
            name,
        )
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
        let translation = sqlx::query!(
            r#"
                with languages as (
                    select array_append($2, project_settings.default_language) as languages
                      from project_settings
                     where project_id = $1

                )
                select lang.prio, template_translations.content
                  from languages, unnest(languages.languages) WITH ORDINALITY AS lang(code, prio)
                  join templates on templates.name = $3
                  join template_translations on template_translations.language = lang.code
                                            and template_translations.template_id  = templates.id
                 order by lang.prio
                 limit 1
            "#,
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
