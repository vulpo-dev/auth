use crate::mail::Email;
use crate::settings::data::TemplateEmail;
use crate::template::config::Templates;
use crate::template::data::Translation;
use crate::template::Translations;
use crate::user::data::User;
use crate::TEMPLATE;

use handlebars::Handlebars;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;
use std::collections::HashMap;
use uuid::Uuid;
use vulpo_auth_types::error::ApiError;

#[derive(Deserialize, Serialize)]
pub struct TemplateResponse {
    pub from_name: Option<String>,
    pub subject: Option<String>,
    pub body: String,
    pub redirect_to: String,
    pub project_id: Uuid,
}

#[derive(Deserialize, Serialize)]
pub struct SetTemplateView {
    pub body: String,
    pub name: String,
    pub project_id: Uuid,

    pub from_name: String,
    pub subject: String,
    pub redirect_to: String,
}

#[derive(Serialize)]
pub struct InitTemplates {
    pub id: Uuid,
    pub from_name: String,
    pub body: String,
    pub redirect_to: String,
    pub of_type: String,
    pub project_id: Uuid,
    pub translation: serde_json::Value,
    pub template_type: String,
    pub name: String,
}

#[derive(Debug)]
pub struct Template;

impl Template {
    pub async fn from_project(
        pool: &PgPool,
        project: Uuid,
        template: Templates,
    ) -> Result<Option<TemplateResponse>, ApiError> {
        let template = template.to_string();
        let row = sqlx::query_file!("src/template/sql/get_template.sql", project, template)
            .fetch_optional(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        let template = row.map(|template| TemplateResponse {
            from_name: template.from_name,
            subject: template.subject,
            body: template.body,
            redirect_to: template.redirect_to,
            project_id: template.project_id,
        });

        Ok(template)
    }

    pub fn get_body(template: Templates) -> &'static str {
        let path = format!("{}/template.hbs", template.to_string());

        TEMPLATE
            .get_file(path)
            .and_then(|file| file.contents_utf8())
            .unwrap_or("")
    }

    pub fn translate<Ctx: Serialize>(
        translations: &Translation,
        ctx: &Ctx,
    ) -> HashMap<String, String> {
        let handlebars = Handlebars::new();
        translations
            .iter()
            .map(|kv| {
                (
                    kv.0.clone(),
                    handlebars
                        .render_template(kv.1, &json!({ "props": ctx }))
                        .unwrap(),
                )
            })
            .collect()
    }

    pub fn render_subject(
        subject: &str,
        translations: &HashMap<String, String>,
    ) -> Result<String, ApiError> {
        let handlebars = Handlebars::new();
        handlebars
            .render_template(&subject, &json!({ "t": translations }))
            .map_err(|_| ApiError::TemplateRender)
    }

    pub async fn render<Ctx: Serialize>(
        template: &str,
        ctx: &Ctx,
        translations: &HashMap<String, String>,
    ) -> Result<String, ApiError> {
        let handlebars = Handlebars::new();

        let render_ctx = json!({
            "t": translations,
            "props": ctx,
        });

        handlebars
            .render_template(&template, &render_ctx)
            .map_err(|_| ApiError::TemplateRender)
    }

    pub async fn set_template(pool: &PgPool, template: &SetTemplateView) -> Result<(), ApiError> {
        sqlx::query_file!(
            "src/template/sql/set_template.sql",
            template.body,
            template.name,
            template.project_id,
            template.from_name,
            template.subject,
            template.redirect_to,
        )
        .execute(pool)
        .await
        .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
    }

    pub async fn create_email<Ctx: Serialize>(
        pool: &PgPool,
        project_id: &Uuid,
        device_languages: &Vec<String>,
        to_email: &str,
        ctx: &Ctx,
        settings: &TemplateEmail,
        template: Templates,
    ) -> Result<Email, ApiError> {
        let translations = Translations::get_by_languages(
            &pool,
            &project_id,
            &device_languages,
            &template.to_string(),
        )
        .await?;

        let translations = Template::translate(&translations, &ctx);
        let subject = Template::render_subject(&settings.subject, &translations)?;
        let content = Template::render(&settings.body, ctx, &translations).await?;

        let email = Email {
            to_email: to_email.to_owned(),
            subject,
            content,
        };

        Ok(email)
    }
}

#[derive(Serialize)]
pub struct TemplateCtx {
    pub href: String,
    pub project: String,
    pub user: Option<User>,
    pub expire_in: i32,
}
