use crate::mail::Email;
use crate::settings::data::TemplateEmail;
use crate::template::config::{DefaultRedirect, Templates};
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
    pub from_name: String,
    pub subject: String,
    pub body: String,
    pub redirect_to: String,
    pub of_type: Templates,
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
    pub of_type: Templates,
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

struct File {
    pub path: &'static str,
    pub name: &'static str,
    pub translation: &'static str,
    pub template: Templates,
    pub template_type: &'static str,
}

const FILES: [File; 8] = [
    File {
        path: "index.hbs",
        translation: "",
        name: "index",
        template_type: "index",
        template: Templates::Index,
    },
    File {
        path: "component/button.hbs",
        translation: "",
        name: "button",
        template_type: "component",
        template: Templates::Button,
    },
    File {
        path: "view/change_email.hbs",
        translation: "translation/change_email.json",
        name: "change_email",
        template_type: "view",
        template: Templates::ChangeEmail,
    },
    File {
        path: "view/password_reset.hbs",
        translation: "translation/password_reset.json",
        name: "password_reset",
        template_type: "view",
        template: Templates::PasswordReset,
    },
    File {
        path: "view/passwordless.hbs",
        translation: "translation/passwordless.json",
        name: "passwordless",
        template_type: "view",
        template: Templates::Passwordless,
    },
    File {
        path: "view/verify_email.hbs",
        translation: "translation/verify_email.json",
        name: "verify_email",
        template_type: "view",
        template: Templates::VerifyEmail,
    },
    File {
        path: "view/password_changed.hbs",
        translation: "translation/password_changed.json",
        name: "password_changed",
        template_type: "view",
        template: Templates::PasswordChanged,
    },
    File {
        path: "view/confirm_email_change.hbs",
        translation: "translation/confirm_email_change.json",
        name: "confirm_email_change",
        template_type: "view",
        template: Templates::ConfirmEmailChange,
    },
];

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

        let template = row.map(|template| {
            let of_type = Templates::from_string(&template.of_type).unwrap();
            TemplateResponse {
                from_name: template.from_name,
                subject: template.subject,
                body: template.body,
                redirect_to: template.redirect_to,
                of_type,
                project_id: template.project_id,
            }
        });

        Ok(template)
    }

    pub fn get_body(template: Templates) -> &'static str {
        FILES
            .iter()
            .find(|&file| file.template == template)
            .map(|file| {
                TEMPLATE
                    .get_file(file.path)
                    .unwrap()
                    .contents_utf8()
                    .unwrap()
            })
            .unwrap_or("")
    }

    async fn init_handlebars(pool: &PgPool) -> Result<Handlebars<'static>, ApiError> {
        let files = sqlx::query_file!("src/template/sql/get_components.sql")
            .fetch_all(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        let mut handlebars = Handlebars::new();

        for file in files.into_iter() {
            if handlebars
                .register_template_string(&file.name, file.body)
                .is_err()
            {
                return Err(ApiError::InternalServerError);
            }
        }

        Ok(handlebars)
    }

    pub async fn insert_defaults(pool: &PgPool, project: &Uuid) -> Result<(), ApiError> {
        let templates = FILES
            .iter()
            .map(|file| {
                let content = TEMPLATE
                    .get_file(file.path)
                    .and_then(|f| f.contents_utf8())
                    .unwrap_or("");

                let translation = TEMPLATE
                    .get_file(file.translation)
                    .and_then(|f| f.contents_utf8())
                    .unwrap_or("{}");

                InitTemplates {
                    id: Uuid::new_v4(),
                    name: file.name.to_string(),
                    from_name: String::from(""),
                    body: content.to_string(),
                    redirect_to: DefaultRedirect::from_template(file.template),
                    of_type: file.template.to_string(),
                    project_id: project.clone(),
                    translation: serde_json::from_str::<serde_json::Value>(translation).unwrap(),
                    template_type: file.template_type.to_string(),
                }
            })
            .collect::<Vec<InitTemplates>>();

        let data = serde_json::to_value(&templates).unwrap();

        sqlx::query_file!("src/template/sql/insert_default_templates.sql", &data)
            .execute(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        sqlx::query_file!("src/template/sql/insert_default_template_data.sql", &data)
            .execute(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        sqlx::query_file!("src/template/sql/insert_default_translations.sql", &data)
            .execute(pool)
            .await
            .map_err(|_| ApiError::InternalServerError)?;

        Ok(())
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
                        .render_template(kv.1, &json!({ "ctx": ctx }))
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
        pool: &PgPool,
        template: &str,
        ctx: &Ctx,
        translations: &HashMap<String, String>,
    ) -> Result<String, ApiError> {
        let handlebars = Template::init_handlebars(pool).await?;

        let render_ctx = json!({
            "t": translations,
            "ctx": ctx,
        });

        let content = handlebars
            .render_template(&template, &render_ctx)
            .map_err(|_| ApiError::TemplateRender)?;

        handlebars
            .render("index", &json!({ "content": content }))
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
            template.of_type.to_string(),
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
        let content = Template::render(&pool, &settings.body, ctx, &translations).await?;

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
